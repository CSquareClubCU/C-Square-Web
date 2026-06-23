import uuid
import logging
from django.utils import timezone
from django.db import transaction

from core.exceptions import AppError
from core.emails import (
    send_registration_received_email,
    send_registration_approved_email,
    send_registration_rejected_email,
    send_waitlist_email,
    send_waitlist_promoted_email,
    send_teammate_invite_email,
)
from .models import Registration, RegistrationStatus, Team, TeamMember, TeamStatus
from events.models import Event, EventStatus

logger = logging.getLogger(__name__)

CU_DOMAINS = ['cuchd.in', 'cumail.in']


def _update_user_profile(user, data: dict):
    """Update user profile fields from registration data if not already set."""
    profile_fields = ['full_name', 'student_uid', 'branch', 'year', 'semester', 'batch', 'phone']
    changed = False
    for field in profile_fields:
        if field in data and not getattr(user, field):
            setattr(user, field, data[field])
            changed = True
    if changed:
        user.save()


def _get_next_waitlist_position(event: Event) -> int:
    """Return the next available waitlist position for an event."""
    last = Registration.objects.filter(
        event=event, status=RegistrationStatus.WAITLISTED
    ).order_by('-waitlist_position').first()
    return (last.waitlist_position or 0) + 1 if last else 1


def _is_event_at_capacity(event: Event) -> bool:
    """Return True if approved registrations have reached the event capacity."""
    approved_count = Registration.objects.filter(
        event=event, status=RegistrationStatus.APPROVED
    ).count()
    return approved_count >= event.capacity


def create_individual_registration(event_id: str, user, data: dict) -> Registration:
    """
    Register a user individually for an event.
    Handles capacity checks, waitlisting, and external student restrictions.
    """
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        raise AppError(code='NOT_FOUND', message='Event not found.', http_status=404)

    # Check event is published
    if event.status != EventStatus.PUBLISHED:
        raise AppError(code='NOT_FOUND', message='Event not found.', http_status=404)

    # Check registration deadline
    if timezone.now() > event.registration_deadline:
        raise AppError(
            code='REGISTRATION_CLOSED',
            message='Registration for this event has closed.'
        )

    # Check external restriction
    if not event.is_open_to_external and not user.is_cu_student:
        raise AppError(
            code='EXTERNAL_NOT_ALLOWED',
            message='This event is open to Chandigarh University students only.'
        )

    # Check duplicate registration
    if Registration.objects.filter(event=event, user=user).exists():
        raise AppError(
            code='ALREADY_REGISTERED',
            message='You are already registered for this event.',
            http_status=409
        )

    # Update user profile from submitted data
    _update_user_profile(user, data)

    # Determine status based on capacity
    if _is_event_at_capacity(event):
        reg_status = RegistrationStatus.WAITLISTED
        waitlist_position = _get_next_waitlist_position(event)
    else:
        reg_status = RegistrationStatus.PENDING
        waitlist_position = None

    registration = Registration.objects.create(
        event=event,
        user=user,
        status=reg_status,
        waitlist_position=waitlist_position,
    )

    # Send appropriate notification email
    if reg_status == RegistrationStatus.WAITLISTED:
        send_waitlist_email(registration)
    else:
        send_registration_received_email(registration)

    return registration


def create_team_registration(event_id: str, leader, data: dict) -> Team:
    """
    Register a team for a team event.
    Creates a Team, Registration for leader, TeamMember records, and sends invite emails.
    """
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        raise AppError(code='NOT_FOUND', message='Event not found.', http_status=404)

    if event.status != EventStatus.PUBLISHED:
        raise AppError(code='NOT_FOUND', message='Event not found.', http_status=404)

    if not event.is_team_event:
        raise AppError(
            code='NOT_A_TEAM_EVENT',
            message='This event does not support team registration.'
        )

    if timezone.now() > event.registration_deadline:
        raise AppError(
            code='REGISTRATION_CLOSED',
            message='Registration for this event has closed.'
        )

    teammate_emails = [t['email'] for t in data.get('teammates', [])]
    # Total team size: leader + teammates
    total_size = 1 + len(teammate_emails)

    if total_size < event.min_team_size or total_size > event.max_team_size:
        raise AppError(
            code='INVALID_TEAM_SIZE',
            message=f'Team size must be between {event.min_team_size} and {event.max_team_size} members.'
        )

    # Check leader not already registered
    if Registration.objects.filter(event=event, user=leader).exists():
        raise AppError(
            code='ALREADY_REGISTERED',
            message='You are already registered for this event.',
            http_status=409
        )

    leader_data = data.get('leader_details', {})
    _update_user_profile(leader, leader_data)

    with transaction.atomic():
        team = Team.objects.create(
            event=event,
            name=data['team_name'],
            leader=leader,
            status=TeamStatus.PENDING_CONFIRMATION
        )

        # Create leader's registration
        Registration.objects.create(
            event=event,
            user=leader,
            status=RegistrationStatus.PENDING,
            is_team_registration=True,
            team=team,
        )

        # Create TeamMember records for each teammate and send invite emails
        for email in teammate_emails:
            confirmation_token = uuid.uuid4()
            member = TeamMember.objects.create(
                team=team,
                email=email,
                confirmation_token=confirmation_token,
            )
            send_teammate_invite_email(member, team, event)

    return team


