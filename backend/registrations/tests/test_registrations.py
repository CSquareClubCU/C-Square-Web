"""
Tests for the registrations app.
Covers models, services, and all API endpoints.
"""

import uuid
from datetime import timedelta
from unittest.mock import patch, MagicMock

import pytest
from django.utils import timezone

from core.exceptions import AppError
from events.models import Event, EventStatus, EventType
from registrations import services
from registrations.models import Registration, RegistrationStatus, Team, TeamMember, TeamStatus
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
def student(db):
    return User.objects.create_user(
        email='student@cuchd.in', full_name='Student', role=UserRole.STUDENT, is_cu_student=True,
    )


@pytest.fixture
def student2(db):
    return User.objects.create_user(
        email='student2@cuchd.in', full_name='Student 2', role=UserRole.STUDENT, is_cu_student=True,
    )


@pytest.fixture
def external_user(db):
    return User.objects.create_user(
        email='outsider@gmail.com', full_name='External', role=UserRole.STUDENT, is_cu_student=False,
    )


def make_event(created_by, capacity=50, is_team=False, min_t=None, max_t=None, **kwargs):
    now = timezone.now()
    return Event.objects.create(
        title='Test Event',
        description='Test',
        event_type=EventType.WORKSHOP,
        start_datetime=now + timedelta(days=7),
        end_datetime=now + timedelta(days=7, hours=4),
        venue='Block 10',
        capacity=capacity,
        registration_deadline=now + timedelta(days=5),
        status=EventStatus.PUBLISHED,
        is_team_event=is_team,
        min_team_size=min_t,
        max_team_size=max_t,
        created_by=created_by,
        **kwargs,
    )


@pytest.fixture
def open_event(db, admin_user):
    return make_event(admin_user)


@pytest.fixture
def cu_only_event(db, admin_user):
    return make_event(admin_user, is_open_to_external=False)


@pytest.fixture
def team_event(db, admin_user):
    return make_event(admin_user, is_team=True, min_t=2, max_t=4)


@pytest.fixture
def full_event(db, admin_user, student2):
    """Event at full capacity with one approved registration."""
    event = make_event(admin_user, capacity=1, is_open_to_external=True)  # open to all for test simplicity
    Registration.objects.create(event=event, user=student2, status=RegistrationStatus.APPROVED)
    return event


# ---------------------------------------------------------------------------
# Model Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestRegistrationModel:
    def test_registration_has_uuid_pk(self, open_event, student):
        reg = Registration.objects.create(event=open_event, user=student)
        assert isinstance(reg.id, uuid.UUID)

    def test_default_status_is_pending(self, open_event, student):
        reg = Registration.objects.create(event=open_event, user=student)
        assert reg.status == RegistrationStatus.PENDING

    def test_unique_user_per_event_constraint(self, open_event, student):
        from django.db import IntegrityError
        Registration.objects.create(event=open_event, user=student)
        with pytest.raises(IntegrityError):
            Registration.objects.create(event=open_event, user=student)

    def test_str_representation(self, open_event, student):
        reg = Registration.objects.create(event=open_event, user=student)
        assert student.email in str(reg)
        assert open_event.title in str(reg)


@pytest.mark.django_db
class TestTeamModel:
    def test_team_has_uuid_pk(self, team_event, student):
        team = Team.objects.create(event=team_event, name='My Team', leader=student)
        assert isinstance(team.id, uuid.UUID)

    def test_default_status_is_pending_confirmation(self, team_event, student):
        team = Team.objects.create(event=team_event, name='My Team', leader=student)
        assert team.status == TeamStatus.PENDING_CONFIRMATION

    def test_str_representation(self, team_event, student):
        team = Team.objects.create(event=team_event, name='Alpha Team', leader=student)
        assert 'Alpha Team' in str(team)


