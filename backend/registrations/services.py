"""
Registrations app services.
All business logic for registrations and teams.
"""

import io
import logging
import uuid
from django.conf import settings
from django.db import transaction
from django.db.models import Max
from django.utils import timezone
from django.contrib.auth import get_user_model
import qrcode

from core.exceptions import AppError
from core.utils.email import send_email
from core.utils.storage import upload_to_blob
from events.models import Event, EventStatus
from registrations.models import (
    Registration,
    RegistrationStatus,
    Team,
    TeamMember,
    TeamStatus,
)

logger = logging.getLogger(__name__)
User = get_user_model()


def _check_event_open_for_registration(event: Event, user):
    """
    Common checks before allowing any registration.
    """
    if event.status != EventStatus.PUBLISHED:
        raise AppError('EVENT_NOT_PUBLISHED', 'Event is not open for registration.', 400)
    
    if timezone.now() > event.registration_deadline:
        raise AppError('REGISTRATION_CLOSED', 'Registration deadline has passed.', 400)
        
    if not event.is_open_to_external and not user.is_cu_student:
        raise AppError('EXTERNAL_NOT_ALLOWED', 'This event is restricted to CU students.', 403)


def register_individual(event_id: uuid.UUID, user) -> Registration:
    """
    Register a user for an event.
    Places them on waitlist if capacity is full.
    """
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        raise AppError('NOT_FOUND', 'Event not found.', 404)

    if event.is_team_event:
        raise AppError('TEAM_EVENT', 'This is a team event. Please use team registration.', 400)

    _check_event_open_for_registration(event, user)

    if Registration.objects.filter(event=event, user=user).exists():
        raise AppError('ALREADY_REGISTERED', 'You are already registered for this event.', 409)

    with transaction.atomic():
        # Lock parent Event row
        event = Event.objects.select_for_update().get(id=event.id)

        # Check capacity
        approved_count = Registration.objects.filter(
            event=event, status=RegistrationStatus.APPROVED
        ).count()

        if approved_count >= event.capacity:
            status = RegistrationStatus.WAITLISTED
            # Get max waitlist position
            max_pos = Registration.objects.filter(
                event=event, status=RegistrationStatus.WAITLISTED
            ).aggregate(max_pos=Max('waitlist_position'))['max_pos'] or 0
            waitlist_position = max_pos + 1
        else:
            status = RegistrationStatus.PENDING
            waitlist_position = None

        from django.db import IntegrityError
        try:
            registration = Registration.objects.create(
                event=event,
                user=user,
                status=status,
                waitlist_position=waitlist_position,
            )
        except IntegrityError:
            raise AppError('ALREADY_REGISTERED', 'You are already registered for this event.', 409)

    logger.info('User %s registered for event "%s" (Status: %s)', user.email, event.title, status)
    
    # Send email (fire and forget for MVP, synchronously)
    try:
        if status == RegistrationStatus.WAITLISTED:
            # Waitlist email
            html_content = f"<p>You are on the waitlist for {event.title}. Your position is {waitlist_position}.</p>"
            send_email(
                to_email=user.email,
                subject=f"Waitlisted: {event.title}",
                html_content=html_content
            )
        else:
            # Pending approval email
            html_content = f"<p>Your registration for {event.title} is pending approval.</p>"
            send_email(
                to_email=user.email,
                subject=f"Registration Pending: {event.title}",
                html_content=html_content
            )
    except Exception as e:
        logger.error("Failed to send registration email: %s", str(e))

    return registration


