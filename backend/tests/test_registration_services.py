"""
tests/test_registration_services.py

Tests for registrations.services — the most complex part of the backend.
All email sends and QR generation are patched so tests are fast and offline.
"""

from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.utils import timezone

from core.exceptions import AppError
from events.models import EventStatus
from registrations.models import (
    Registration, RegistrationStatus,
    Team, TeamMember, TeamStatus,
)
from registrations.services import (
    create_individual_registration,
    create_team_registration,
    approve_registration,
    reject_registration,
    cancel_registration,
    confirm_team_membership,
)
from tests.helpers import make_user, make_admin, make_event


# ---------------------------------------------------------------------------
# Patch targets — functions imported into registrations.services namespace
# ---------------------------------------------------------------------------
PATCH_RECEIVED = 'registrations.services.send_registration_received_email'
PATCH_APPROVED = 'registrations.services.send_registration_approved_email'
PATCH_REJECTED = 'registrations.services.send_registration_rejected_email'
PATCH_WAITLIST = 'registrations.services.send_waitlist_email'
PATCH_PROMOTED = 'registrations.services.send_waitlist_promoted_email'
PATCH_INVITE   = 'registrations.services.send_teammate_invite_email'
PATCH_QR       = 'registrations.services._generate_qr_image'


# ---------------------------------------------------------------------------
# Individual Registration
# ---------------------------------------------------------------------------

class TestCreateIndividualRegistration(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.user = make_user()
        self.event = make_event(capacity=10, created_by=self.admin)

    @patch(PATCH_RECEIVED)
    def test_successful_registration_returns_pending(self, mock_email):
        reg = create_individual_registration(str(self.event.id), self.user, {})
        self.assertEqual(reg.status, RegistrationStatus.PENDING)
        self.assertEqual(reg.user, self.user)
        self.assertEqual(reg.event, self.event)
        mock_email.assert_called_once_with(reg)

    @patch(PATCH_WAITLIST)
    def test_registration_when_full_goes_to_waitlist(self, mock_email):
        # Fill the event to capacity
        other_admin = make_admin(email='oa@cuchd.in')
        for i in range(self.event.capacity):
            u = make_user(email=f'filler{i}@cuchd.in')
            Registration.objects.create(
                event=self.event, user=u, status=RegistrationStatus.APPROVED
            )
        reg = create_individual_registration(str(self.event.id), self.user, {})
        self.assertEqual(reg.status, RegistrationStatus.WAITLISTED)
        self.assertEqual(reg.waitlist_position, 1)
        mock_email.assert_called_once_with(reg)

    @patch(PATCH_WAITLIST)
    def test_waitlist_positions_are_sequential(self, mock_email):
        """Second waitlisted person should get position 2."""
        for i in range(self.event.capacity):
            u = make_user(email=f'cap{i}@cuchd.in')
            Registration.objects.create(
                event=self.event, user=u, status=RegistrationStatus.APPROVED
            )
        user2 = make_user(email='w2@cuchd.in')
        reg1 = create_individual_registration(str(self.event.id), self.user, {})
        reg2 = create_individual_registration(str(self.event.id), user2, {})
        self.assertEqual(reg1.waitlist_position, 1)
        self.assertEqual(reg2.waitlist_position, 2)

    def test_raises_if_event_not_found(self):
        import uuid
        with self.assertRaises(AppError) as ctx:
            create_individual_registration(str(uuid.uuid4()), self.user, {})
        self.assertEqual(ctx.exception.code, 'NOT_FOUND')

    def test_raises_if_event_not_published(self):
        draft_event = make_event(status=EventStatus.DRAFT, created_by=self.admin)
        with self.assertRaises(AppError) as ctx:
            create_individual_registration(str(draft_event.id), self.user, {})
        self.assertEqual(ctx.exception.code, 'NOT_FOUND')

    def test_raises_if_registration_deadline_passed(self):
        past_deadline_event = make_event(
            days_until_deadline=-1, created_by=self.admin
        )
        with self.assertRaises(AppError) as ctx:
            create_individual_registration(str(past_deadline_event.id), self.user, {})
        self.assertEqual(ctx.exception.code, 'REGISTRATION_CLOSED')

    def test_raises_for_external_student_on_cu_only_event(self):
        external_user = make_user(email='ext@gmail.com', is_cu_student=False)
        cu_only_event = make_event(is_open_to_external=False, created_by=self.admin)
        with self.assertRaises(AppError) as ctx:
            create_individual_registration(str(cu_only_event.id), external_user, {})
        self.assertEqual(ctx.exception.code, 'EXTERNAL_NOT_ALLOWED')

    @patch(PATCH_RECEIVED)
    def test_external_student_allowed_on_open_event(self, mock_email):
        external_user = make_user(email='ext@gmail.com', is_cu_student=False)
        open_event = make_event(is_open_to_external=True, created_by=self.admin)
        reg = create_individual_registration(str(open_event.id), external_user, {})
        self.assertEqual(reg.status, RegistrationStatus.PENDING)

    @patch(PATCH_RECEIVED)
    def test_raises_on_duplicate_registration(self, mock_email):
        create_individual_registration(str(self.event.id), self.user, {})
        with self.assertRaises(AppError) as ctx:
            create_individual_registration(str(self.event.id), self.user, {})
        self.assertEqual(ctx.exception.code, 'ALREADY_REGISTERED')
        self.assertEqual(ctx.exception.http_status, 409)

    @patch(PATCH_RECEIVED)
    def test_user_profile_updated_from_registration_data(self, mock_email):
        data = {'full_name': 'Karan Verma', 'student_uid': '23BCE1234', 'branch': 'CSE'}
        self.user.full_name = ''
        self.user.save()
        create_individual_registration(str(self.event.id), self.user, data)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, 'Karan Verma')
        self.assertEqual(self.user.student_uid, '23BCE1234')


