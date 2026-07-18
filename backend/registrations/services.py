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
from django.template.loader import render_to_string
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
    if not getattr(event, 'is_registration_open', True):
        raise AppError('REGISTRATION_PAUSED', 'Registration for this event is currently paused.', 400)

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
        from attendance.models import AttendanceRecord
    except ImportError:
        AttendanceRecord = None

    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        raise AppError('NOT_FOUND', 'Event not found.', 404)

    _check_event_open_for_registration(event, user)

    if Registration.objects.filter(event=event, user=user).exists():
        raise AppError('ALREADY_REGISTERED', 'You are already registered for this event.', 409)

    needs_auto_approve = False

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

        if status == RegistrationStatus.PENDING and not getattr(event, 'requires_approval', True):
            needs_auto_approve = True
            registration.status = RegistrationStatus.APPROVED
            registration.qr_token = uuid.uuid4()
            registration.approved_at = timezone.now()
            registration.save(update_fields=['status', 'qr_token', 'approved_at'])

            if AttendanceRecord:
                try:
                    AttendanceRecord.objects.create(
                        registration=registration,
                        event=registration.event,
                        user=registration.user,
                    )
                except IntegrityError:
                    pass

    logger.info('User %s registered for event "%s" (Status: %s)', user.email, event.title, registration.status)
    
    # Outside transaction: Email and QR generation
    try:
        if registration.status == RegistrationStatus.WAITLISTED:
            from django.utils.html import escape
            html_content = f"<p>You are on the waitlist for {escape(event.title)}. Your position is {waitlist_position}.</p>"
            send_email(
                to_email=user.email,
                subject=f"Waitlisted: {escape(event.title)}",
                html_content=html_content
            )
        elif needs_auto_approve:
            # Generate QR Image
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(str(registration.qr_token))
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)
            
            blob_path = f'qr-codes/{registration.id}/qr.png'
            qr_url = upload_to_blob(blob_path, img_byte_arr.read(), 'image/png')
            
            registration.qr_image_url = qr_url
            registration.save(update_fields=['qr_image_url', 'updated_at'])

            context = {
                'full_name': user.full_name,
                'event_title': event.title,
                'event_start': event.start_time.strftime('%d %b %Y, %I:%M %p') if event.start_time else 'TBA',
                'event_venue': event.venue if event.venue else 'TBA',
                'qr_image_url': qr_url,
                'frontend_url': settings.FRONTEND_URL,
            }
            html_content = render_to_string('emails/registration_approved.html', context)
            send_email(
                to_email=user.email,
                subject=f"Approved: {event.title}",
                html_content=html_content
            )
        else:
            _send_pending_email(user, event)
    except Exception as e:
        logger.error("Failed to send registration email/QR for %s: %s", registration.id, str(e))
        if needs_auto_approve and not registration.qr_image_url:
            from django.utils.html import escape
            html_content = f"<p>Your registration for {escape(event.title)} is approved!</p><p>We experienced a slight delay generating your QR code. It will be available on your dashboard shortly.</p>"
            try:
                send_email(
                    to_email=user.email,
                    subject=f"Approved: {escape(event.title)}",
                    html_content=html_content
                )
            except Exception as email_err:
                logger.error("Failed to send approval fallback email: %s", str(email_err))

    return registration

def _send_pending_email(user, event):
    from django.utils.html import escape
    html_content = f"<p>Your registration for {escape(event.title)} is pending approval.</p>"
    send_email(
        to_email=user.email,
        subject=f"Registration Pending: {event.title}",
        html_content=html_content
    )


from django.utils.crypto import get_random_string

