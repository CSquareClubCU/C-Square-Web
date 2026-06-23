"""
Shared test helpers used across all test files.
Centralises test data creation so no test file repeats boilerplate.
"""

from datetime import timedelta
from django.utils import timezone

from users.models import User, UserRole
from events.models import Event, EventStatus, EventType


def make_user(
    email='student@cuchd.in',
    full_name='Test Student',
    role=UserRole.STUDENT,
    is_cu_student=True,
    **kwargs
) -> User:
    """Create and return a bare user (no usable password — sesame auth only)."""
    user = User.objects.create(
        email=email,
        full_name=full_name,
        role=role,
        is_cu_student=is_cu_student,
        **kwargs
    )
    user.set_unusable_password()
    user.save()
    return user


def make_admin(email='admin@cuchd.in') -> User:
    return make_user(email=email, full_name='Admin User', role=UserRole.ADMIN, is_staff=True)


def make_volunteer(email='volunteer@cuchd.in') -> User:
    return make_user(email=email, full_name='Volunteer User', role=UserRole.VOLUNTEER)


def make_event(
    title='Test Workshop',
    capacity=50,
    is_open_to_external=False,
    is_team_event=False,
    min_team_size=None,
    max_team_size=None,
    status=EventStatus.PUBLISHED,
    days_until_deadline=5,
    days_until_start=7,
    created_by=None,
    **kwargs
) -> Event:
    """Create and return a published event."""
    if created_by is None:
        created_by = make_admin(email='event-admin@cuchd.in')
    now = timezone.now()
    return Event.objects.create(
        title=title,
        description='A test event description.',
        event_type=EventType.WORKSHOP,
        start_datetime=now + timedelta(days=days_until_start),
        end_datetime=now + timedelta(days=days_until_start, hours=3),
        venue='CU Auditorium',
        capacity=capacity,
        registration_deadline=now + timedelta(days=days_until_deadline),
        is_open_to_external=is_open_to_external,
        is_team_event=is_team_event,
        min_team_size=min_team_size,
        max_team_size=max_team_size,
        status=status,
        created_by=created_by,
        **kwargs
    )
