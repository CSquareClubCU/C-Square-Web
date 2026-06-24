"""
Email utility wrapping Azure Communication Services.

All emails in the project go through send_email().
Each specific email type (magic link, approval, rejection, etc.)
has its own helper function that renders a template and calls send_email().

In v1, all emails are sent synchronously — no Celery, no Redis.
"""

import logging

from django.conf import settings
from django.template.loader import render_to_string

logger = logging.getLogger(__name__)


def send_email(
    to: str = None,
    subject: str = None,
    html_body: str = None,
    to_email: str = None,
    html_content: str = None,
) -> None:
    """
    Send an HTML email via Azure Communication Services.

    Args:
        to: Recipient email address
        subject: Email subject line
        html_body: Rendered HTML string

    In local development without Azure credentials, logs the email instead of sending.
    """
    to = to or to_email
    html_body = html_body or html_content

    connection_string = settings.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING
    sender = settings.NOTIFICATION_EMAIL

    if not connection_string:
        logger.info(
            '[EMAIL STUB] To: %s | Subject: %s\n%s',
            to, subject, html_body
        )
        return

    try:
        from azure.communication.email import EmailClient

        client = EmailClient.from_connection_string(connection_string)
        message = {
            'senderAddress': sender,
            'recipients': {
                'to': [{'address': to}],
            },
            'content': {
                'subject': subject,
                'html': html_body,
            },
        }
        poller = client.begin_send(message)
        poller.result()  # Wait for send — synchronous in v1

    except Exception as exc:
        logger.exception('Failed to send email to %s: %s', to, exc)
        # Do not raise — email failure should not break the user's action in v1


# ---------------------------------------------------------------------------
# Specific email senders — one function per email type
# ---------------------------------------------------------------------------

def send_magic_link_email(to: str, magic_link_url: str) -> None:
    """Send the magic link login email."""
    html_body = render_to_string('emails/magic_link.html', {
        'magic_link_url': magic_link_url,
    })
    send_email(
        to=to,
        subject='Your C Square Club login link',
        html_body=html_body,
    )


def send_registration_submitted_email(to: str, event_title: str) -> None:
    """Notify student that their registration was received and is pending review."""
    html_body = render_to_string('emails/registration_submitted.html', {
        'event_title': event_title,
    })
    send_email(
        to=to,
        subject=f'Registration received — {event_title}',
        html_body=html_body,
    )


def send_registration_approved_email(
    to: str,
    full_name: str,
    event_title: str,
    event_start: str,
    event_venue: str,
    qr_image_url: str,
) -> None:
    """Send approval confirmation with QR code."""
    html_body = render_to_string('emails/registration_approved.html', {
        'full_name': full_name,
        'event_title': event_title,
        'event_start': event_start,
        'event_venue': event_venue,
        'qr_image_url': qr_image_url,
    })
    send_email(
        to=to,
        subject=f'You\'re in! — {event_title}',
        html_body=html_body,
    )


def send_registration_rejected_email(
    to: str,
    full_name: str,
    event_title: str,
    reason: str,
) -> None:
    """Notify student of rejection with reason."""
    html_body = render_to_string('emails/registration_rejected.html', {
        'full_name': full_name,
        'event_title': event_title,
        'reason': reason,
    })
    send_email(
        to=to,
        subject=f'Registration update — {event_title}',
        html_body=html_body,
    )


def send_waitlist_email(to: str, full_name: str, event_title: str, position: int) -> None:
    """Notify student they are on the waitlist."""
    html_body = render_to_string('emails/waitlisted.html', {
        'full_name': full_name,
        'event_title': event_title,
        'position': position,
    })
    send_email(
        to=to,
        subject=f'Waitlist position — {event_title}',
        html_body=html_body,
    )


def send_off_waitlist_email(to: str, full_name: str, event_title: str) -> None:
    """Notify student a spot opened and their registration is now pending."""
    html_body = render_to_string('emails/off_waitlist.html', {
        'full_name': full_name,
        'event_title': event_title,
    })
    send_email(
        to=to,
        subject=f'A spot opened up — {event_title}',
        html_body=html_body,
    )


def send_teammate_invite_email(
    to: str,
    team_name: str,
    event_title: str,
    leader_name: str,
    confirmation_url: str,
) -> None:
    """Send team invitation to a teammate."""
    html_body = render_to_string('emails/teammate_invite.html', {
        'team_name': team_name,
        'event_title': event_title,
        'leader_name': leader_name,
        'confirmation_url': confirmation_url,
    })
    send_email(
        to=to,
        subject=f'You\'ve been invited to join {team_name} — {event_title}',
        html_body=html_body,
    )