def create_team_from_registration(registration_id: uuid.UUID, team_name: str, user) -> Team:
    """
    Creates a new team for a user who already has a registration for a team event.
    """
    try:
        registration = Registration.objects.select_related('event').get(id=registration_id, user=user)
    except Registration.DoesNotExist:
        raise AppError('NOT_FOUND', 'Registration not found.', 404)

    event = registration.event
    if not event.is_team_event:
        raise AppError('NOT_TEAM_EVENT', 'This is not a team event.', 400)

    if registration.status not in [RegistrationStatus.APPROVED, RegistrationStatus.PENDING]:
        raise AppError('INVALID_STATUS', 'You must have an active registration to create a team.', 400)

    with transaction.atomic():
        # Lock registration
        try:
            registration = Registration.objects.select_for_update().get(id=registration_id, user=user)
        except Registration.DoesNotExist:
            raise AppError('NOT_FOUND', 'Registration not found.', 404)

        if registration.status not in [RegistrationStatus.APPROVED, RegistrationStatus.PENDING]:
            raise AppError('INVALID_STATUS', 'You must have an active registration to create a team.', 400)

        if registration.team:
            raise AppError('ALREADY_IN_TEAM', 'You are already in a team for this event.', 409)

        while True:
            join_code = get_random_string(length=8, allowed_chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
            if not Team.objects.filter(join_code=join_code).exists():
                break

        from django.db import IntegrityError
        
        team_status = TeamStatus.PENDING_APPROVAL if getattr(event, 'requires_approval', True) else TeamStatus.APPROVED

        try:
            team = Team.objects.create(
                event=event,
                name=team_name,
                leader=user,
                status=team_status,
                join_code=join_code
            )
        except IntegrityError:
            # Very rare collision at DB level — retry with a new code
            join_code = get_random_string(length=8, allowed_chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
            team = Team.objects.create(
                event=event,
                name=team_name,
                leader=user,
                status=team_status,
                join_code=join_code
            )

        TeamMember.objects.create(
            team=team,
            user=user,
            email=user.email.lower(),
            has_confirmed=True,
            confirmed_at=timezone.now(),
        )

        # Update the registration to point to this team
        registration.is_team_registration = True
        registration.team = team
        registration.save(update_fields=['is_team_registration', 'team'])

    logger.info('Team "%s" created by %s for event "%s" with code %s', team_name, user.email, event.title, join_code)
    return team


def join_team_with_code(registration_id: uuid.UUID, join_code: str, user) -> Team:
    """
    Joins an existing team using a join code for a user with a registration.
    """
    try:
        registration = Registration.objects.select_related('event').get(id=registration_id, user=user)
    except Registration.DoesNotExist:
        raise AppError('NOT_FOUND', 'Registration not found.', 404)

    event = registration.event
    if not event.is_team_event:
        raise AppError('NOT_TEAM_EVENT', 'This is not a team event.', 400)

    if registration.status not in [RegistrationStatus.APPROVED, RegistrationStatus.PENDING]:
        raise AppError('INVALID_STATUS', 'You must have an active registration to join a team.', 400)

    with transaction.atomic():
        # Lock registration
        try:
            registration = Registration.objects.select_for_update().get(id=registration_id, user=user)
        except Registration.DoesNotExist:
            raise AppError('NOT_FOUND', 'Registration not found.', 404)

        if registration.status not in [RegistrationStatus.APPROVED, RegistrationStatus.PENDING]:
            raise AppError('INVALID_STATUS', 'You must have an active registration to join a team.', 400)

        if registration.team:
            raise AppError('ALREADY_IN_TEAM', 'You are already in a team for this event.', 409)

        # Lock team
        try:
            team = Team.objects.select_for_update().get(join_code=join_code.upper(), event=event)
        except Team.DoesNotExist:
            raise AppError('INVALID_CODE', 'Invalid join code for this event.', 404)

        if team.status in [TeamStatus.REJECTED, TeamStatus.CANCELLED]:
            raise AppError('INVALID_TEAM_STATUS', 'This team has been rejected or cancelled.', 400)

        # Check team size
        current_members = team.members.count()
        if event.max_team_size and current_members >= event.max_team_size:
            raise AppError('TEAM_FULL', f'This team has reached the maximum size of {event.max_team_size}.', 400)

        TeamMember.objects.create(
            team=team,
            user=user,
            email=user.email.lower(),
            has_confirmed=True,
            confirmed_at=timezone.now(),
        )

        registration.is_team_registration = True
        registration.team = team
        registration.save(update_fields=['is_team_registration', 'team'])

    logger.info('User %s joined team "%s" via code', user.email, team.name)
    return team


def leave_team(registration_id: uuid.UUID, user) -> Registration:
    """
    Leaves a team. Detaches the registration from the team and deletes the TeamMember.
    If the user is the leader, they can only leave if they are the only member (deletes team).
    If there are other members, the leader cannot leave.
    """
    try:
        registration = Registration.objects.select_related('team', 'event').get(id=registration_id, user=user)
    except Registration.DoesNotExist:
        raise AppError('NOT_FOUND', 'Registration not found.', 404)

    if not registration.is_team_registration or not registration.team:
        raise AppError('NOT_IN_TEAM', 'You are not in a team.', 400)

    team = registration.team
    
    with transaction.atomic():
        # Lock the team row to avoid concurrent leave race conditions
        team = Team.objects.select_for_update().get(id=team.id)
        
        if team.leader == user:
            if team.members.count() > 1:
                raise AppError('TEAM_LEADER', 'Team leaders cannot leave while there are other members.', 400)
            else:
                # Detach registration to avoid cascade deletion when team is deleted
                registration.is_team_registration = False
                registration.team = None
                registration.save(update_fields=['is_team_registration', 'team'])
                # Leader is the only member, delete the team (cascades TeamMember)
                team.delete()
        else:
            # Remove from TeamMember
            TeamMember.objects.filter(team=team, user=user).delete()
            # Detach registration from team
            registration.is_team_registration = False
            registration.team = None
        
        # Clean up the QR blob if the user was approved
        if registration.status == RegistrationStatus.APPROVED and registration.qr_image_url:
            from core.utils.storage import delete_blob_from_url
            def delete_qr(url=registration.qr_image_url, reg_id=registration.id):
                try:
                    delete_blob_from_url(url)
                except Exception as exc:
                    logger.warning('Failed to delete QR blob for registration %s: %s', reg_id, exc)
            transaction.on_commit(delete_qr)

        # Clean up the AttendanceRecord and deduct points if user was approved
        if registration.status == RegistrationStatus.APPROVED:
            from attendance.models import AttendanceRecord
            if hasattr(registration, 'attendance_record'):
                record = registration.attendance_record
                if record.is_checked_in:
                    from django.db.models import F, Value
                    from django.db.models.functions import Greatest
                    User.objects.filter(pk=record.user.pk).update(
                        club_points=Greatest(F('club_points') - registration.event.points, Value(0))
                    )
                AttendanceRecord.objects.filter(registration=registration).delete()

        # Reset status if it was approved as part of a team
        if registration.status == RegistrationStatus.APPROVED:
            registration.status = RegistrationStatus.PENDING
            registration.qr_token = None
            registration.qr_image_url = None
            
        registration.save(update_fields=['is_team_registration', 'team', 'status', 'qr_token', 'qr_image_url', 'updated_at'])

    logger.info('User %s left team "%s"', user.email, team.name)
    return registration



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
        team = None
        regs_to_approve = [db_reg]

        # Check capacity against event limit using locked values
        approved_count = Registration.objects.filter(event=event, status=RegistrationStatus.APPROVED).count()
        if approved_count + len(regs_to_approve) > event.capacity:
            raise AppError('CAPACITY_EXCEEDED', 'Approving this would exceed event capacity.', 400)

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
            context = {
                'full_name': reg.user.full_name,
                'event_title': reg.event.title,
                'event_start': reg.event.start_time.strftime('%d %b %Y, %I:%M %p') if reg.event.start_time else 'TBA',
                'event_venue': reg.event.venue if reg.event.venue else 'TBA',
                'qr_image_url': qr_url,
                'frontend_url': settings.FRONTEND_URL,
            }
            html_content = render_to_string('emails/registration_approved.html', context)
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


def approve_team(team_id: uuid.UUID, admin_user) -> Team:
    """
    Approve all pending members of a team.
    """
    try:
        from attendance.models import AttendanceRecord
    except ImportError:
        AttendanceRecord = None

    try:
        team = Team.objects.select_related('event').get(id=team_id)
    except Team.DoesNotExist:
        raise AppError('NOT_FOUND', 'Team not found.', 404)

    with transaction.atomic():
        # Lock the Event row to prevent race conditions on capacity calculation
        event = Event.objects.select_for_update().get(id=team.event.id)

        # Lock pending registrations for this team
        regs_to_approve = list(team.registrations.select_for_update().filter(status=RegistrationStatus.PENDING))

        if not regs_to_approve:
            raise AppError('INVALID_STATUS', 'No pending members found in this team to approve.', 400)

        # Check min team size
        if event.min_team_size and team.members.count() < event.min_team_size:
            raise AppError('TEAM_TOO_SMALL', f'Team must have at least {event.min_team_size} members to be approved.', 400)

        # Check capacity against event limit using locked values
        approved_count = Registration.objects.filter(event=event, status=RegistrationStatus.APPROVED).count()
        if approved_count + len(regs_to_approve) > event.capacity:
            raise AppError('CAPACITY_EXCEEDED', 'Approving this team would exceed event capacity.', 400)

        for reg in regs_to_approve:
            qr_token = uuid.uuid4()
            
            # Update registration
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
                    pass

    # Outside transaction: generate QR, upload, and email
    for reg in regs_to_approve:
        try:
            qr = qrcode.QRCode(version=1, box_size=10, border=4)
            qr.add_data(str(reg.qr_token))
            qr.make(fit=True)
            img = qr.make_image(fill_color="black", back_color="white")
            
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)
            
            blob_path = f'qr-codes/{reg.id}/qr.png'
            qr_url = upload_to_blob(blob_path, img_byte_arr.read(), 'image/png')
            
            reg.qr_image_url = qr_url
            reg.save(update_fields=['qr_image_url', 'updated_at'])

            html_content = f"""
            <p>Your team registration for {reg.event.title} is approved!</p>
            <p>Your QR code is below. Present this at the event for check-in.</p>
            <img src="{qr_url}" alt="QR Code" />
            """
            send_email(
                to_email=reg.user.email,
                subject=f"Team Approved: {reg.event.title}",
                html_content=html_content
            )
        except Exception as e:
            logger.error("Failed post-approval tasks for team member %s: %s", reg.id, str(e))

    logger.info('%d member(s) approved for team "%s"', len(regs_to_approve), team.name)
    return team


def reject_team(team_id: uuid.UUID, reason: str, admin_user) -> Team:
    """
    Reject all pending members of a team.
    """
    try:
        team = Team.objects.select_related('event').get(id=team_id)
    except Team.DoesNotExist:
        raise AppError('NOT_FOUND', 'Team not found.', 404)

    with transaction.atomic():
        regs_to_reject = list(team.registrations.select_for_update().filter(status=RegistrationStatus.PENDING))

        if not regs_to_reject:
            raise AppError('INVALID_STATUS', 'No pending members found in this team to reject.', 400)

        for reg in regs_to_reject:
            reg.status = RegistrationStatus.REJECTED
            reg.rejection_reason = reason
            reg.save(update_fields=['status', 'rejection_reason', 'updated_at'])
            
            # Note: We do NOT deduct capacity here because pending registrations don't consume capacity.

    # Outside transaction: send email
    for reg in regs_to_reject:
        try:
            html_content = f"""
            <p>We're sorry, but your team registration for {reg.event.title} was not approved.</p>
            <p>Reason provided: {reason}</p>
            """
            send_email(
                to_email=reg.user.email,
                subject=f"Update on your registration for {reg.event.title}",
                html_content=html_content
            )
        except Exception as e:
            logger.error("Failed to send rejection email to team member %s: %s", reg.id, str(e))

    logger.info('%d member(s) rejected for team "%s"', len(regs_to_reject), team.name)
    return team


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

    with transaction.atomic():
        if registration.is_team_registration and registration.team:
            team = registration.team
            team.status = TeamStatus.REJECTED
            team.save(update_fields=['status', 'updated_at'])
            regs_to_reject = list(team.registrations.select_for_update().filter(
                status=RegistrationStatus.PENDING
            ))
        else:
            team = None
            regs_to_reject = list(
                Registration.objects.select_for_update().filter(
                    id=registration_id, status=RegistrationStatus.PENDING
                )
            )

        for reg in regs_to_reject:
            reg.status = RegistrationStatus.REJECTED
            reg.rejection_reason = reason
            reg.save(update_fields=['status', 'rejection_reason', 'updated_at'])

    # Outside transaction: send email
    for reg in regs_to_reject:
        try:
            from django.utils.html import escape
            html_content = f"""
            <p>Your registration for {escape(reg.event.title)} has been rejected.</p>
            <p>Reason: {escape(reason)}</p>
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
        # Delete QR blob if registration was approved
        if was_approved and registration.qr_image_url:
            from core.utils.storage import delete_blob_from_url
            def delete_qr(url=registration.qr_image_url, reg_id=registration.id):
                try:
                    delete_blob_from_url(url)
                except Exception as exc:
                    logger.warning('Failed to delete QR blob for registration %s: %s', reg_id, exc)
            transaction.on_commit(delete_qr)
            
        registration.status = RegistrationStatus.CANCELLED
        registration.waitlist_position = None
        registration.qr_image_url = None
        registration.qr_token = None
        registration.save(update_fields=['status', 'waitlist_position', 'qr_image_url', 'qr_token', 'updated_at'])

        # Clean up the AttendanceRecord and deduct points if it exists
        if was_approved:
            try:
                from attendance.models import AttendanceRecord
                if hasattr(registration, 'attendance_record'):
                    record = registration.attendance_record
                    if record.is_checked_in:
                        from django.db.models import F, Value
                        from django.db.models.functions import Greatest
                        User.objects.filter(pk=record.user.pk).update(
                            club_points=Greatest(F('club_points') - registration.event.points, Value(0))
                        )
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