def register_team(event_id: uuid.UUID, team_name: str, leader, members_data: list) -> Team:
    """
    Submit a team registration.
    Creates the team and sends invites to members.
    """
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        raise AppError('NOT_FOUND', 'Event not found.', 404)

    if not event.is_team_event:
        raise AppError('NOT_TEAM_EVENT', 'This is not a team event.', 400)

    _check_event_open_for_registration(event, leader)

    # Validate team size
    total_members = len(members_data) + 1  # include leader
    if total_members < event.min_team_size:
        raise AppError('TEAM_TOO_SMALL', f'Team must have at least {event.min_team_size} members.', 400)
    if total_members > event.max_team_size:
        raise AppError('TEAM_TOO_LARGE', f'Team can have at most {event.max_team_size} members.', 400)

    # Check if leader is already in a team for this event
    if TeamMember.objects.filter(team__event=event, email=leader.email.lower()).exists() or \
       Team.objects.filter(event=event, leader=leader).exists():
        raise AppError('ALREADY_IN_TEAM', 'You are already part of a team for this event.', 409)

    emails = [m['email'].lower() for m in members_data]
    if leader.email.lower() in emails:
        raise AppError('INVALID_MEMBERS', 'Leader should not be in the members list.', 400)

    # Check if any member is already in a team
    existing = TeamMember.objects.filter(team__event=event, email__in=emails)
    if existing.exists():
        raise AppError('MEMBER_ALREADY_IN_TEAM', 'One or more members are already in a team for this event.', 409)

    invites_to_send = []
    with transaction.atomic():
        team = Team.objects.create(
            event=event,
            name=team_name,
            leader=leader,
            status=TeamStatus.PENDING_CONFIRMATION,
        )

        # Auto-confirm leader
        TeamMember.objects.create(
            team=team,
            user=leader,
            email=leader.email.lower(),
            has_confirmed=True,
            confirmed_at=timezone.now(),
        )

        # Create unconfirmed members
        for m in members_data:
            token = uuid.uuid4()
            TeamMember.objects.create(
                team=team,
                email=m['email'].lower(),
                confirmation_token=token,
            )
            invites_to_send.append((m['email'].lower(), token))

    # Trigger emails after transaction block has successfully completed
    from django.utils.html import escape
    for email_addr, token in invites_to_send:
        try:
            escaped_team_name = escape(team_name)
            escaped_event_title = escape(event.title)
            invite_url = f"{settings.FRONTEND_URL}/teams/confirm?token={token}&team_id={team.id}"
            html_content = f"<p>You've been invited to team {escaped_team_name} for {escaped_event_title}. <a href='{invite_url}'>Confirm here</a>.</p>"
            send_email(
                to_email=email_addr,
                subject=f"Team Invite: {team_name}",
                html_content=html_content
            )
        except Exception as e:
            logger.error("Failed to send team invite email: %s", str(e))

    logger.info('Team "%s" registered by %s for event "%s"', team_name, leader.email, event.title)
    return team


def confirm_teammate(token: uuid.UUID, user) -> TeamMember:
    """
    Confirm a teammate's invite.
    If all confirmed, transitions Team to PENDING_APPROVAL and creates Registrations.
    """
    try:
        member = TeamMember.objects.select_related('team', 'team__event').get(
            confirmation_token=token, has_confirmed=False
        )
    except TeamMember.DoesNotExist:
        raise AppError('INVALID_TOKEN', 'Invalid or expired confirmation token.', 400)

    if member.email != user.email:
        raise AppError('EMAIL_MISMATCH', 'Please login with the email that received the invite.', 403)

    with transaction.atomic():
        member.has_confirmed = True
        member.confirmation_token = None
        member.confirmed_at = timezone.now()
        member.user = user
        member.save(update_fields=['has_confirmed', 'confirmation_token', 'confirmed_at', 'user'])

        # Check if all members confirmed
        team = member.team
        unconfirmed_count = team.members.filter(has_confirmed=False).count()

        if unconfirmed_count == 0:
            team.status = TeamStatus.PENDING_APPROVAL
            team.save(update_fields=['status', 'updated_at'])

            # Create pending individual registrations for each confirmed member
            for m in team.members.all():
                Registration.objects.create(
                    event=team.event,
                    user=m.user,
                    status=RegistrationStatus.PENDING,
                    is_team_registration=True,
                    team=team,
                )
            logger.info('Team "%s" fully confirmed and ready for approval.', team.name)

    return member


