from django.conf import settings
from .models import Event, VolunteerAssignment
from users.models import User, UserRole
from core.exceptions import AppError


def create_event(data: dict, created_by: User) -> Event:
    """Create a new event. Only admins may call this."""
    event = Event.objects.create(**data, created_by=created_by)
    return event


def update_event(event: Event, data: dict) -> Event:
    """Partial update an event."""
    for field, value in data.items():
        setattr(event, field, value)
    event.save()
    return event


def delete_event(event: Event) -> None:
    """
    Delete an event. Only allowed if the event is in draft status.
    Raises AppError if event is not a draft.
    """
    from .models import EventStatus
    if event.status != EventStatus.DRAFT:
        raise AppError(
            code='CANNOT_DELETE',
            message='Only draft events can be deleted. Cancel the event instead.'
        )
    event.delete()


def upload_event_banner(event: Event, file) -> str:
    """
    Validate and store the banner image locally (dev) or in Azure Blob (prod).
    Returns the URL/path of the stored image.
    """
    import os
    from django.core.files.storage import default_storage
    from django.core.files.base import ContentFile

    # Validate file type
    allowed_types = ['image/jpeg', 'image/png', 'image/webp']
    if file.content_type not in allowed_types:
        raise AppError(
            code='INVALID_FILE',
            message='File must be jpg, png, or webp and under 5MB.'
        )
    # Validate file size (5MB)
    if file.size > 5 * 1024 * 1024:
        raise AppError(
            code='INVALID_FILE',
            message='File must be jpg, png, or webp and under 5MB.'
        )

    ext = file.name.split('.')[-1].lower()
    file_name = f"event-banners/{event.id}/banner.{ext}"
    path = default_storage.save(file_name, ContentFile(file.read()))
    url = default_storage.url(path)

    event.banner_image_url = url
    event.save(update_fields=['banner_image_url'])
    return url


def assign_volunteer(event: Event, user_id: str, assigned_by: User) -> VolunteerAssignment:
    """
    Assign a volunteer to an event.
    Raises AppError if user is not a volunteer or is already assigned.
    """
    try:
        volunteer = User.objects.get(id=user_id)
    except User.DoesNotExist:
        raise AppError(code='NOT_FOUND', message='User not found.')

    if volunteer.role != UserRole.VOLUNTEER:
        raise AppError(
            code='NOT_A_VOLUNTEER',
            message='User must have the volunteer role to be assigned to an event.'
        )

    if VolunteerAssignment.objects.filter(event=event, volunteer=volunteer).exists():
        raise AppError(
            code='ALREADY_ASSIGNED',
            message='This volunteer is already assigned to this event.'
        )

    assignment = VolunteerAssignment.objects.create(
        event=event,
        volunteer=volunteer,
        assigned_by=assigned_by
    )
    return assignment


def remove_volunteer(assignment: VolunteerAssignment) -> None:
    """Remove a volunteer assignment."""
    assignment.delete()


def get_checkin_stats(event: Event) -> dict:
    """
    Return live check-in statistics for an event.
    Denormalised fields on AttendanceRecord make this a fast query.
    """
    from attendance.models import AttendanceRecord
    from registrations.models import Registration, RegistrationStatus

    total_approved = Registration.objects.filter(
        event=event, status=RegistrationStatus.APPROVED
    ).count()
    checked_in = AttendanceRecord.objects.filter(
        event=event, is_checked_in=True
    ).count()
    waitlisted = Registration.objects.filter(
        event=event, status=RegistrationStatus.WAITLISTED
    ).count()
    pending = Registration.objects.filter(
        event=event, status=RegistrationStatus.PENDING
    ).count()

    return {
        'event_id': str(event.id),
        'total_approved': total_approved,
        'checked_in': checked_in,
        'remaining': total_approved - checked_in,
        'waitlisted': waitlisted,
        'pending': pending,
    }