# ---------------------------------------------------------------------------
# Approve Registration
# ---------------------------------------------------------------------------

class TestApproveRegistration(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.user = make_user()
        self.event = make_event(capacity=10, created_by=self.admin)
        self.registration = Registration.objects.create(
            event=self.event,
            user=self.user,
            status=RegistrationStatus.PENDING,
        )

    @patch(PATCH_APPROVED)
    @patch(PATCH_QR, return_value='/media/qr-codes/test/qr.png')
    def test_approve_sets_status_and_qr_token(self, mock_qr, mock_email):
        reg = approve_registration(str(self.registration.id), self.admin)
        self.assertEqual(reg.status, RegistrationStatus.APPROVED)
        self.assertIsNotNone(reg.qr_token)
        self.assertIsNotNone(reg.approved_at)

    @patch(PATCH_APPROVED)
    @patch(PATCH_QR, return_value='/media/qr-codes/test/qr.png')
    def test_approve_creates_attendance_record(self, mock_qr, mock_email):
        from attendance.models import AttendanceRecord
        reg = approve_registration(str(self.registration.id), self.admin)
        record = AttendanceRecord.objects.filter(registration=reg).first()
        self.assertIsNotNone(record)
        self.assertFalse(record.is_checked_in)

    @patch(PATCH_APPROVED)
    @patch(PATCH_QR, return_value='/media/qr-codes/test/qr.png')
    def test_approve_sends_email(self, mock_qr, mock_email):
        reg = approve_registration(str(self.registration.id), self.admin)
        mock_email.assert_called_once_with(reg)

    @patch(PATCH_QR, return_value='/media/qr.png')
    def test_approve_raises_if_not_pending(self, mock_qr):
        self.registration.status = RegistrationStatus.APPROVED
        self.registration.save()
        with self.assertRaises(AppError) as ctx:
            approve_registration(str(self.registration.id), self.admin)
        self.assertEqual(ctx.exception.code, 'INVALID_STATUS')

    def test_approve_raises_if_not_found(self):
        import uuid
        with self.assertRaises(AppError) as ctx:
            approve_registration(str(uuid.uuid4()), self.admin)
        self.assertEqual(ctx.exception.code, 'NOT_FOUND')


# ---------------------------------------------------------------------------
# Reject Registration
# ---------------------------------------------------------------------------

class TestRejectRegistration(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.user = make_user()
        self.event = make_event(created_by=self.admin)
        self.registration = Registration.objects.create(
            event=self.event,
            user=self.user,
            status=RegistrationStatus.PENDING,
        )

    @patch(PATCH_REJECTED)
    def test_reject_sets_status_and_reason(self, mock_email):
        reg = reject_registration(str(self.registration.id), 'Incomplete profile', self.admin)
        self.assertEqual(reg.status, RegistrationStatus.REJECTED)
        self.assertEqual(reg.rejection_reason, 'Incomplete profile')
        mock_email.assert_called_once_with(reg)

    @patch(PATCH_REJECTED)
    def test_reject_works_for_waitlisted_registration(self, mock_email):
        self.registration.status = RegistrationStatus.WAITLISTED
        self.registration.save()
        reg = reject_registration(str(self.registration.id), 'Event cancelled', self.admin)
        self.assertEqual(reg.status, RegistrationStatus.REJECTED)

    def test_reject_raises_if_already_approved(self):
        self.registration.status = RegistrationStatus.APPROVED
        self.registration.save()
        with self.assertRaises(AppError) as ctx:
            reject_registration(str(self.registration.id), 'Too late', self.admin)
        self.assertEqual(ctx.exception.code, 'INVALID_STATUS')


# ---------------------------------------------------------------------------
# Cancel Registration & Waitlist Auto-Promotion
# ---------------------------------------------------------------------------

class TestCancelRegistration(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.user = make_user()
        self.event = make_event(capacity=1, created_by=self.admin)
        self.registration = Registration.objects.create(
            event=self.event,
            user=self.user,
            status=RegistrationStatus.APPROVED,
        )

    def test_owner_can_cancel(self):
        reg = cancel_registration(str(self.registration.id), self.user)
        self.assertEqual(reg.status, RegistrationStatus.CANCELLED)

    def test_admin_can_cancel_any_registration(self):
        reg = cancel_registration(str(self.registration.id), self.admin)
        self.assertEqual(reg.status, RegistrationStatus.CANCELLED)

    def test_other_user_cannot_cancel(self):
        other = make_user(email='other@cuchd.in')
        with self.assertRaises(AppError) as ctx:
            cancel_registration(str(self.registration.id), other)
        self.assertEqual(ctx.exception.code, 'FORBIDDEN')

    @patch(PATCH_PROMOTED)
    def test_cancel_approved_promotes_first_waitlisted(self, mock_email):
        """Cancelling an approved registration should auto-promote position #1."""
        waitlisted_user = make_user(email='waiting@cuchd.in')
        waitlisted_reg = Registration.objects.create(
            event=self.event,
            user=waitlisted_user,
            status=RegistrationStatus.WAITLISTED,
            waitlist_position=1,
        )
        cancel_registration(str(self.registration.id), self.user)

        waitlisted_reg.refresh_from_db()
        self.assertEqual(waitlisted_reg.status, RegistrationStatus.PENDING)
        self.assertIsNone(waitlisted_reg.waitlist_position)
        mock_email.assert_called_once_with(waitlisted_reg)

    def test_cancel_pending_does_not_trigger_promotion(self):
        """Cancelling a pending (not approved) registration should not promote anyone."""
        self.registration.status = RegistrationStatus.PENDING
        self.registration.save()
        waitlisted_user = make_user(email='waiting@cuchd.in')
        waitlisted_reg = Registration.objects.create(
            event=self.event,
            user=waitlisted_user,
            status=RegistrationStatus.WAITLISTED,
            waitlist_position=1,
        )
        cancel_registration(str(self.registration.id), self.user)
        waitlisted_reg.refresh_from_db()
        # Should still be waitlisted — no approved slot freed
        self.assertEqual(waitlisted_reg.status, RegistrationStatus.WAITLISTED)

    @patch(PATCH_PROMOTED)
    def test_waitlist_positions_reordered_after_promotion(self, mock_email):
        """After promotion, remaining waitlisted users should be re-numbered."""
        w1 = make_user(email='w1@cuchd.in')
        w2 = make_user(email='w2@cuchd.in')
        w3 = make_user(email='w3@cuchd.in')
        reg_w1 = Registration.objects.create(
            event=self.event, user=w1,
            status=RegistrationStatus.WAITLISTED, waitlist_position=1
        )
        reg_w2 = Registration.objects.create(
            event=self.event, user=w2,
            status=RegistrationStatus.WAITLISTED, waitlist_position=2
        )
        reg_w3 = Registration.objects.create(
            event=self.event, user=w3,
            status=RegistrationStatus.WAITLISTED, waitlist_position=3
        )
        # Cancel the approved registration — promotes w1
        cancel_registration(str(self.registration.id), self.user)

        reg_w1.refresh_from_db()
        reg_w2.refresh_from_db()
        reg_w3.refresh_from_db()
        # w1 promoted to pending; w2 and w3 re-numbered to 1 and 2
        self.assertEqual(reg_w1.status, RegistrationStatus.PENDING)
        self.assertEqual(reg_w2.waitlist_position, 1)
        self.assertEqual(reg_w3.waitlist_position, 2)


# ---------------------------------------------------------------------------
# Team Registration
# ---------------------------------------------------------------------------

class TestCreateTeamRegistration(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.leader = make_user(email='leader@cuchd.in')
        self.event = make_event(
            is_team_event=True,
            min_team_size=2,
            max_team_size=4,
            created_by=self.admin
        )

    @patch(PATCH_INVITE)
    @patch(PATCH_RECEIVED)
    def test_team_registration_creates_team_and_leader_registration(self, mock_recv, mock_invite):
        data = {
            'team_name': 'Alpha Squad',
            'teammates': [
                {'email': 'mate1@cuchd.in'},
                {'email': 'mate2@cuchd.in'},
            ],
        }
        team = create_team_registration(str(self.event.id), self.leader, data)
        self.assertIsNotNone(team)
        self.assertEqual(team.name, 'Alpha Squad')
        self.assertEqual(team.leader, self.leader)
        self.assertEqual(team.status, TeamStatus.PENDING_CONFIRMATION)

        leader_reg = Registration.objects.filter(event=self.event, user=self.leader).first()
        self.assertIsNotNone(leader_reg)
        self.assertTrue(leader_reg.is_team_registration)

    @patch(PATCH_INVITE)
    @patch(PATCH_RECEIVED)
    def test_team_registration_creates_team_member_records(self, mock_recv, mock_invite):
        data = {
            'team_name': 'Beta Squad',
            'teammates': [{'email': 'tm1@cuchd.in'}, {'email': 'tm2@cuchd.in'}],
        }
        team = create_team_registration(str(self.event.id), self.leader, data)
        members = TeamMember.objects.filter(team=team)
        self.assertEqual(members.count(), 2)
        emails = set(members.values_list('email', flat=True))
        self.assertEqual(emails, {'tm1@cuchd.in', 'tm2@cuchd.in'})

    @patch(PATCH_INVITE)
    @patch(PATCH_RECEIVED)
    def test_invite_emails_sent_for_each_teammate(self, mock_recv, mock_invite):
        data = {
            'team_name': 'Gamma Squad',
            'teammates': [{'email': 'a@cuchd.in'}, {'email': 'b@cuchd.in'}],
        }
        team = create_team_registration(str(self.event.id), self.leader, data)
        self.assertEqual(mock_invite.call_count, 2)

    def test_raises_for_non_team_event(self):
        solo_event = make_event(is_team_event=False, created_by=self.admin)
        data = {'team_name': 'X', 'teammates': [{'email': 'x@cuchd.in'}]}
        with self.assertRaises(AppError) as ctx:
            create_team_registration(str(solo_event.id), self.leader, data)
        self.assertEqual(ctx.exception.code, 'NOT_A_TEAM_EVENT')

    def test_raises_if_team_size_below_minimum(self):
        # min=2, so leader alone (total=1) is too small
        data = {'team_name': 'Solo', 'teammates': []}
        with self.assertRaises(AppError) as ctx:
            create_team_registration(str(self.event.id), self.leader, data)
        self.assertEqual(ctx.exception.code, 'INVALID_TEAM_SIZE')

    def test_raises_if_team_size_above_maximum(self):
        # max=4, so leader + 4 teammates = 5 is too large
        data = {
            'team_name': 'Huge',
            'teammates': [
                {'email': f't{i}@cuchd.in'} for i in range(4)
            ],
        }
        with self.assertRaises(AppError) as ctx:
            create_team_registration(str(self.event.id), self.leader, data)
        self.assertEqual(ctx.exception.code, 'INVALID_TEAM_SIZE')

    @patch(PATCH_INVITE)
    @patch(PATCH_RECEIVED)
    def test_raises_if_leader_already_registered(self, mock_recv, mock_invite):
        data = {
            'team_name': 'First',
            'teammates': [{'email': 'q@cuchd.in'}, {'email': 'r@cuchd.in'}],
        }
        create_team_registration(str(self.event.id), self.leader, data)
        with self.assertRaises(AppError) as ctx:
            create_team_registration(str(self.event.id), self.leader, data)
        self.assertEqual(ctx.exception.code, 'ALREADY_REGISTERED')


# ---------------------------------------------------------------------------
# Confirm Team Membership
# ---------------------------------------------------------------------------

class TestConfirmTeamMembership(TestCase):

    def setUp(self):
        import uuid
        self.admin = make_admin()
        self.leader = make_user(email='leader@cuchd.in')
        self.event = make_event(
            is_team_event=True, min_team_size=2, max_team_size=4,
            created_by=self.admin
        )
        self.team = Team.objects.create(
            event=self.event,
            name='Test Team',
            leader=self.leader,
            status=TeamStatus.PENDING_CONFIRMATION,
        )
        self.token = uuid.uuid4()
        self.member = TeamMember.objects.create(
            team=self.team,
            email='mate@cuchd.in',
            confirmation_token=self.token,
        )
        self.teammate = make_user(email='mate@cuchd.in')

    def test_confirm_sets_has_confirmed_and_links_user(self):
        result = confirm_team_membership(str(self.team.id), str(self.token), self.teammate)
        self.assertTrue(result.has_confirmed)
        self.assertEqual(result.user, self.teammate)
        self.assertIsNone(result.confirmation_token)  # Token must be invalidated

    def test_confirm_creates_registration_for_teammate(self):
        confirm_team_membership(str(self.team.id), str(self.token), self.teammate)
        reg = Registration.objects.filter(event=self.event, user=self.teammate).first()
        self.assertIsNotNone(reg)
        self.assertTrue(reg.is_team_registration)

    def test_confirm_raises_on_invalid_token(self):
        import uuid
        with self.assertRaises(AppError) as ctx:
            confirm_team_membership(str(self.team.id), str(uuid.uuid4()), self.teammate)
        self.assertEqual(ctx.exception.code, 'INVALID_TOKEN')

    def test_confirm_raises_if_already_confirmed(self):
        confirm_team_membership(str(self.team.id), str(self.token), self.teammate)
        # Try confirming again — token is now None
        with self.assertRaises(AppError) as ctx:
            confirm_team_membership(str(self.team.id), str(self.token), self.teammate)
        self.assertEqual(ctx.exception.code, 'INVALID_TOKEN')

    def test_all_confirmed_advances_team_to_pending_approval(self):
        """When the last unconfirmed member confirms, team moves to pending_approval."""
        result = confirm_team_membership(str(self.team.id), str(self.token), self.teammate)
        self.team.refresh_from_db()
        self.assertEqual(self.team.status, TeamStatus.PENDING_APPROVAL)