# ---------------------------------------------------------------------------
# Service Tests — register_individual
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestRegisterIndividual:
    @patch('registrations.services.send_email')
    def test_creates_pending_registration(self, mock_email, open_event, student):
        reg = services.register_individual(open_event.id, student)
        assert reg.status == RegistrationStatus.PENDING
        assert reg.user == student

    @patch('registrations.services.send_email')
    def test_full_event_creates_waitlisted_registration(self, mock_email, full_event, student):
        reg = services.register_individual(full_event.id, student)
        assert reg.status == RegistrationStatus.WAITLISTED
        assert reg.waitlist_position == 1

    @patch('registrations.services.send_email')
    def test_waitlist_position_increments(self, mock_email, full_event, student, admin_user):
        user3 = User.objects.create_user(email='u3@cuchd.in', full_name='U3', role=UserRole.STUDENT)
        reg1 = services.register_individual(full_event.id, student)
        reg2 = services.register_individual(full_event.id, user3)
        assert reg1.waitlist_position == 1
        assert reg2.waitlist_position == 2

    def test_nonexistent_event_raises_404(self, student):
        with pytest.raises(AppError) as exc:
            services.register_individual(uuid.uuid4(), student)
        assert exc.value.code == 'NOT_FOUND'

    @patch('registrations.services.send_email')
    def test_duplicate_registration_raises_409(self, mock_email, open_event, student):
        services.register_individual(open_event.id, student)
        with pytest.raises(AppError) as exc:
            services.register_individual(open_event.id, student)
        assert exc.value.code == 'ALREADY_REGISTERED'

    @patch('registrations.services.send_email')
    def test_external_user_blocked_from_cu_only_event(self, mock_email, cu_only_event, external_user):
        with pytest.raises(AppError) as exc:
            services.register_individual(cu_only_event.id, external_user)
        assert exc.value.code == 'EXTERNAL_NOT_ALLOWED'

    def test_team_event_raises_error(self, team_event, student):
        with pytest.raises(AppError) as exc:
            services.register_individual(team_event.id, student)
        assert exc.value.code == 'TEAM_EVENT'

    @patch('registrations.services.send_email')
    def test_closed_registration_raises_400(self, mock_email, admin_user, student):
        now = timezone.now()
        closed_event = Event.objects.create(
            title='Closed', description='D', event_type=EventType.SEMINAR,
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, hours=2),
            venue='V', capacity=100,
            registration_deadline=now - timedelta(hours=1),  # deadline passed
            status=EventStatus.PUBLISHED,
            created_by=admin_user,
        )
        with pytest.raises(AppError) as exc:
            services.register_individual(closed_event.id, student)
        assert exc.value.code == 'REGISTRATION_CLOSED'


# ---------------------------------------------------------------------------
# Service Tests — cancel_registration
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCancelRegistration:
    @patch('registrations.services.send_email')
    def test_cancels_pending_registration(self, mock_email, open_event, student):
        reg = services.register_individual(open_event.id, student)
        services.cancel_registration(reg.id, student)
        reg.refresh_from_db()
        assert reg.status == RegistrationStatus.CANCELLED

    def test_cannot_cancel_other_users_registration(self, open_event, student, student2):
        reg = Registration.objects.create(event=open_event, user=student)
        with pytest.raises(AppError) as exc:
            services.cancel_registration(reg.id, student2)
        assert exc.value.code == 'NOT_FOUND'

    @patch('registrations.services.send_email')
    def test_cancel_waitlisted_promotes_next(self, mock_email, full_event, student, admin_user):
        # Create a second waitlisted user
        user_w = User.objects.create_user(email='w@cuchd.in', full_name='W', role=UserRole.STUDENT)
        wait_reg = services.register_individual(full_event.id, user_w)
        assert wait_reg.status == RegistrationStatus.WAITLISTED

        # Cancel the approved registration (student2 is already approved in the full_event fixture)
        approved = Registration.objects.get(event=full_event, status=RegistrationStatus.APPROVED)
        services.cancel_registration(approved.id, approved.user)

        wait_reg.refresh_from_db()
        assert wait_reg.status == RegistrationStatus.PENDING


# ---------------------------------------------------------------------------
# Service Tests — approve_registration
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestApproveRegistration:
    @patch('registrations.services.upload_to_blob', return_value='https://blob.example.com/qr.png')
    @patch('registrations.services.send_email')
    def test_approves_pending_registration(self, mock_email, mock_blob, open_event, student, admin_user):
        reg = Registration.objects.create(event=open_event, user=student, status=RegistrationStatus.PENDING)
        approved = services.approve_registration(reg.id, admin_user)
        approved.refresh_from_db()
        assert approved.status == RegistrationStatus.APPROVED
        assert approved.qr_token is not None
        assert approved.qr_image_url == 'https://blob.example.com/qr.png'

    def test_cannot_approve_already_approved(self, open_event, student, admin_user):
        reg = Registration.objects.create(event=open_event, user=student, status=RegistrationStatus.APPROVED)
        with pytest.raises(AppError) as exc:
            services.approve_registration(reg.id, admin_user)
        assert exc.value.code == 'INVALID_STATUS'

    def test_nonexistent_registration_raises_404(self, admin_user):
        with pytest.raises(AppError) as exc:
            services.approve_registration(uuid.uuid4(), admin_user)
        assert exc.value.code == 'NOT_FOUND'


# ---------------------------------------------------------------------------
# Service Tests — reject_registration
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestRejectRegistration:
    @patch('registrations.services.send_email')
    def test_rejects_pending_registration(self, mock_email, open_event, student, admin_user):
        reg = Registration.objects.create(event=open_event, user=student, status=RegistrationStatus.PENDING)
        rejected = services.reject_registration(reg.id, 'Does not meet criteria.', admin_user)
        rejected.refresh_from_db()
        assert rejected.status == RegistrationStatus.REJECTED
        assert rejected.rejection_reason == 'Does not meet criteria.'

    def test_cannot_reject_approved_registration(self, open_event, student, admin_user):
        reg = Registration.objects.create(event=open_event, user=student, status=RegistrationStatus.APPROVED)
        with pytest.raises(AppError) as exc:
            services.reject_registration(reg.id, 'Reason', admin_user)
        assert exc.value.code == 'INVALID_STATUS'


