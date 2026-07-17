"""
Tests for the events app.
Covers models, all service functions, and all 10 API endpoints.
Follows Arrange → Act → Assert pattern.
"""

import uuid
from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from core.exceptions import AppError
from events.models import Event, EventStatus, EventType, VolunteerAssignment
from events import services
from users.models import User, UserRole


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email='admin@cuchd.in', full_name='Admin User',
        role=UserRole.ADMIN, is_staff=True, is_superuser=True,
    )


@pytest.fixture
def student_user(db):
    return User.objects.create_user(
        email='student@cuchd.in', full_name='Student User',
        role=UserRole.STUDENT, is_cu_student=True,
    )


@pytest.fixture
def volunteer_user(db):
    return User.objects.create_user(
        email='volunteer@cuchd.in', full_name='Volunteer User',
        role=UserRole.VOLUNTEER, is_cu_student=True,
    )


def make_event(created_by, **kwargs):
    """Helper: create an event with sensible defaults."""
    now = timezone.now()
    defaults = dict(
        title='Test Event',
        description='<p>Test description</p>',
        event_type=EventType.WORKSHOP,
        start_datetime=now + timedelta(days=7),
        end_datetime=now + timedelta(days=7, hours=4),
        venue='Block 10, CU',
        capacity=100,
        registration_deadline=now + timedelta(days=5),
        status=EventStatus.PUBLISHED,
        created_by=created_by,
    )
    defaults.update(kwargs)
    return Event.objects.create(**defaults)


@pytest.fixture
def published_event(db, admin_user):
    return make_event(admin_user, status=EventStatus.PUBLISHED)


@pytest.fixture
def draft_event(db, admin_user):
    return make_event(admin_user, status=EventStatus.DRAFT, title='Draft Event')


@pytest.fixture
def team_event(db, admin_user):
    return make_event(
        admin_user,
        title='Hackathon',
        event_type=EventType.HACKATHON,
        is_team_event=True,
        min_team_size=2,
        max_team_size=4,
    )


@pytest.fixture
def volunteer_assignment(db, published_event, volunteer_user, admin_user):
    return VolunteerAssignment.objects.create(
        event=published_event,
        volunteer=volunteer_user,
        assigned_by=admin_user,
    )


# ---------------------------------------------------------------------------
# Model Tests
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestEventModel:
    def test_event_has_uuid_pk(self, published_event):
        assert isinstance(published_event.id, uuid.UUID)

    def test_event_default_status_is_draft(self, admin_user):
        event = Event.objects.create(
            title='New', description='D', event_type='workshop',
            start_datetime=timezone.now() + timedelta(days=1),
            end_datetime=timezone.now() + timedelta(days=1, hours=2),
            venue='V', capacity=50,
            registration_deadline=timezone.now() + timedelta(hours=12),
            created_by=admin_user,
        )
        assert event.status == EventStatus.DRAFT

    def test_event_str_is_title(self, published_event):
        assert str(published_event) == 'Test Event'

    def test_volunteer_assignment_unique_constraint(self, published_event, volunteer_user, admin_user):
        from django.db import IntegrityError
        VolunteerAssignment.objects.create(
            event=published_event, volunteer=volunteer_user, assigned_by=admin_user
        )
        with pytest.raises(IntegrityError):
            VolunteerAssignment.objects.create(
                event=published_event, volunteer=volunteer_user, assigned_by=admin_user
            )

    def test_volunteer_assignment_str(self, published_event, volunteer_user, admin_user):
        assignment = VolunteerAssignment.objects.create(
            event=published_event, volunteer=volunteer_user, assigned_by=admin_user
        )
        assert 'volunteer' in str(assignment).lower() or 'test event' in str(assignment).lower()


# ---------------------------------------------------------------------------
# Service Tests — create_event
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCreateEvent:
    def _get_data(self, **overrides):
        now = timezone.now()
        data = dict(
            title='New Hackathon',
            description='<p>Details</p>',
            event_type=EventType.HACKATHON,
            start_datetime=now + timedelta(days=10),
            end_datetime=now + timedelta(days=11),
            venue='Auditorium',
            capacity=200,
            registration_deadline=now + timedelta(days=8),
            status=EventStatus.DRAFT,
        )
        data.update(overrides)
        return data

    def test_creates_event_in_database(self, admin_user):
        event = services.create_event(self._get_data(), created_by=admin_user)
        assert Event.objects.filter(pk=event.pk).exists()

    def test_created_by_is_set(self, admin_user):
        event = services.create_event(self._get_data(), created_by=admin_user)
        assert event.created_by == admin_user

    def test_returns_event_instance(self, admin_user):
        result = services.create_event(self._get_data(), created_by=admin_user)
        assert isinstance(result, Event)


