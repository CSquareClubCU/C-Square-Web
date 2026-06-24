"""
Tests for the attendance app.
Covers models, services, and all 4 API endpoints.
"""

import uuid
from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone

from attendance.models import AttendanceRecord, CheckInMethod
from attendance import services
from core.exceptions import AppError
from events.models import Event, EventStatus, EventType, VolunteerAssignment
from registrations.models import Registration, RegistrationStatus
from users.models import User, UserRole


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    from rest_framework.test import APIClient
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email='admin@cuchd.in', full_name='Admin', role=UserRole.ADMIN,
        is_staff=True, is_superuser=True,
    )


@pytest.fixture
def volunteer_user(db):
    return User.objects.create_user(
        email='volunteer@cuchd.in', full_name='Volunteer', role=UserRole.VOLUNTEER,
    )


@pytest.fixture
def student(db):
    return User.objects.create_user(
        email='student@cuchd.in', full_name='Student One', role=UserRole.STUDENT, is_cu_student=True,
    )


@pytest.fixture
def event(db, admin_user):
    now = timezone.now()
    return Event.objects.create(
        title='Test Event', description='D', event_type=EventType.WORKSHOP,
        start_datetime=now + timedelta(days=1),
        end_datetime=now + timedelta(days=1, hours=4),
        venue='Block 10', capacity=100,
        registration_deadline=now + timedelta(hours=12),
        status=EventStatus.PUBLISHED,
        created_by=admin_user,
    )


@pytest.fixture
def approved_registration(db, event, student, admin_user):
    reg = Registration.objects.create(
        event=event, user=student, status=RegistrationStatus.APPROVED,
        qr_token=uuid.uuid4(),
    )
    return reg


@pytest.fixture
def attendance_record(db, approved_registration, event, student):
    return AttendanceRecord.objects.create(
        registration=approved_registration,
        event=event,
        user=student,
    )


@pytest.fixture
def volunteer_assignment(db, event, volunteer_user, admin_user):
    return VolunteerAssignment.objects.create(
        event=event, volunteer=volunteer_user, assigned_by=admin_user,
    )


# ---------------------------------------------------------------------------
# Model Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAttendanceRecordModel:
    def test_record_has_uuid_pk(self, attendance_record):
        assert isinstance(attendance_record.id, uuid.UUID)

    def test_default_not_checked_in(self, attendance_record):
        assert attendance_record.is_checked_in is False
        assert attendance_record.checked_in_at is None

    def test_str_representation(self, attendance_record):
        s = str(attendance_record)
        assert 'not checked in' in s
        assert 'student@cuchd.in' in s

    def test_one_to_one_with_registration(self, attendance_record, approved_registration):
        assert attendance_record.registration == approved_registration


# ---------------------------------------------------------------------------
# Service Tests — checkin_by_qr
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCheckinByQR:
    def test_admin_can_checkin_by_qr(self, attendance_record, approved_registration, admin_user):
        record = services.checkin_by_qr(str(approved_registration.qr_token), admin_user)
        assert record.is_checked_in is True
        assert record.check_in_method == CheckInMethod.QR
        assert record.marked_by == admin_user

    def test_assigned_volunteer_can_checkin(self, attendance_record, approved_registration, volunteer_user, volunteer_assignment):
        record = services.checkin_by_qr(str(approved_registration.qr_token), volunteer_user)
        assert record.is_checked_in is True

    def test_unassigned_volunteer_blocked(self, attendance_record, approved_registration, volunteer_user):
        with pytest.raises(AppError) as exc:
            services.checkin_by_qr(str(approved_registration.qr_token), volunteer_user)
        assert exc.value.code == 'NOT_ASSIGNED'

    def test_invalid_token_raises_400(self, admin_user):
        with pytest.raises(AppError) as exc:
            services.checkin_by_qr('not-a-uuid', admin_user)
        assert exc.value.code == 'INVALID_QR'

    def test_unknown_token_raises_400(self, admin_user):
        with pytest.raises(AppError) as exc:
            services.checkin_by_qr(str(uuid.uuid4()), admin_user)
        assert exc.value.code == 'INVALID_QR'

    def test_checkin_is_idempotent(self, attendance_record, approved_registration, admin_user):
        services.checkin_by_qr(str(approved_registration.qr_token), admin_user)
        record = services.checkin_by_qr(str(approved_registration.qr_token), admin_user)
        assert record.is_checked_in is True

    def test_checkin_sets_timestamp(self, attendance_record, approved_registration, admin_user):
        record = services.checkin_by_qr(str(approved_registration.qr_token), admin_user)
        assert record.checked_in_at is not None