# ---------------------------------------------------------------------------
# View Tests — Registration
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestRegisterIndividualView:
    @patch('registrations.services.send_email')
    def test_student_can_register(self, mock_email, api_client, student, open_event):
        api_client.force_authenticate(user=student)
        response = api_client.post('/api/registrations/', {'event_id': str(open_event.id)}, format='json')
        assert response.status_code == 201
        assert response.data['status'] == 'pending'

    def test_unauthenticated_cannot_register(self, api_client, open_event):
        response = api_client.post('/api/registrations/', {'event_id': str(open_event.id)}, format='json')
        assert response.status_code in (401, 403)

    def test_nonexistent_event_returns_404(self, api_client, student):
        """Registering for a nonexistent event returns 404."""
        api_client.force_authenticate(user=student)
        valid_nonexistent_id = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
        response = api_client.post('/api/registrations/', {'event_id': valid_nonexistent_id}, format='json')
        assert response.status_code == 404

    def test_missing_event_id_returns_400(self, api_client, student):
        api_client.force_authenticate(user=student)
        response = api_client.post('/api/registrations/', {}, format='json')
        assert response.status_code == 400


@pytest.mark.django_db
class TestMyRegistrationsView:
    @patch('registrations.services.send_email')
    def test_student_can_view_own_registrations(self, mock_email, api_client, student, open_event):
        api_client.force_authenticate(user=student)
        services.register_individual(open_event.id, student)
        response = api_client.get('/api/registrations/me/')
        assert response.status_code == 200
        # Response is now paginated: { count, next, previous, results }
        assert response.data['count'] == 1
        assert len(response.data['results']) == 1

    def test_cannot_see_other_users_registrations(self, api_client, student, student2, open_event):
        Registration.objects.create(event=open_event, user=student2)
        api_client.force_authenticate(user=student)
        response = api_client.get('/api/registrations/me/')
        assert response.status_code == 200
        assert response.data['count'] == 0
        assert len(response.data['results']) == 0


@pytest.mark.django_db
class TestAdminRegistrationViews:
    def test_admin_can_list_event_registrations(self, api_client, admin_user, open_event, student):
        Registration.objects.create(event=open_event, user=student)
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/registrations/event/{open_event.id}/')
        assert response.status_code == 200
        # Response is now paginated
        assert response.data['count'] == 1
        assert len(response.data['results']) == 1

    def test_student_cannot_list_event_registrations(self, api_client, student, open_event):
        api_client.force_authenticate(user=student)
        response = api_client.get(f'/api/registrations/event/{open_event.id}/')
        assert response.status_code == 403

    @patch('registrations.services.upload_to_blob', return_value='https://blob.example.com/qr.png')
    @patch('registrations.services.send_email')
    def test_admin_can_approve_registration(self, mock_email, mock_blob, api_client, admin_user, open_event, student):
        reg = Registration.objects.create(event=open_event, user=student, status=RegistrationStatus.PENDING)
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/registrations/{reg.id}/approve/')
        assert response.status_code == 200
        assert response.data['status'] == 'approved'

    @patch('registrations.services.send_email')
    def test_admin_can_reject_registration(self, mock_email, api_client, admin_user, open_event, student):
        reg = Registration.objects.create(event=open_event, user=student, status=RegistrationStatus.PENDING)
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/registrations/{reg.id}/reject/', {'reason': 'Not eligible.'}, format='json')
        assert response.status_code == 200
        assert response.data['status'] == 'rejected'

    def test_reject_requires_reason(self, api_client, admin_user, open_event, student):
        reg = Registration.objects.create(event=open_event, user=student, status=RegistrationStatus.PENDING)
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/registrations/{reg.id}/reject/', {}, format='json')
        assert response.status_code == 400

    def test_admin_can_move_from_waitlist(self, api_client, admin_user, full_event, student):
        waitlisted = Registration.objects.create(
            event=full_event, user=student,
            status=RegistrationStatus.WAITLISTED, waitlist_position=1,
        )
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/registrations/{waitlisted.id}/move-from-waitlist/')
        assert response.status_code == 200
        assert response.data['status'] == 'pending'

    @patch('registrations.services.send_email')
    def test_student_can_cancel_own_registration(self, mock_email, api_client, open_event, student):
        reg = Registration.objects.create(event=open_event, user=student, status=RegistrationStatus.PENDING)
        api_client.force_authenticate(user=student)
        response = api_client.post(f'/api/registrations/{reg.id}/cancel/')
        assert response.status_code == 200