# ---------------------------------------------------------------------------
# Service Tests — update_event
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestUpdateEvent:
    def test_updates_provided_fields(self, published_event):
        updated = services.update_event(published_event, {'title': 'Updated Title', 'capacity': 300})
        assert updated.title == 'Updated Title'
        assert updated.capacity == 300

    def test_does_not_change_unprovided_fields(self, published_event):
        original_venue = published_event.venue
        services.update_event(published_event, {'title': 'Changed'})
        published_event.refresh_from_db()
        assert published_event.venue == original_venue

    def test_persists_to_database(self, published_event):
        services.update_event(published_event, {'status': EventStatus.CANCELLED})
        published_event.refresh_from_db()
        assert published_event.status == EventStatus.CANCELLED


# ---------------------------------------------------------------------------
# Service Tests — delete_event
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestDeleteEvent:
    def test_deletes_draft_event(self, draft_event):
        event_id = draft_event.id
        services.delete_event(draft_event)
        assert not Event.objects.filter(pk=event_id).exists()

    def test_cannot_delete_published_event(self, published_event):
        with pytest.raises(AppError) as exc_info:
            services.delete_event(published_event)
        assert exc_info.value.code == 'CANNOT_DELETE'

    def test_deletes_cancelled_event(self, admin_user):
        event = make_event(admin_user, status=EventStatus.CANCELLED)
        event_id = event.id
        services.delete_event(event)
        assert not Event.objects.filter(pk=event_id).exists()


# ---------------------------------------------------------------------------
# Service Tests — assign_volunteer
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAssignVolunteer:
    def test_assigns_volunteer_to_event(self, published_event, volunteer_user, admin_user):
        assignment = services.assign_volunteer(published_event, volunteer_user.id, admin_user)
        assert assignment.volunteer == volunteer_user
        assert assignment.event == published_event

    def test_non_volunteer_user_raises_error(self, published_event, student_user, admin_user):
        with pytest.raises(AppError) as exc_info:
            services.assign_volunteer(published_event, student_user.id, admin_user)
        assert exc_info.value.code == 'NOT_A_VOLUNTEER'

    def test_nonexistent_user_raises_404(self, published_event, admin_user):
        with pytest.raises(AppError) as exc_info:
            services.assign_volunteer(published_event, uuid.uuid4(), admin_user)
        assert exc_info.value.code == 'NOT_FOUND'
        assert exc_info.value.status == 404

    def test_duplicate_assignment_raises_conflict(
        self, published_event, volunteer_user, admin_user
    ):
        services.assign_volunteer(published_event, volunteer_user.id, admin_user)
        with pytest.raises(AppError) as exc_info:
            services.assign_volunteer(published_event, volunteer_user.id, admin_user)
        assert exc_info.value.code == 'ALREADY_ASSIGNED'
        assert exc_info.value.status == 409


# ---------------------------------------------------------------------------
# Service Tests — remove_volunteer
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestRemoveVolunteer:
    def test_removes_existing_assignment(self, volunteer_assignment):
        assignment_id = volunteer_assignment.id
        services.remove_volunteer(volunteer_assignment.event, assignment_id)
        assert not VolunteerAssignment.objects.filter(pk=assignment_id).exists()

    def test_nonexistent_assignment_raises_404(self, published_event):
        with pytest.raises(AppError) as exc_info:
            services.remove_volunteer(published_event, uuid.uuid4())
        assert exc_info.value.code == 'NOT_FOUND'

    def test_cannot_remove_assignment_from_different_event(
        self, volunteer_assignment, admin_user
    ):
        other_event = make_event(admin_user, title='Other Event')
        with pytest.raises(AppError) as exc_info:
            services.remove_volunteer(other_event, volunteer_assignment.id)
        assert exc_info.value.code == 'NOT_FOUND'


# ---------------------------------------------------------------------------
# Service Tests — get_checkin_stats
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestGetCheckinStats:
    def test_admin_can_get_stats(self, published_event, admin_user):
        stats = services.get_checkin_stats(published_event, admin_user)
        assert 'event_id' in stats
        assert 'total_approved' in stats
        assert 'checked_in' in stats
        assert 'remaining' in stats

    def test_assigned_volunteer_can_get_stats(
        self, published_event, volunteer_user, admin_user, volunteer_assignment
    ):
        stats = services.get_checkin_stats(published_event, volunteer_user)
        assert stats['event_id'] == str(published_event.id)

    def test_unassigned_volunteer_raises_403(self, published_event, volunteer_user):
        with pytest.raises(AppError) as exc_info:
            services.get_checkin_stats(published_event, volunteer_user)
        assert exc_info.value.code == 'NOT_ASSIGNED'
        assert exc_info.value.status == 403


