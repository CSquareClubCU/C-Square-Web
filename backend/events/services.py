"""
Events app services.

All business logic for event management and volunteer assignment lives here.
Views call these functions — no logic in views or serializers.

Functions:
- create_event(data, created_by)
- update_event(event, data)
- delete_event(event)
- upload_event_banner(event, file)
- assign_volunteer(event, user_id, assigned_by)
- remove_volunteer(event, assignment_id)
- get_checkin_stats(event)
"""

import logging
import os
from io import BytesIO
from uuid import UUID

from django.contrib.auth import get_user_model

from core.exceptions import AppError
from events.models import Event, EventStatus, VolunteerAssignment

logger = logging.getLogger(__name__)
User = get_user_model()


def create_event(validated_data: dict, created_by) -> Event:
    """
    Create a new event. Always starts as draft unless explicitly set.

    Args:
        validated_data: Validated data from EventCreateUpdateSerializer.
        created_by: The admin user creating the event.

    Returns:
        The created Event instance.
    """
    event = Event.objects.create(created_by=created_by, **validated_data)
    logger.info('Event created: "%s" (id=%s) by %s', event.title, event.id, created_by.email)
    return event


def update_event(event: Event, validated_data: dict) -> Event:
    """
    Partially update an event. Only updates provided fields.

    Args:
        event: The Event instance to update.
        validated_data: Validated partial data from EventCreateUpdateSerializer.

    Returns:
        The updated Event instance.
    """
    for field, value in validated_data.items():
        setattr(event, field, value)
    event.save(update_fields=list(validated_data.keys()) + ['updated_at'])
    logger.info('Event updated: "%s" (id=%s)', event.title, event.id)
    return event


def delete_event(event: Event) -> None:
    """
    Delete an event. Only allowed if status is 'draft'.

    Raises:
        AppError(CANNOT_DELETE, 400): If the event is not a draft.
    """
    if event.status != EventStatus.DRAFT:
        raise AppError(
            code='CANNOT_DELETE',
            message='Only draft events can be deleted. Cancel the event instead.',
            status=400,
        )
    event_title = event.title
    event.delete()
    logger.info('Event deleted: "%s"', event_title)


def upload_event_banner(event: Event, file) -> Event:
    """
    Validate and upload an event banner image to Azure Blob Storage.
    Updates event.banner_image_url with the resulting URL.

    File validation (type and size) is done in the serializer.
    This function handles the actual storage operation.

    Args:
        event: The Event to attach the banner to.
        file: The validated InMemoryUploadedFile from the request.

    Returns:
        The updated Event instance.
    """
    from core.utils.storage import upload_to_blob

    # Determine file extension from content type
    ext_map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
    }
    ext = ext_map.get(file.content_type, 'jpg')
    blob_path = f'event-banners/{event.id}/banner.{ext}'

    url = upload_to_blob(
        blob_path=blob_path,
        file_data=file.read(),
        content_type=file.content_type,
    )

    event.banner_image_url = url
    event.save(update_fields=['banner_image_url', 'updated_at'])
    logger.info('Banner uploaded for event "%s": %s', event.title, url)
    return event


def assign_volunteer(event: Event, user_id: UUID, assigned_by) -> VolunteerAssignment:
    """
    Assign a volunteer to an event.

    Validations:
    - The user must exist.
    - The user must have role='volunteer'.
    - The volunteer must not already be assigned to this event.

    Returns:
        The created VolunteerAssignment instance.

    Raises:
        AppError(NOT_FOUND, 404): User not found.
        AppError(NOT_A_VOLUNTEER, 400): User is not a volunteer.
        AppError(ALREADY_ASSIGNED, 409): Volunteer already assigned to this event.
    """
    # Get the user
    try:
        volunteer = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        raise AppError(
            code='NOT_FOUND',
            message='User not found.',
            status=404,
        )

    # Must have volunteer role
    if volunteer.role != 'volunteer':
        raise AppError(
            code='NOT_A_VOLUNTEER',
            message='User must have the volunteer role to be assigned to an event.',
            status=400,
        )

    # Check for duplicate assignment
    if VolunteerAssignment.objects.filter(event=event, volunteer=volunteer).exists():
        raise AppError(
            code='ALREADY_ASSIGNED',
            message='This volunteer is already assigned to this event.',
            status=409,
        )

    assignment = VolunteerAssignment.objects.create(
        event=event,
        volunteer=volunteer,
        assigned_by=assigned_by,
    )
    logger.info(
        'Volunteer %s assigned to event "%s" by %s',
        volunteer.email, event.title, assigned_by.email,
    )
    return assignment


def remove_volunteer(event: Event, assignment_id: UUID) -> None:
    """
    Remove a volunteer assignment from an event.

    Raises:
        AppError(NOT_FOUND, 404): Assignment not found or doesn't belong to this event.
    """
    try:
        assignment = VolunteerAssignment.objects.get(pk=assignment_id, event=event)
    except VolunteerAssignment.DoesNotExist:
        raise AppError(
            code='NOT_FOUND',
            message='Volunteer assignment not found.',
            status=404,
        )
    volunteer_email = assignment.volunteer.email
    assignment.delete()
    logger.info(
        'Volunteer %s removed from event "%s"',
        volunteer_email, event.title,
    )


def get_checkin_stats(event: Event, requesting_user) -> dict:
    """
    Get live check-in statistics for an event.

    Access control:
    - Admins can always access.
    - Volunteers can only access if assigned to the event.

    Returns a dict matching the API spec response shape.

    Raises:
        AppError(NOT_ASSIGNED, 403): Volunteer not assigned to this event.
    """
    # Volunteer access gate — check assignment
    if requesting_user.role == 'volunteer':
        is_assigned = VolunteerAssignment.objects.filter(
            event=event,
            volunteer=requesting_user,
        ).exists()
        if not is_assigned:
            raise AppError(
                code='NOT_ASSIGNED',
                message='You are not assigned to this event.',
                status=403,
            )

    # Compute stats from attendance records (graceful fallback if app not built yet)
    try:
        from attendance.models import AttendanceRecord
        total_approved = AttendanceRecord.objects.filter(event=event).count()
        checked_in = AttendanceRecord.objects.filter(
            event=event, is_checked_in=True
        ).count()
    except Exception:
        total_approved = 0
        checked_in = 0

    # Waitlist and pending from registrations (graceful fallback)
    try:
        from registrations.models import Registration
        waitlisted = Registration.objects.filter(
            event=event, status='waitlisted'
        ).count()
        pending = Registration.objects.filter(
            event=event, status='pending'
        ).count()
    except Exception:
        waitlisted = 0
        pending = 0

    return {
        'event_id': str(event.id),
        'total_approved': total_approved,
        'checked_in': checked_in,
        'remaining': total_approved - checked_in,
        'waitlisted': waitlisted,
        'pending': pending,
    }


def get_event_for_public(event_id: UUID) -> Event:
    """
    Get a single published event for the public detail page.

    Raises:
        AppError(NOT_FOUND, 404): Event not found or not published.
    """
    try:
        return Event.objects.get(pk=event_id, status=EventStatus.PUBLISHED)
    except Event.DoesNotExist:
        raise AppError(
            code='NOT_FOUND',
            message='Event not found.',
            status=404,
        )


def get_event_or_404(event_id: UUID) -> Event:
    """
    Get any event by ID (for admin use — not status-filtered).

    Raises:
        AppError(NOT_FOUND, 404): Event does not exist.
    """
    try:
        return Event.objects.get(pk=event_id)
    except Event.DoesNotExist:
        raise AppError(
            code='NOT_FOUND',
            message='Event not found.',
            status=404,
        )