# ---------------------------------------------------------------------------
# Service Tests — checkin_manual
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCheckinManual:
    def test_admin_can_manual_checkin(self, attendance_record, approved_registration, admin_user):
        record = services.checkin_manual(approved_registration.id, admin_user)
        assert record.is_checked_in is True
        assert record.check_in_method == CheckInMethod.MANUAL

    def test_nonexistent_registration_raises_404(self, admin_user):
        with pytest.raises(AppError) as exc:
            services.checkin_manual(uuid.uuid4(), admin_user)
        assert exc.value.code == 'NOT_FOUND'

    def test_unassigned_volunteer_blocked(self, attendance_record, approved_registration, volunteer_user):
        with pytest.raises(AppError) as exc:
            services.checkin_manual(approved_registration.id, volunteer_user)
        assert exc.value.code == 'NOT_ASSIGNED'


# ---------------------------------------------------------------------------
# Service Tests — export_attendance_csv
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestExportCSV:
    def test_csv_contains_header_row(self, event, attendance_record, admin_user):
        buf = services.export_attendance_csv(event, admin_user)
        content = buf.getvalue()
        assert 'Full Name' in content
        assert 'Email' in content
        assert 'Checked In' in content

    def test_csv_contains_student_data(self, event, attendance_record, admin_user, student):
        buf = services.export_attendance_csv(event, admin_user)
        content = buf.getvalue()
        assert student.email in content
        assert student.full_name in content

    def test_unassigned_volunteer_blocked(self, event, admin_user, volunteer_user):
        with pytest.raises(AppError) as exc:
            services.export_attendance_csv(event, volunteer_user)
        assert exc.value.code == 'NOT_ASSIGNED'


# ---------------------------------------------------------------------------
# View Tests — QR Check-in
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestQRCheckinView:
    def test_admin_can_checkin_via_api(self, api_client, admin_user, attendance_record, approved_registration):
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(
            '/api/attendance/checkin/',
            {'qr_token': str(approved_registration.qr_token)},
            format='json',
        )
        assert response.status_code == 200
        assert response.data['is_checked_in'] is True

    def test_missing_token_returns_400(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        response = api_client.post('/api/attendance/checkin/', {}, format='json')
        assert response.status_code == 400

    def test_student_cannot_checkin(self, api_client, student, approved_registration):
        api_client.force_authenticate(user=student)
        response = api_client.post(
            '/api/attendance/checkin/',
            {'qr_token': str(approved_registration.qr_token)},
            format='json',
        )
        assert response.status_code == 403

    def test_unauthenticated_cannot_checkin(self, api_client, approved_registration):
        response = api_client.post(
            '/api/attendance/checkin/',
            {'qr_token': str(approved_registration.qr_token)},
            format='json',
        )
        assert response.status_code in (401, 403)


# ---------------------------------------------------------------------------
# View Tests — Attendance List
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAttendanceListView:
    def test_admin_can_list_attendance(self, api_client, admin_user, event, attendance_record):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/attendance/{event.id}/list/')
        assert response.status_code == 200
        assert response.data['count'] == 1

    def test_search_by_name(self, api_client, admin_user, event, attendance_record, student):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/attendance/{event.id}/list/?search=Student')
        assert response.status_code == 200
        assert response.data['count'] == 1

    def test_search_no_match(self, api_client, admin_user, event, attendance_record):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/attendance/{event.id}/list/?search=Zzznotfound')
        assert response.status_code == 200
        assert response.data['count'] == 0

    def test_student_cannot_view_list(self, api_client, student, event):
        api_client.force_authenticate(user=student)
        response = api_client.get(f'/api/attendance/{event.id}/list/')
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# View Tests — CSV Export
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAttendanceExportView:
    def test_admin_can_export_csv(self, api_client, admin_user, event, attendance_record):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/attendance/{event.id}/export/')
        assert response.status_code == 200
        assert 'text/csv' in response['Content-Type']
        assert 'attachment' in response['Content-Disposition']

    def test_student_cannot_export(self, api_client, student, event):
        api_client.force_authenticate(user=student)
        response = api_client.get(f'/api/attendance/{event.id}/export/')
        assert response.status_code == 403
