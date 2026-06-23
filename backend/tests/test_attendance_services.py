"""
tests/test_attendance_services.py

Tests for attendance.services — QR check-in and manual check-in flows.
"""

import uuid
from unittest.mock import patch

from django.test import TestCase
from django.utils import timezone

from attendance.models import AttendanceRecord
from attendance.services import checkin_by_qr, checkin_manual, get_attendance_list
from core.exceptions import AppError
from events.models import VolunteerAssignment
from registrations.models import Registration, RegistrationStatus
from tests.helpers import make_user, make_admin, make_volunteer, make_event


def make_approved_registration(event, user) -> Registration:
    """Create an approved registration with a QR token and AttendanceRecord."""
    reg = Registration.objects.create(
        event=event,
        user=user,
        status=RegistrationStatus.APPROVED,
        qr_token=uuid.uuid4(),
    )
    AttendanceRecord.objects.create(
        registration=reg,
        event=event,
        user=user,
    )
    return reg


# ---------------------------------------------------------------------------
# QR Check-in
# ---------------------------------------------------------------------------

class TestCheckinByQR(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.user = make_user()
        self.volunteer = make_volunteer()
        self.event = make_event(created_by=self.admin)
        self.registration = make_approved_registration(self.event, self.user)

    def test_admin_can_checkin_with_valid_qr(self):
        record = checkin_by_qr(str(self.registration.qr_token), self.admin)
        self.assertTrue(record.is_checked_in)
        self.assertEqual(record.check_in_method, 'qr')
        self.assertEqual(record.marked_by, self.admin)
        self.assertIsNotNone(record.checked_in_at)

    def test_assigned_volunteer_can_checkin(self):
        VolunteerAssignment.objects.create(
            event=self.event,
            volunteer=self.volunteer,
            assigned_by=self.admin,
        )
        record = checkin_by_qr(str(self.registration.qr_token), self.volunteer)
        self.assertTrue(record.is_checked_in)

    def test_unassigned_volunteer_cannot_checkin(self):
        with self.assertRaises(AppError) as ctx:
            checkin_by_qr(str(self.registration.qr_token), self.volunteer)
        self.assertEqual(ctx.exception.code, 'FORBIDDEN')

    def test_raises_on_invalid_token(self):
        with self.assertRaises(AppError) as ctx:
            checkin_by_qr(str(uuid.uuid4()), self.admin)
        self.assertEqual(ctx.exception.code, 'INVALID_TOKEN')

    def test_raises_on_non_approved_registration(self):
        pending_reg = Registration.objects.create(
            event=self.event,
            user=make_user(email='p@cuchd.in'),
            status=RegistrationStatus.PENDING,
            qr_token=uuid.uuid4(),
        )
        with self.assertRaises(AppError) as ctx:
            checkin_by_qr(str(pending_reg.qr_token), self.admin)
        self.assertEqual(ctx.exception.code, 'INVALID_TOKEN')

    def test_raises_on_duplicate_checkin(self):
        checkin_by_qr(str(self.registration.qr_token), self.admin)
        with self.assertRaises(AppError) as ctx:
            checkin_by_qr(str(self.registration.qr_token), self.admin)
        self.assertEqual(ctx.exception.code, 'ALREADY_CHECKED_IN')
        self.assertEqual(ctx.exception.http_status, 409)


# ---------------------------------------------------------------------------
# Manual Check-in
# ---------------------------------------------------------------------------

class TestManualCheckin(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.user = make_user()
        self.volunteer = make_volunteer()
        self.event = make_event(created_by=self.admin)
        self.registration = make_approved_registration(self.event, self.user)

    def test_admin_can_manual_checkin(self):
        record = checkin_manual(str(self.registration.id), self.admin)
        self.assertTrue(record.is_checked_in)
        self.assertEqual(record.check_in_method, 'manual')
        self.assertEqual(record.marked_by, self.admin)

    def test_assigned_volunteer_can_manual_checkin(self):
        VolunteerAssignment.objects.create(
            event=self.event, volunteer=self.volunteer, assigned_by=self.admin
        )
        record = checkin_manual(str(self.registration.id), self.volunteer)
        self.assertTrue(record.is_checked_in)

    def test_unassigned_volunteer_cannot_manual_checkin(self):
        with self.assertRaises(AppError) as ctx:
            checkin_manual(str(self.registration.id), self.volunteer)
        self.assertEqual(ctx.exception.code, 'FORBIDDEN')

    def test_raises_if_registration_not_found(self):
        with self.assertRaises(AppError) as ctx:
            checkin_manual(str(uuid.uuid4()), self.admin)
        self.assertEqual(ctx.exception.code, 'NOT_FOUND')

    def test_raises_if_not_approved(self):
        pending_reg = Registration.objects.create(
            event=self.event,
            user=make_user(email='pend@cuchd.in'),
            status=RegistrationStatus.PENDING,
        )
        with self.assertRaises(AppError) as ctx:
            checkin_manual(str(pending_reg.id), self.admin)
        self.assertEqual(ctx.exception.code, 'INVALID_STATUS')

    def test_raises_on_duplicate_manual_checkin(self):
        checkin_manual(str(self.registration.id), self.admin)
        with self.assertRaises(AppError) as ctx:
            checkin_manual(str(self.registration.id), self.admin)
        self.assertEqual(ctx.exception.code, 'ALREADY_CHECKED_IN')


# ---------------------------------------------------------------------------
# Attendance List
# ---------------------------------------------------------------------------

class TestGetAttendanceList(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.user = make_user()
        self.volunteer = make_volunteer()
        self.event = make_event(created_by=self.admin)
        make_approved_registration(self.event, self.user)

    def test_admin_can_get_attendance_list(self):
        records = get_attendance_list(str(self.event.id), self.admin)
        self.assertEqual(len(records), 1)

    def test_assigned_volunteer_can_get_attendance_list(self):
        VolunteerAssignment.objects.create(
            event=self.event, volunteer=self.volunteer, assigned_by=self.admin
        )
        records = get_attendance_list(str(self.event.id), self.volunteer)
        self.assertEqual(len(records), 1)

    def test_unassigned_volunteer_cannot_get_list(self):
        with self.assertRaises(AppError) as ctx:
            get_attendance_list(str(self.event.id), self.volunteer)
        self.assertEqual(ctx.exception.code, 'FORBIDDEN')

    def test_raises_if_event_not_found(self):
        with self.assertRaises(AppError) as ctx:
            get_attendance_list(str(uuid.uuid4()), self.admin)
        self.assertEqual(ctx.exception.code, 'NOT_FOUND')
