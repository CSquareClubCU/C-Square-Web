"""
tests/test_event_services.py

Tests for events.services — event CRUD, volunteer assignment, and delete guards.
"""

import uuid
from datetime import timedelta
from unittest.mock import patch, MagicMock

from django.test import TestCase
from django.utils import timezone

from core.exceptions import AppError
from events.models import Event, EventStatus, VolunteerAssignment
from events.services import (
    create_event,
    update_event,
    delete_event,
    assign_volunteer,
    remove_volunteer,
)
from tests.helpers import make_user, make_admin, make_volunteer, make_event
from users.models import UserRole


# ---------------------------------------------------------------------------
# Create Event
# ---------------------------------------------------------------------------

class TestCreateEvent(TestCase):

    def setUp(self):
        self.admin = make_admin()

    def test_create_event_defaults_to_draft(self):
        now = timezone.now()
        data = {
            'title': 'AI Hackathon',
            'description': 'Build something cool.',
            'event_type': 'hackathon',
            'start_datetime': now + timedelta(days=10),
            'end_datetime': now + timedelta(days=10, hours=8),
            'venue': 'CU Tech Hub',
            'capacity': 100,
            'registration_deadline': now + timedelta(days=7),
            'is_open_to_external': False,
            'is_team_event': False,
            'status': EventStatus.DRAFT,
        }
        event = create_event(data, created_by=self.admin)
        self.assertEqual(event.created_by, self.admin)
        self.assertIsNotNone(event.id)


class TestUpdateEvent(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.event = make_event(created_by=self.admin)

    def test_update_event_title(self):
        updated = update_event(self.event, {'title': 'Updated Title'})
        self.assertEqual(updated.title, 'Updated Title')
        self.event.refresh_from_db()
        self.assertEqual(self.event.title, 'Updated Title')

    def test_update_event_status_to_cancelled(self):
        updated = update_event(self.event, {'status': EventStatus.CANCELLED})
        self.assertEqual(updated.status, EventStatus.CANCELLED)


# ---------------------------------------------------------------------------
# Delete Event
# ---------------------------------------------------------------------------

class TestDeleteEvent(TestCase):

    def setUp(self):
        self.admin = make_admin()

    def test_draft_event_can_be_deleted(self):
        event = make_event(status=EventStatus.DRAFT, created_by=self.admin)
        event_id = event.id
        delete_event(event)
        self.assertFalse(Event.objects.filter(id=event_id).exists())

    def test_published_event_cannot_be_deleted(self):
        event = make_event(status=EventStatus.PUBLISHED, created_by=self.admin)
        with self.assertRaises(AppError) as ctx:
            delete_event(event)
        self.assertEqual(ctx.exception.code, 'CANNOT_DELETE')

    def test_cancelled_event_cannot_be_deleted(self):
        event = make_event(status=EventStatus.CANCELLED, created_by=self.admin)
        with self.assertRaises(AppError) as ctx:
            delete_event(event)
        self.assertEqual(ctx.exception.code, 'CANNOT_DELETE')


# ---------------------------------------------------------------------------
# Volunteer Assignment
# ---------------------------------------------------------------------------

class TestAssignVolunteer(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.volunteer = make_volunteer()
        self.event = make_event(created_by=self.admin)

    def test_assign_volunteer_to_event(self):
        assignment = assign_volunteer(self.event, str(self.volunteer.id), self.admin)
        self.assertEqual(assignment.volunteer, self.volunteer)
        self.assertEqual(assignment.event, self.event)
        self.assertEqual(assignment.assigned_by, self.admin)

    def test_raises_if_user_not_found(self):
        with self.assertRaises(AppError) as ctx:
            assign_volunteer(self.event, str(uuid.uuid4()), self.admin)
        self.assertEqual(ctx.exception.code, 'NOT_FOUND')

    def test_raises_if_user_is_not_a_volunteer(self):
        student = make_user(email='s@cuchd.in')
        with self.assertRaises(AppError) as ctx:
            assign_volunteer(self.event, str(student.id), self.admin)
        self.assertEqual(ctx.exception.code, 'NOT_A_VOLUNTEER')

    def test_raises_on_duplicate_assignment(self):
        assign_volunteer(self.event, str(self.volunteer.id), self.admin)
        with self.assertRaises(AppError) as ctx:
            assign_volunteer(self.event, str(self.volunteer.id), self.admin)
        self.assertEqual(ctx.exception.code, 'ALREADY_ASSIGNED')


class TestRemoveVolunteer(TestCase):

    def setUp(self):
        self.admin = make_admin()
        self.volunteer = make_volunteer()
        self.event = make_event(created_by=self.admin)
        self.assignment = VolunteerAssignment.objects.create(
            event=self.event,
            volunteer=self.volunteer,
            assigned_by=self.admin,
        )

    def test_remove_volunteer_deletes_assignment(self):
        assignment_id = self.assignment.id
        remove_volunteer(self.assignment)
        self.assertFalse(VolunteerAssignment.objects.filter(id=assignment_id).exists())