def confirm_team_membership(team_id: str, token: str, user) -> TeamMember:
    """
    Confirm a teammate's participation via the invite link.
    Invalidates the token. If all members confirmed, moves team to pending_approval.
    """
    try:
        member = TeamMember.objects.select_related('team__event').get(
            team_id=team_id,
            confirmation_token=token
        )
    except TeamMember.DoesNotExist:
        raise AppError(
            code='INVALID_TOKEN',
            message='This confirmation link is invalid or has already been used.'
        )

    if member.has_confirmed:
        raise AppError(
            code='INVALID_TOKEN',
            message='This confirmation link is invalid or has already been used.'
        )

    with transaction.atomic():
        member.has_confirmed = True
        member.user = user
        member.confirmed_at = timezone.now()
        member.confirmation_token = None  # Invalidate token
        member.save()

        # Create a Registration for this teammate
        Registration.objects.get_or_create(
            event=member.team.event,
            user=user,
            defaults={
                'status': RegistrationStatus.PENDING,
                'is_team_registration': True,
                'team': member.team,
            }
        )

        # Check if all members have confirmed; if so, advance team status
        pending_confirmations = member.team.members.filter(has_confirmed=False).count()
        if pending_confirmations == 0:
            member.team.status = TeamStatus.PENDING_APPROVAL
            member.team.save()

    return member


def approve_registration(registration_id: str, approved_by) -> Registration:
    """
    Approve a registration:
    - Generate qr_token
    - Generate QR image and store locally (dev) or Azure (prod)
    - Create AttendanceRecord
    - Send approval email
    """
    try:
        registration = Registration.objects.select_related('event', 'user').get(id=registration_id)
    except Registration.DoesNotExist:
        raise AppError(code='NOT_FOUND', message='Registration not found.', http_status=404)

    if registration.status != RegistrationStatus.PENDING:
        raise AppError(
            code='INVALID_STATUS',
            message='Only pending registrations can be approved.'
        )

    with transaction.atomic():
        registration.status = RegistrationStatus.APPROVED
        registration.qr_token = uuid.uuid4()
        registration.approved_at = timezone.now()
        registration.save()

        # Generate and store QR image
        qr_image_url = _generate_qr_image(registration)
        registration.qr_image_url = qr_image_url
        registration.save(update_fields=['qr_image_url'])

        # Create AttendanceRecord (per DB schema: created on approval, not on check-in)
        from attendance.models import AttendanceRecord
        AttendanceRecord.objects.get_or_create(
            registration=registration,
            defaults={
                'event': registration.event,
                'user': registration.user,
            }
        )

    # Send approval email with QR code outside the transaction
    # so a mail failure doesn't roll back the approval
    send_registration_approved_email(registration)

    return registration


def reject_registration(registration_id: str, reason: str, rejected_by) -> Registration:
    """Reject a registration with a reason."""
    try:
        registration = Registration.objects.get(id=registration_id)
    except Registration.DoesNotExist:
        raise AppError(code='NOT_FOUND', message='Registration not found.', http_status=404)

    if registration.status not in (RegistrationStatus.PENDING, RegistrationStatus.WAITLISTED):
        raise AppError(
            code='INVALID_STATUS',
            message='Only pending or waitlisted registrations can be rejected.'
        )

    registration.status = RegistrationStatus.REJECTED
    registration.rejection_reason = reason
    registration.save()

    send_registration_rejected_email(registration)

    return registration


def cancel_registration(registration_id: str, cancelled_by) -> Registration:
    """
    Cancel a registration.
    If it was approved, trigger waitlist auto-promotion.
    """
    try:
        registration = Registration.objects.select_related('event').get(id=registration_id)
    except Registration.DoesNotExist:
        raise AppError(code='NOT_FOUND', message='Registration not found.', http_status=404)

    # Only owner or admin can cancel
    if (registration.user != cancelled_by and
            getattr(cancelled_by, 'role', None) != 'admin'):
        raise AppError(
            code='FORBIDDEN',
            message='You do not have permission to cancel this registration.',
            http_status=403
        )

    was_approved = registration.status == RegistrationStatus.APPROVED

    registration.status = RegistrationStatus.CANCELLED
    registration.save()

    # Auto-promote first waitlisted person if an approved spot opened
    if was_approved:
        _promote_first_from_waitlist(registration.event)

    return registration


def _promote_first_from_waitlist(event: Event) -> None:
    """Move the first waitlisted registration to pending and notify them."""
    first_waitlisted = Registration.objects.filter(
        event=event, status=RegistrationStatus.WAITLISTED
    ).order_by('waitlist_position').first()

    if first_waitlisted:
        first_waitlisted.status = RegistrationStatus.PENDING
        first_waitlisted.waitlist_position = None
        first_waitlisted.save()
        # Reorder remaining waitlist positions
        _reorder_waitlist(event)
        send_waitlist_promoted_email(first_waitlisted)


def _reorder_waitlist(event: Event) -> None:
    """Re-number waitlist positions to be sequential after a promotion."""
    waitlisted = Registration.objects.filter(
        event=event, status=RegistrationStatus.WAITLISTED
    ).order_by('waitlist_position')
    for i, reg in enumerate(waitlisted, start=1):
        if reg.waitlist_position != i:
            reg.waitlist_position = i
            reg.save(update_fields=['waitlist_position'])


def _generate_qr_image(registration: Registration) -> str:
    """
    Generate a QR code PNG from the registration's qr_token.
    Stores locally for dev. Returns the URL/path.
    """
    import qrcode
    import os
    from django.conf import settings
    from django.core.files.storage import default_storage
    from django.core.files.base import ContentFile
    import io

    # QR code encodes just the UUID token — backend validates it on scan
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(str(registration.qr_token))
    qr.make(fit=True)
    img = qr.make_image(fill='black', back_color='white')

    # Save to in-memory buffer
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)

    file_name = f"qr-codes/{registration.id}/qr.png"
    path = default_storage.save(file_name, ContentFile(buffer.read()))
    url = default_storage.url(path)

    return url
