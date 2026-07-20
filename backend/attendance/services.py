"""
Attendance app services.
All business logic for check-in and attendance reporting.
"""

import csv
import io
import logging
import uuid

from django.db.models import Q
from django.db.models.query import QuerySet
from django.utils import timezone
from typing import Optional

from attendance.models import AttendanceRecord, CheckInMethod
from core.exceptions import AppError
from events.models import Event
from events.models import VolunteerAssignment
from users.models import UserRole

logger = logging.getLogger(__name__)


def _verify_volunteer_access(event: Event, user):
    """
    Ensure that a volunteer is assigned to this event before check-in.
    Admins bypass this check.
    """
    if user.role == UserRole.VOLUNTEER:
        assigned = VolunteerAssignment.objects.filter(event=event, volunteer=user).exists()
        if not assigned:
            raise AppError('NOT_ASSIGNED', 'You are not assigned to this event.', 403)


def _do_checkin(record: AttendanceRecord, method: str, marked_by) -> AttendanceRecord:
    """
    Internal: mark a single attendance record as checked-in.
    Idempotent — if already checked in, returns the record without error.
    """
    from django.db import transaction
    from attendance.models import DailyCheckIn
    
    with transaction.atomic():
        record = AttendanceRecord.objects.select_for_update().select_related('event', 'user').get(id=record.id)
        
        current_dt = timezone.localtime()
        current_date = current_dt.date()
        current_time = current_dt.time()
        start_dt = timezone.localtime(record.event.start_datetime)
        end_dt = timezone.localtime(record.event.end_datetime)
        
        is_admin = marked_by and marked_by.role == UserRole.ADMIN
        
        if record.event.is_continuous:
            if record.is_checked_in:
                return record
                
            if current_date < start_dt.date():
                raise AppError('CHECKIN_EARLY', 'Check-in is not allowed before the event date.', 400)
                
            if not is_admin:
                if not record.event.is_checkin_active:
                    raise AppError('CHECKIN_CLOSED', 'Check-in is currently closed for this event.', 400)
                if current_dt > end_dt:
                    raise AppError('CHECKIN_LATE', 'Check-in is not allowed after the event ends.', 400)
                    
            record.is_checked_in = True
            record.checked_in_at = current_dt
            record.check_in_method = method
            record.marked_by = marked_by
            record.save(update_fields=[
                'is_checked_in', 'checked_in_at', 'check_in_method', 'marked_by', 'updated_at'
            ])
            
            # Award points
            from django.db.models import F
            from django.contrib.auth import get_user_model
            get_user_model().objects.filter(pk=record.user.pk).update(
                club_points=F('club_points') + record.event.points
            )
        else:
            # Non-continuous logic
            if current_date < start_dt.date() or current_date > end_dt.date():
                if not is_admin:
                    raise AppError('CHECKIN_OUT_OF_BOUNDS', 'Check-in is only allowed on event days.', 400)
            
            if not is_admin:
                if not record.event.is_checkin_active:
                    raise AppError('CHECKIN_CLOSED', 'Check-in is currently closed for this event.', 400)
                if current_time < start_dt.time() or current_time > end_dt.time():
                    raise AppError('CHECKIN_LATE', 'Check-in is not allowed outside daily event hours.', 400)
                    
            daily_checkin, created = DailyCheckIn.objects.get_or_create(
                attendance_record=record,
                date=current_date,
                defaults={
                    'check_in_method': method,
                    'marked_by': marked_by,
                }
            )
            
            if not created:
                return record # already checked in today
                
            # Set top-level checked in to True if this is first time
            if not record.is_checked_in:
                record.is_checked_in = True
                record.checked_in_at = current_dt
                record.check_in_method = method
                record.marked_by = marked_by
                record.save(update_fields=[
                    'is_checked_in', 'checked_in_at', 'check_in_method', 'marked_by', 'updated_at'
                ])
                
            # Award points per day
            from django.db.models import F
            from django.contrib.auth import get_user_model
            get_user_model().objects.filter(pk=record.user.pk).update(
                club_points=F('club_points') + record.event.points
            )

    logger.info(
        '%s checked in via %s at %s by %s',
        record.user.email, method, record.event.title, marked_by.email if marked_by else 'System',
    )
    return record


