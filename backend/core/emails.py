"""
core/emails.py

Central module for all transactional email notifications.
All emails are sent via Django's email backend (SMTP in prod, console in dev).

Functions follow the naming convention: send_<trigger>_email(...)
Each function accepts domain objects — never raw IDs.
"""

import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

def _send(subject: str, text_body: str, html_body: str, to: list[str]) -> None:
    """
    Low-level send helper. Wraps EmailMultiAlternatives so every notification
    function doesn't repeat the boilerplate. Logs errors but re-raises so
    callers can decide whether to surface them to the user.
    """
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=to,
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send()
        logger.info(f"Email '{subject}' sent to {to}")
    except Exception as e:
        logger.error(f"Failed to send email '{subject}' to {to}: {e}")
        raise


def _base_html(content: str, title: str = "C Square Club") -> str:
    """
    Wraps an inner HTML string in the standard branded email shell.
    All emails share this outer layout — black header, white body, grey footer.
    """
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#000000;padding:28px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.2px;">
                C Square Club
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              {content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:18px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                C Square Club &bull; Chandigarh University
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _cta_button(label: str, url: str) -> str:
    """Reusable black CTA button HTML."""
    return f"""
<table cellpadding="0" cellspacing="0" style="margin:28px 0;">
  <tr>
    <td style="border-radius:6px;background:#000000;">
      <a href="{url}"
         style="display:inline-block;padding:13px 26px;color:#ffffff;font-size:14px;
                font-weight:600;text-decoration:none;border-radius:6px;">
        {label}
      </a>
    </td>
  </tr>
</table>"""


def _divider() -> str:
    return '<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;">'


def _muted(text: str) -> str:
    return f'<p style="margin:16px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">{text}</p>'


def _event_detail_block(event) -> str:
    """Renders a summary box of event details for inclusion in emails."""
    from django.utils.formats import date_format
    start = event.start_datetime.strftime('%d %b %Y, %I:%M %p UTC')
    return f"""
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;margin:20px 0;">
  <tr>
    <td style="padding:16px 20px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;">Event Details</p>
      <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.8;">
        <strong style="color:#111827;">{event.title}</strong><br>
        📅 {start}<br>
        📍 {event.venue}
      </p>
    </td>
  </tr>
</table>"""


# ---------------------------------------------------------------------------
# 1. Registration received (individual & team leader)
# ---------------------------------------------------------------------------

def send_registration_received_email(registration) -> None:
    """
    Sent immediately after a registration is submitted.
    Status is 'pending' — tells the student to wait for admin review.
    """
    user = registration.user
    event = registration.event
    dashboard_url = f"{settings.FRONTEND_URL}/dashboard"

    subject = f"Registration received — {event.title}"

    text_body = (
        f"Hi {user.full_name or 'there'},\n\n"
        f"We've received your registration for {event.title}.\n"
        f"Your registration is currently pending review by our team.\n"
        f"We'll notify you once a decision has been made.\n\n"
        f"View your registrations: {dashboard_url}\n\n"
        f"— C Square Club Team"
    )

    content = f"""
<p style="margin:0 0 6px;font-size:15px;color:#374151;">
  Hi <strong>{user.full_name or 'there'}</strong>,
</p>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
  We've received your registration for <strong>{event.title}</strong>.
  Your registration is currently <strong>pending review</strong> by our team.
  We'll send you an email once a decision has been made — usually within 24–48 hours.
</p>
{_event_detail_block(event)}
{_cta_button("View My Registrations", dashboard_url)}
{_divider()}
{_muted("If you didn't submit this registration, please ignore this email.")}
"""

    _send(subject, text_body, _base_html(content, subject), [user.email])


# ---------------------------------------------------------------------------
# 2. Registration approved (with QR code link)
# ---------------------------------------------------------------------------

def send_registration_approved_email(registration) -> None:
    """
    Sent when an admin approves a registration.
    Includes the QR code image URL and event details.
    """
    user = registration.user
    event = registration.event
    qr_url = registration.qr_image_url or ''
    dashboard_url = f"{settings.FRONTEND_URL}/dashboard/{registration.id}"

    subject = f"You're in! Registration approved — {event.title}"

    text_body = (
        f"Hi {user.full_name or 'there'},\n\n"
        f"Your registration for {event.title} has been APPROVED!\n\n"
        f"Event: {event.title}\n"
        f"Venue: {event.venue}\n"
        f"Date: {event.start_datetime.strftime('%d %b %Y, %I:%M %p UTC')}\n\n"
        f"Your QR code is ready. Show it at the entrance on event day.\n"
        f"View your QR code: {dashboard_url}\n\n"
        f"— C Square Club Team"
    )

    qr_section = ""
    if qr_url:
        qr_section = f"""
<p style="margin:20px 0 8px;font-size:14px;font-weight:600;color:#111827;">Your QR Code</p>
<p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.6;">
  Show this at the entrance on event day. Screenshot it or access it from your dashboard.
</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
  <tr>
    <td style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;background:#ffffff;">
      <img src="{qr_url}" width="180" height="180" alt="Your QR Code"
           style="display:block;border:0;">
    </td>
  </tr>
</table>"""

    content = f"""
<p style="margin:0 0 4px;font-size:15px;color:#374151;">
  Hi <strong>{user.full_name or 'there'}</strong>,
</p>
<p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
  You're in! 🎉
</p>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
  Your registration for <strong>{event.title}</strong> has been approved.
</p>
{_event_detail_block(event)}
{qr_section}
{_cta_button("View QR Code & Details", dashboard_url)}
{_divider()}
{_muted(
    "What to bring: your QR code (screenshot or from dashboard) and a valid student ID.<br>"
    "If you can no longer attend, please cancel your registration from your dashboard."
)}
"""

    _send(subject, text_body, _base_html(content, subject), [user.email])


# ---------------------------------------------------------------------------
# 3. Registration rejected
# ---------------------------------------------------------------------------

def send_registration_rejected_email(registration) -> None:
    """
    Sent when an admin rejects a registration.
    Includes the rejection reason if one was provided.
    """
    user = registration.user
    event = registration.event
    reason = registration.rejection_reason or 'No reason was provided.'
    events_url = f"{settings.FRONTEND_URL}/events"

    subject = f"Registration update — {event.title}"

    text_body = (
        f"Hi {user.full_name or 'there'},\n\n"
        f"Unfortunately, your registration for {event.title} was not approved.\n\n"
        f"Reason: {reason}\n\n"
        f"You can browse upcoming events at: {events_url}\n\n"
        f"— C Square Club Team"
    )

    reason_block = f"""
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;margin:20px 0;">
  <tr>
    <td style="padding:14px 18px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#991b1b;">Reason</p>
      <p style="margin:0;font-size:13px;color:#7f1d1d;line-height:1.6;">{reason}</p>
    </td>
  </tr>
</table>"""

    content = f"""
<p style="margin:0 0 6px;font-size:15px;color:#374151;">
  Hi <strong>{user.full_name or 'there'}</strong>,
</p>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
  We're sorry to inform you that your registration for
  <strong>{event.title}</strong> was not approved this time.
</p>
{reason_block}
{_event_detail_block(event)}
{_cta_button("Browse Upcoming Events", events_url)}
{_divider()}
{_muted(
    "We hope to see you at a future event. "
    "If you have questions, reply to this email and our team will get back to you."
)}
"""

    _send(subject, text_body, _base_html(content, subject), [user.email])


# ---------------------------------------------------------------------------
# 4. Waitlisted
# ---------------------------------------------------------------------------

def send_waitlist_email(registration) -> None:
    """
    Sent when a registration is created but the event is full.
    Tells the student their position and that they'll be notified if a spot opens.
    """
    user = registration.user
    event = registration.event
    position = registration.waitlist_position
    dashboard_url = f"{settings.FRONTEND_URL}/dashboard"

    subject = f"You're on the waitlist — {event.title}"

    text_body = (
        f"Hi {user.full_name or 'there'},\n\n"
        f"{event.title} is currently full, but you've been added to the waitlist.\n"
        f"Your waitlist position: #{position}\n\n"
        f"We'll notify you immediately if a spot opens up.\n"
        f"View your registrations: {dashboard_url}\n\n"
        f"— C Square Club Team"
    )

    content = f"""
<p style="margin:0 0 6px;font-size:15px;color:#374151;">
  Hi <strong>{user.full_name or 'there'}</strong>,
</p>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
  <strong>{event.title}</strong> is currently at full capacity, but we've added you to the waitlist.
  If a spot opens up, we'll move you to pending review and notify you right away.
</p>
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;margin:0 0 20px;">
  <tr>
    <td style="padding:16px 20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#0369a1;font-weight:600;">Your Waitlist Position</p>
      <p style="margin:0;font-size:36px;font-weight:700;color:#0c4a6e;">#{position}</p>
    </td>
  </tr>
</table>
{_event_detail_block(event)}
{_cta_button("View My Registrations", dashboard_url)}
{_divider()}
{_muted(
    "You can cancel your waitlist spot anytime from your dashboard if your plans change."
)}
"""

    _send(subject, text_body, _base_html(content, subject), [user.email])


# ---------------------------------------------------------------------------
# 5. Promoted off waitlist
# ---------------------------------------------------------------------------

def send_waitlist_promoted_email(registration) -> None:
    """
    Sent when a waitlisted registration is automatically promoted to pending
    after a cancellation frees up a spot.
    """
    user = registration.user
    event = registration.event
    dashboard_url = f"{settings.FRONTEND_URL}/dashboard"

    subject = f"Good news — a spot opened up for {event.title}"

    text_body = (
        f"Hi {user.full_name or 'there'},\n\n"
        f"A spot has opened up for {event.title}! "
        f"Your registration is now pending review by our team.\n"
        f"We'll notify you once a decision has been made.\n\n"
        f"View your registrations: {dashboard_url}\n\n"
        f"— C Square Club Team"
    )

    content = f"""
<p style="margin:0 0 6px;font-size:15px;color:#374151;">
  Hi <strong>{user.full_name or 'there'}</strong>,
</p>
<p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">
  Good news — a spot opened up! 🎊
</p>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
  A registration for <strong>{event.title}</strong> was cancelled, and you've been moved
  from the waitlist to <strong>pending review</strong>.
  Our team will review your registration shortly.
</p>
{_event_detail_block(event)}
{_cta_button("View My Registrations", dashboard_url)}
{_divider()}
{_muted(
    "If you're no longer able to attend, please cancel your registration from your dashboard "
    "so others on the waitlist can take your spot."
)}
"""

    _send(subject, text_body, _base_html(content, subject), [user.email])


# ---------------------------------------------------------------------------
# 6. Teammate invite
# ---------------------------------------------------------------------------

def send_teammate_invite_email(team_member, team, event) -> None:
    """
    Sent to each teammate when a team registration is created.
    Contains a confirmation link they must click to join the team.
    """
    confirmation_url = (
        f"{settings.FRONTEND_URL}/registrations/team/{team.id}/confirm"
        f"?token={team_member.confirmation_token}"
    )

    subject = f"You've been invited to join {team.name} — {event.title}"

    text_body = (
        f"Hi there,\n\n"
        f"{team.leader.full_name} has invited you to join their team "
        f"'{team.name}' for {event.title}.\n\n"
        f"To confirm your participation, click the link below:\n"
        f"{confirmation_url}\n\n"
        f"This link expires when the registration deadline passes.\n"
        f"If you don't want to join, simply ignore this email.\n\n"
        f"— C Square Club Team"
    )

    content = f"""
<p style="margin:0 0 6px;font-size:15px;color:#374151;">Hi there,</p>
<p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
  <strong>{team.leader.full_name}</strong> has invited you to join their team
  <strong>"{team.name}"</strong> for <strong>{event.title}</strong>.
  Click the button below to confirm your participation.
</p>
{_event_detail_block(event)}
{_cta_button("Confirm My Participation", confirmation_url)}
{_divider()}
<p style="margin:0 0 8px;font-size:13px;color:#6b7280;line-height:1.6;">
  Or copy and paste this URL into your browser:<br>
  <a href="{confirmation_url}" style="color:#000;word-break:break-all;">{confirmation_url}</a>
</p>
{_muted(
    "If you don't want to join this team, simply ignore this email — no action is needed.<br>"
    "You'll need to log in or create an account to confirm."
)}
"""

    _send(subject, text_body, _base_html(content, subject), [team_member.email])