def approve_registration(registration_id: uuid.UUID, admin_user) -> Registration:
    """
    Approve a pending registration.
    Generates QR code, saves to Azure Blob, creates AttendanceRecord, and emails user.
    If it's a team registration, approves ALL team members at once.
    """
    try:
        from attendance.models import AttendanceRecord
    except ImportError:
        AttendanceRecord = None

    try:
        registration = Registration.objects.select_related('event', 'user', 'team').get(id=registration_id)
    except Registration.DoesNotExist:
        raise AppError('NOT_FOUND', 'Registration not found.', 404)

    if registration.status != RegistrationStatus.PENDING:
        raise AppError('INVALID_STATUS', 'Only pending registrations can be approved.', 400)

    # Determine all registrations to approve (just one if individual, all if team)
    if registration.is_team_registration and registration.team:
        team = registration.team
        if team.status != TeamStatus.PENDING_APPROVAL:
             raise AppError('INVALID_TEAM_STATUS', 'Team is not ready for approval.', 400)
        regs_to_approve = list(team.registrations.all())
    else:
        team = None
        regs_to_approve = [registration]

    with transaction.atomic():
        # Lock the Event row to prevent race conditions on capacity calculation
        event = Event.objects.select_for_update().get(id=registration.event.id)

        # Lock the target registration row and verify status is still PENDING
        try:
            db_reg = Registration.objects.select_for_update().select_related('team').get(id=registration_id)
        except Registration.DoesNotExist:
            raise AppError('NOT_FOUND', 'Registration not found.', 404) from None

        if db_reg.status != RegistrationStatus.PENDING:
            raise AppError('INVALID_STATUS', 'Only pending registrations can be approved.', 400)

        # Determine all fresh locked registrations to approve
        if db_reg.is_team_registration and db_reg.team:
            db_team = Team.objects.select_for_update().get(id=db_reg.team.id)
            if db_team.status != TeamStatus.PENDING_APPROVAL:
                 raise AppError('INVALID_TEAM_STATUS', 'Team is not ready for approval.', 400)
            regs_to_approve = list(db_team.registrations.select_for_update().all())
            # Ensure all registrations to approve are indeed pending
            for r in regs_to_approve:
                if r.status != RegistrationStatus.PENDING:
                    raise AppError('INVALID_STATUS', 'One or more registrations are not pending.', 400)
            team = db_team
        else:
            team = None
            regs_to_approve = [db_reg]

        # Check capacity against event limit using locked values
        approved_count = Registration.objects.filter(event=event, status=RegistrationStatus.APPROVED).count()
        if approved_count + len(regs_to_approve) > event.capacity:
            raise AppError('CAPACITY_EXCEEDED', 'Approving this would exceed event capacity.', 400)

        if team:
            team.status = TeamStatus.APPROVED
            team.save(update_fields=['status', 'updated_at'])

        for reg in regs_to_approve:
            qr_token = uuid.uuid4()
            
            # Update registration (leave qr_image_url for outside transaction)
            reg.status = RegistrationStatus.APPROVED
            reg.qr_token = qr_token
            reg.approved_at = timezone.now()
            reg.save(update_fields=['status', 'qr_token', 'approved_at', 'updated_at'])
            
            # Create AttendanceRecord
            if AttendanceRecord:
                from django.db import IntegrityError
                try:
                    AttendanceRecord.objects.create(
                        registration=reg,
                        event=reg.event,
                        user=reg.user,
                    )
                except IntegrityError:
                    pass  # Cleanly bypass if already created under concurrent race

    # Outside transaction: generate QR, upload to storage, and send email directly.
    # Each is wrapped in a try-except block so one registration failure does not block the others.
    for reg in regs_to_approve:
        try:
            # Generate QR Image
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(str(reg.qr_token))
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Save to BytesIO
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)
            
            # Upload to Azure
            blob_path = f'qr-codes/{reg.id}/qr.png'
            qr_url = upload_to_blob(blob_path, img_byte_arr.read(), 'image/png')
            
            # Update registration qr_image_url
            reg.qr_image_url = qr_url
            reg.save(update_fields=['qr_image_url', 'updated_at'])

            # Send Email directly
            html_content = f"""
            <p>Your registration for {reg.event.title} is approved!</p>
            <p>Your QR code is below. Present this at the event for check-in.</p>
            <img src="{qr_url}" alt="QR Code" />
            """
            send_email(
                to_email=reg.user.email,
                subject=f"Approved: {reg.event.title}",
                html_content=html_content
            )
        except Exception as e:
            logger.error("Failed post-approval tasks for registration %s: %s", reg.id, str(e))

    logger.info('%d registration(s) approved for event "%s"', len(regs_to_approve), registration.event.title)
    registration.refresh_from_db()
    return registration