def checkin_by_qr(qr_token: str, marked_by) -> AttendanceRecord:
    """
    QR check-in. Looks up registration by qr_token UUID.

    Args:
        qr_token: The token string scanned from the QR code.
        marked_by: The admin or volunteer performing the check-in.

    Returns:
        The updated AttendanceRecord.

    Raises:
        AppError(INVALID_QR, 400): Token is invalid or malformed.
        AppError(NOT_ASSIGNED, 403): Volunteer not assigned to this event.
    """
    # Parse the token — be strict
    try:
        token_uuid = uuid.UUID(str(qr_token))
    except (ValueError, AttributeError):
        raise AppError('INVALID_QR', 'Invalid QR token format.', 400)

    try:
        from registrations.models import Registration, RegistrationStatus
        registration = Registration.objects.select_related('attendance_record__event', 'attendance_record__user').get(
            qr_token=token_uuid,
            status=RegistrationStatus.APPROVED,
        )
    except Registration.DoesNotExist:
        raise AppError('INVALID_QR', 'Invalid or expired QR code.', 400)

    try:
        record = registration.attendance_record
    except AttendanceRecord.DoesNotExist:
        raise AppError('NO_RECORD', 'Attendance record not found for this registration.', 500)

    _verify_volunteer_access(record.event, marked_by)
    return _do_checkin(record, CheckInMethod.QR, marked_by)


def checkin_manual(registration_id: uuid.UUID, marked_by) -> AttendanceRecord:
    """
    Manual check-in by registration ID.
    Used for the searchable name-list fallback on event day.

    Args:
        registration_id: The UUID of the registration.
        marked_by: The admin or volunteer performing the check-in.

    Returns:
        The updated AttendanceRecord.

    Raises:
        AppError(NOT_FOUND, 404): Registration or attendance record not found.
        AppError(NOT_ASSIGNED, 403): Volunteer not assigned to this event.
    """
    try:
        record = AttendanceRecord.objects.select_related('event', 'user').get(
            registration_id=registration_id,
        )
    except AttendanceRecord.DoesNotExist:
        raise AppError('NOT_FOUND', 'Attendance record not found.', 404)

    _verify_volunteer_access(record.event, marked_by)
    return _do_checkin(record, CheckInMethod.MANUAL, marked_by)


def revoke_checkin(registration_id: uuid.UUID, revoked_by) -> AttendanceRecord:
    """
    Revokes a check-in by registration ID.
    Deducts the club points previously awarded.
    """
    from django.db import transaction
    from attendance.models import DailyCheckIn

    with transaction.atomic():
        try:
            record = AttendanceRecord.objects.select_for_update().select_related('event', 'user').get(
                registration_id=registration_id,
            )
        except AttendanceRecord.DoesNotExist:
            raise AppError('NOT_FOUND', 'Attendance record not found.', 404)

        _verify_volunteer_access(record.event, revoked_by)

        if record.event.is_continuous:
            if not record.is_checked_in:
                raise AppError('BAD_REQUEST', 'User is not checked in.', 400)

            # Revert check-in
            record.is_checked_in = False
            record.checked_in_at = None
            record.check_in_method = None
            record.marked_by = None
            record.save(update_fields=[
                'is_checked_in', 'checked_in_at', 'check_in_method', 'marked_by', 'updated_at'
            ])

            # Revert club points atomically
            from django.db.models import F, Value
            from django.db.models.functions import Greatest
            from django.contrib.auth import get_user_model
            get_user_model().objects.filter(pk=record.user.pk).update(
                club_points=Greatest(F('club_points') - record.event.points, Value(0))
            )
        else:
            current_date = timezone.localtime().date()
            daily_checkins = DailyCheckIn.objects.filter(attendance_record=record, date=current_date)
            
            if not daily_checkins.exists():
                raise AppError('BAD_REQUEST', 'User is not checked in today.', 400)
                
            daily_checkins.delete()
            
            # Check if any other daily checkins exist, if not, set is_checked_in = False
            if not DailyCheckIn.objects.filter(attendance_record=record).exists():
                record.is_checked_in = False
                record.checked_in_at = None
                record.check_in_method = None
                record.marked_by = None
                record.save(update_fields=[
                    'is_checked_in', 'checked_in_at', 'check_in_method', 'marked_by', 'updated_at'
                ])
                
            # Revert club points
            from django.db.models import F, Value
            from django.db.models.functions import Greatest
            from django.contrib.auth import get_user_model
            get_user_model().objects.filter(pk=record.user.pk).update(
                club_points=Greatest(F('club_points') - record.event.points, Value(0))
            )

    logger.info(
        '%s had check-in revoked at %s by %s',
        record.user.email, record.event.title, revoked_by.email,
    )
    return record


