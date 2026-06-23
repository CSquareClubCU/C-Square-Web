import logging
from django.utils import timezone
from core.exceptions import AppError
from .models import AttendanceRecord
from registrations.models import Registration, RegistrationStatus
from events.models import VolunteerAssignment

logger = logging.getLogger(__name__)


def checkin_by_qr(token: str, checked_in_by) -> AttendanceRecord:
    """
    Validate a QR token and mark attendance.
    Raises AppError on invalid token, wrong event, or duplicate check-in.
    """
    try:
        registration = Registration.objects.select_related('event', 'user').get(qr_token=token)
    except Registration.DoesNotExist:
        raise AppError(code='INVALID_TOKEN', message='Invalid QR code.', http_status=400)

    if registration.status != RegistrationStatus.APPROVED:
        raise AppError(code='INVALID_TOKEN', message='This QR code is not valid for check-in.', http_status=400)

    # Ensure the volunteer is assigned to this specific event
    if checked_in_by.role == 'volunteer':
        if not VolunteerAssignment.objects.filter(
            event=registration.event,
            volunteer=checked_in_by
        ).exists():
            raise AppError(
                code='FORBIDDEN',
                message='You are not assigned to this event.',
                http_status=403
            )

    try:
        record = AttendanceRecord.objects.get(registration=registration)
    except AttendanceRecord.DoesNotExist:
        raise AppError(code='INVALID_TOKEN', message='Attendance record not found.', http_status=400)

    if record.is_checked_in:
        raise AppError(
            code='ALREADY_CHECKED_IN',
            message=f'{registration.user.full_name} is already checked in.',
            http_status=409
        )

    record.is_checked_in = True
    record.checked_in_at = timezone.now()
    record.check_in_method = 'qr'
    record.marked_by = checked_in_by
    record.save()

    return record


def checkin_manual(registration_id: str, checked_in_by) -> AttendanceRecord:
    """
    Manually mark attendance for a registration by ID.
    """
    try:
        registration = Registration.objects.select_related('event', 'user').get(id=registration_id)
    except Registration.DoesNotExist:
        raise AppError(code='NOT_FOUND', message='Registration not found.', http_status=404)

    if registration.status != RegistrationStatus.APPROVED:
        raise AppError(
            code='INVALID_STATUS',
            message='Only approved registrations can be checked in.',
            http_status=400
        )

    # Volunteer scope check
    if checked_in_by.role == 'volunteer':
        if not VolunteerAssignment.objects.filter(
            event=registration.event,
            volunteer=checked_in_by
        ).exists():
            raise AppError(
                code='FORBIDDEN',
                message='You are not assigned to this event.',
                http_status=403
            )

    record, _ = AttendanceRecord.objects.get_or_create(
        registration=registration,
        defaults={
            'event': registration.event,
            'user': registration.user,
        }
    )

    if record.is_checked_in:
        raise AppError(
            code='ALREADY_CHECKED_IN',
            message=f'{registration.user.full_name} is already checked in.',
            http_status=409
        )

    record.is_checked_in = True
    record.checked_in_at = timezone.now()
    record.check_in_method = 'manual'
    record.marked_by = checked_in_by
    record.save()

    return record


def get_attendance_list(event_id: str, checked_in_by) -> list:
    """
    Return all approved registrations for an event with their check-in status.
    Used by the manual attendance fallback list on event day.
    """
    from events.models import Event
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        raise AppError(code='NOT_FOUND', message='Event not found.', http_status=404)

    # Volunteer scope check
    if checked_in_by.role == 'volunteer':
        if not VolunteerAssignment.objects.filter(
            event=event, volunteer=checked_in_by
        ).exists():
            raise AppError(
                code='FORBIDDEN',
                message='You are not assigned to this event.',
                http_status=403
            )

    records = AttendanceRecord.objects.filter(event=event).select_related(
        'registration__user', 'registration'
    ).order_by('registration__user__full_name')

    return records