def reject_registration(registration_id: uuid.UUID, reason: str, admin_user) -> Registration:
    """
    Reject a pending registration.
    Also rejects the entire team if it's a team registration.
    """
    try:
        registration = Registration.objects.select_related('event', 'team').get(id=registration_id)
    except Registration.DoesNotExist:
        raise AppError('NOT_FOUND', 'Registration not found.', 404)

    if registration.status != RegistrationStatus.PENDING:
        raise AppError('INVALID_STATUS', 'Only pending registrations can be rejected.', 400)

    if registration.is_team_registration and registration.team:
        team = registration.team
        regs_to_reject = list(team.registrations.all())
    else:
        team = None
        regs_to_reject = [registration]

    with transaction.atomic():
        if team:
            team.status = TeamStatus.REJECTED
            team.save(update_fields=['status', 'updated_at'])

        for reg in regs_to_reject:
            reg.status = RegistrationStatus.REJECTED
            reg.rejection_reason = reason
            reg.save(update_fields=['status', 'rejection_reason', 'updated_at'])
            
            # Send Email
            try:
                html_content = f"""
                <p>Your registration for {reg.event.title} has been rejected.</p>
                <p>Reason: {reason}</p>
                """
                send_email(
                    to_email=reg.user.email,
                    subject=f"Registration Rejected: {reg.event.title}",
                    html_content=html_content
                )
            except Exception as e:
                logger.error("Failed to send rejection email: %s", str(e))

    logger.info('%d registration(s) rejected for event "%s"', len(regs_to_reject), registration.event.title)
    return registration


def promote_waitlist(event: Event):
    """
    Internal service to automatically promote the first waitlisted person
    to PENDING status when a spot opens up.
    """
    # Check capacity
    approved_count = Registration.objects.filter(event=event, status=RegistrationStatus.APPROVED).count()
    if approved_count >= event.capacity:
        return

    # Find next on waitlist
    next_reg = Registration.objects.filter(
        event=event, status=RegistrationStatus.WAITLISTED
    ).order_by('waitlist_position').first()

    if next_reg:
        next_reg.status = RegistrationStatus.PENDING
        next_reg.waitlist_position = None
        next_reg.save(update_fields=['status', 'waitlist_position', 'updated_at'])
        
        logger.info('Registration %s promoted from waitlist for event "%s"', next_reg.id, event.title)
        
        try:
            html_content = f"<p>A spot opened up! Your registration for {event.title} is now pending approval.</p>"
            send_email(
                to_email=next_reg.user.email,
                subject=f"Waitlist Promotion: {event.title}",
                html_content=html_content
            )
        except Exception as e:
            logger.error("Failed to send waitlist promotion email: %s", str(e))


def cancel_registration(registration_id: uuid.UUID, user) -> None:
    """
    Cancel an own registration. Promotes waitlist if they were approved.
    """
    try:
        registration = Registration.objects.get(id=registration_id, user=user)
    except Registration.DoesNotExist:
        raise AppError('NOT_FOUND', 'Registration not found.', 404)

    if registration.status in [RegistrationStatus.CANCELLED, RegistrationStatus.REJECTED]:
        raise AppError('INVALID_STATUS', 'Registration is already cancelled or rejected.', 400)
    
    if registration.is_team_registration:
        raise AppError('TEAM_REGISTRATION', 'Cannot cancel individual team registration. Contact admin.', 400)

    was_approved = (registration.status == RegistrationStatus.APPROVED)

    with transaction.atomic():
        registration.status = RegistrationStatus.CANCELLED
        registration.waitlist_position = None
        registration.save(update_fields=['status', 'waitlist_position', 'updated_at'])

        # Soft-delete AttendanceRecord if it exists
        if was_approved:
            try:
                from attendance.models import AttendanceRecord
                AttendanceRecord.objects.filter(registration=registration).delete()
            except ImportError:
                pass

    logger.info('User %s cancelled registration for event "%s"', user.email, registration.event.title)

    if was_approved:
        promote_waitlist(registration.event)


def move_from_waitlist(registration_id: uuid.UUID, admin_user) -> Registration:
    """
    Admin action to explicitly move someone from waitlist to pending, bypassing queue.
    """
    try:
        registration = Registration.objects.get(id=registration_id, status=RegistrationStatus.WAITLISTED)
    except Registration.DoesNotExist:
        raise AppError('NOT_FOUND', 'Waitlisted registration not found.', 404)

    with transaction.atomic():
        registration.status = RegistrationStatus.PENDING
        registration.waitlist_position = None
        registration.save(update_fields=['status', 'waitlist_position', 'updated_at'])

    return registration