def get_attendance_list(event: Event, marked_by, search: Optional[str] = None) -> QuerySet:
    """
    Get all attendance records for an event.
    Supports full-text search across name, email, and student UID.

    Args:
        event: The event to get attendance for.
        marked_by: The requesting user (admin or assigned volunteer).
        search: Optional search string.

    Returns:
        QuerySet of AttendanceRecord.

    Raises:
        AppError(NOT_ASSIGNED, 403): Volunteer not assigned to this event.
    """
    _verify_volunteer_access(event, marked_by)

    qs = AttendanceRecord.objects.filter(event=event).select_related(
        'user', 'registration', 'marked_by'
    )

    if search:
        qs = qs.filter(
            Q(user__full_name__icontains=search) |
            Q(user__email__icontains=search) |
            Q(user__student_uid__icontains=search)
        )

    return qs


def _sanitize_csv_value(val) -> str:
    """Sanitize user-controlled fields to prevent CSV formula injection."""
    if not val:
        return ''
    val_str = str(val)
    if val_str.startswith(('=', '+', '-', '@')):
        return f"'{val_str}"
    return val_str


def export_attendance_csv(event: Event, marked_by) -> io.StringIO:
    """
    Export attendance records as a CSV string buffer.
    Streamed directly — no file saved to disk.
    """
    _verify_volunteer_access(event, marked_by)

    records = AttendanceRecord.objects.filter(event=event).select_related(
        'user', 'registration'
    ).prefetch_related('daily_checkins').order_by('user__full_name')

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    base_headers = [
        'Full Name',
        'Email',
        'Student UID',
        'Institution',
        'Degree Type',
        'Graduation Year',
        'Batch',
        'Phone',
        'Registration Status',
    ]

    if event.is_continuous:
        headers = base_headers + ['Checked In', 'Checked In At', 'Check-In Method']
        writer.writerow(headers)
        
        for record in records:
            writer.writerow([
                _sanitize_csv_value(record.user.full_name),
                _sanitize_csv_value(record.user.email),
                _sanitize_csv_value(record.user.student_uid),
                _sanitize_csv_value(record.user.institution),
                _sanitize_csv_value(record.user.degree_type),
                _sanitize_csv_value(record.user.graduation_year),
                _sanitize_csv_value(record.user.batch),
                _sanitize_csv_value(record.user.phone),
                record.registration.status,
                'Yes' if record.is_checked_in else 'No',
                record.checked_in_at.strftime('%Y-%m-%d %H:%M:%S') if record.checked_in_at else '',
                record.check_in_method or '',
            ])
    else:
        import datetime
        start_d = timezone.localtime(event.start_datetime).date()
        end_d = timezone.localtime(event.end_datetime).date()
        
        event_dates = []
        current_d = start_d
        while current_d <= end_d:
            event_dates.append(current_d)
            current_d += datetime.timedelta(days=1)
            
        headers = base_headers + [f"Day: {d.strftime('%b %d')}" for d in event_dates] + ['Total Days Attended']
        writer.writerow(headers)
        
        for record in records:
            row = [
                _sanitize_csv_value(record.user.full_name),
                _sanitize_csv_value(record.user.email),
                _sanitize_csv_value(record.user.student_uid),
                _sanitize_csv_value(record.user.institution),
                _sanitize_csv_value(record.user.degree_type),
                _sanitize_csv_value(record.user.graduation_year),
                _sanitize_csv_value(record.user.batch),
                _sanitize_csv_value(record.user.phone),
                record.registration.status,
            ]
            
            user_checkins = {dc.date: dc for dc in record.daily_checkins.all()}
            
            for d in event_dates:
                if d in user_checkins:
                    dc = user_checkins[d]
                    row.append(f"Yes ({dc.checked_in_at.strftime('%H:%M')} via {dc.check_in_method})")
                else:
                    row.append("No")
                    
            row.append(str(len(user_checkins)))
            writer.writerow(row)

    buffer.seek(0)
    return buffer