# ---------------------------------------------------------------------------
# View Tests — Public Event List
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestEventListView:
    def test_public_list_returns_published_events(self, api_client, published_event, admin_user):
        make_event(admin_user, status=EventStatus.DRAFT, title='Hidden Draft')
        response = api_client.get('/api/events/')
        assert response.status_code == 200
        titles = [e['title'] for e in response.data['results']]
        assert 'Test Event' in titles
        assert 'Hidden Draft' not in titles

    def test_no_auth_required(self, api_client, published_event):
        response = api_client.get('/api/events/')
        assert response.status_code == 200

    def test_filter_by_event_type(self, api_client, admin_user, published_event):
        make_event(admin_user, event_type=EventType.SEMINAR, title='Seminar')
        response = api_client.get('/api/events/?event_type=seminar')
        assert response.status_code == 200
        for event in response.data['results']:
            assert event['event_type'] == 'seminar'

    def test_upcoming_filter(self, api_client, admin_user):
        # Past event
        make_event(
            admin_user, title='Past',
            start_datetime=timezone.now() - timedelta(days=2),
            end_datetime=timezone.now() - timedelta(days=1),
            registration_deadline=timezone.now() - timedelta(days=3),
        )
        response = api_client.get('/api/events/?upcoming=true')
        assert response.status_code == 200
        for event in response.data['results']:
            assert event['title'] != 'Past'

    def test_pagination_structure(self, api_client, published_event):
        response = api_client.get('/api/events/')
        assert 'count' in response.data
        assert 'results' in response.data

    def test_admin_can_create_event(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        now = timezone.now()
        payload = {
            'title': 'New Workshop',
            'description': '<p>Details</p>',
            'event_type': 'workshop',
            'start_datetime': (now + timedelta(days=10)).isoformat(),
            'end_datetime': (now + timedelta(days=10, hours=3)).isoformat(),
            'venue': 'Block 5',
            'capacity': 50,
            'registration_deadline': (now + timedelta(days=8)).isoformat(),
            'status': 'draft',
        }
        response = api_client.post('/api/events/', payload, format='json')
        assert response.status_code == 201
        assert response.data['title'] == 'New Workshop'

    def test_student_cannot_create_event(self, api_client, student_user):
        api_client.force_authenticate(user=student_user)
        response = api_client.post('/api/events/', {}, format='json')
        assert response.status_code == 403

    def test_create_event_invalid_dates_returns_400(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        now = timezone.now()
        payload = {
            'title': 'Bad',
            'description': 'D',
            'event_type': 'workshop',
            'start_datetime': (now + timedelta(days=5)).isoformat(),
            'end_datetime': (now + timedelta(days=3)).isoformat(),  # before start
            'venue': 'V',
            'capacity': 10,
            'registration_deadline': (now + timedelta(days=2)).isoformat(),
            'status': 'draft',
        }
        response = api_client.post('/api/events/', payload, format='json')
        assert response.status_code == 400
        assert 'end_datetime' in response.data['error']['fields']

    def test_create_team_event_requires_team_size(self, api_client, admin_user):
        api_client.force_authenticate(user=admin_user)
        now = timezone.now()
        payload = {
            'title': 'Hackathon',
            'description': 'D',
            'event_type': 'hackathon',
            'start_datetime': (now + timedelta(days=10)).isoformat(),
            'end_datetime': (now + timedelta(days=11)).isoformat(),
            'venue': 'V',
            'capacity': 100,
            'registration_deadline': (now + timedelta(days=8)).isoformat(),
            'is_team_event': True,
            # missing min_team_size and max_team_size
            'status': 'draft',
        }
        response = api_client.post('/api/events/', payload, format='json')
        assert response.status_code == 400


# ---------------------------------------------------------------------------
# View Tests — Event Detail
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestEventDetailView:
    def test_public_can_get_published_event(self, api_client, published_event):
        response = api_client.get(f'/api/events/{published_event.slug}/')
        assert response.status_code == 200
        assert response.data['id'] == str(published_event.id)
        assert 'description' in response.data

    def test_draft_event_returns_404_for_public(self, api_client, draft_event):
        response = api_client.get(f'/api/events/{draft_event.slug}/')
        assert response.status_code == 404

    def test_nonexistent_event_returns_404(self, api_client):
        response = api_client.get('/api/events/does-not-exist/')
        assert response.status_code == 404

    def test_admin_can_patch_event(self, api_client, admin_user, published_event):
        api_client.force_authenticate(user=admin_user)
        response = api_client.patch(
            f'/api/events/{published_event.slug}/',
            {'title': 'Updated Title'},
            format='json',
        )
        assert response.status_code == 200
        assert response.data['title'] == 'Updated Title'

    def test_student_cannot_patch_event(self, api_client, student_user, published_event):
        api_client.force_authenticate(user=student_user)
        response = api_client.patch(
            f'/api/events/{published_event.slug}/',
            {'title': 'Hacked'},
            format='json',
        )
        assert response.status_code == 403

    def test_admin_can_delete_draft_event(self, api_client, admin_user, draft_event):
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(f'/api/events/{draft_event.slug}/')
        assert response.status_code == 204
        assert not Event.objects.filter(pk=draft_event.id).exists()

    def test_cannot_delete_published_event(self, api_client, admin_user, published_event):
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(f'/api/events/{published_event.slug}/')
        assert response.status_code == 400
        assert response.data['error']['code'] == 'CANNOT_DELETE'


# ---------------------------------------------------------------------------
# View Tests — Volunteer Assignment
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestEventVolunteersView:
    def test_admin_can_list_volunteers(
        self, api_client, admin_user, published_event, volunteer_assignment
    ):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/events/{published_event.id}/volunteers/')
        assert response.status_code == 200
        assert len(response.data['volunteers']) == 1

    def test_admin_can_assign_volunteer(
        self, api_client, admin_user, published_event, volunteer_user
    ):
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(
            f'/api/events/{published_event.id}/volunteers/',
            {'user_id': str(volunteer_user.id)},
            format='json',
        )
        assert response.status_code == 201
        assert response.data['volunteer']['email'] == 'volunteer@cuchd.in'

    def test_cannot_assign_student_as_volunteer(
        self, api_client, admin_user, published_event, student_user
    ):
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(
            f'/api/events/{published_event.id}/volunteers/',
            {'user_id': str(student_user.id)},
            format='json',
        )
        assert response.status_code == 400
        assert response.data['error']['code'] == 'NOT_A_VOLUNTEER'

    def test_duplicate_assignment_returns_409(
        self, api_client, admin_user, published_event, volunteer_user, volunteer_assignment
    ):
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(
            f'/api/events/{published_event.id}/volunteers/',
            {'user_id': str(volunteer_user.id)},
            format='json',
        )
        assert response.status_code == 409
        assert response.data['error']['code'] == 'ALREADY_ASSIGNED'

    def test_admin_can_remove_volunteer(
        self, api_client, admin_user, published_event, volunteer_assignment
    ):
        api_client.force_authenticate(user=admin_user)
        response = api_client.delete(
            f'/api/events/{published_event.id}/volunteers/{volunteer_assignment.id}/'
        )
        assert response.status_code == 204
        assert not VolunteerAssignment.objects.filter(pk=volunteer_assignment.id).exists()

    def test_student_cannot_manage_volunteers(
        self, api_client, student_user, published_event
    ):
        api_client.force_authenticate(user=student_user)
        response = api_client.get(f'/api/events/{published_event.id}/volunteers/')
        assert response.status_code == 403


# ---------------------------------------------------------------------------
# View Tests — Check-in Stats
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestCheckinStatsView:
    def test_admin_can_get_stats(self, api_client, admin_user, published_event):
        api_client.force_authenticate(user=admin_user)
        response = api_client.get(f'/api/events/{published_event.id}/checkin-stats/')
        assert response.status_code == 200
        assert 'total_approved' in response.data
        assert 'checked_in' in response.data
        assert 'remaining' in response.data

    def test_assigned_volunteer_can_get_stats(
        self, api_client, volunteer_user, published_event, volunteer_assignment
    ):
        api_client.force_authenticate(user=volunteer_user)
        response = api_client.get(f'/api/events/{published_event.id}/checkin-stats/')
        assert response.status_code == 200

    def test_unassigned_volunteer_gets_403(
        self, api_client, volunteer_user, published_event
    ):
        api_client.force_authenticate(user=volunteer_user)
        response = api_client.get(f'/api/events/{published_event.id}/checkin-stats/')
        assert response.status_code == 403
        assert response.data['error']['code'] == 'NOT_ASSIGNED'

    def test_student_cannot_get_stats(
        self, api_client, student_user, published_event
    ):
        api_client.force_authenticate(user=student_user)
        response = api_client.get(f'/api/events/{published_event.id}/checkin-stats/')
        assert response.status_code == 403
