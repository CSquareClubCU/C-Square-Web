"""
Email utility.

All emails in the project go through send_email().
Each specific email type (magic link, approval, rejection, etc.)
has its own helper function that renders a template and calls send_email().
"""

import html
import logging
import re
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)


def send_email(
    to: str = None,
    subject: str = None,
    html_body: str = None,
    to_email: str = None,
    html_content: str = None,
    raise_on_error: bool = False,
) -> None:
    """
    Send an HTML email via Azure Communication Services SDK.

    Args:
        to: Recipient email address
        subject: Email subject line
        html_body: Rendered HTML string

    In local development without Azure credentials, logs the email instead of sending.
    """
    to = to or to_email
    html_body = html_body or html_content
    sender = getattr(settings, 'DEFAULT_FROM_EMAIL', 'DoNotReply@csquareclub.co.in')
    connection_string = getattr(settings, 'AZURE_COMMUNICATION_CONNECTION_STRING', None)

    if not connection_string:
        print('\n' + '='*50)
        print(f'[EMAIL STUB] To: {to} | Subject: {subject}')
        print('='*50)
        print(html_body)
        print('='*50 + '\n')
        return

    # Generate plain text version to avoid Outlook/Exchange spam filters
    safe_body = html_body or ""
    safe_body_spaced = re.sub(r'</?(div|p|br|h[1-6]|li|tr|td|th)[^>]*>', '\n', safe_body, flags=re.IGNORECASE)
    plain_text = html.unescape(strip_tags(safe_body_spaced).strip())
    # Extract URLs and append them to plain text so they are accessible
    urls = re.findall(r'href=[\'"]?([^\'" >]+)', safe_body)
    if urls:
        unique_urls = list(dict.fromkeys(html.unescape(u) for u in urls))
        plain_text += "\n\nLinks:\n" + "\n".join(unique_urls)

    try:
        from azure.communication.email import EmailClient
        client = EmailClient.from_connection_string(connection_string)

        message = {
            "senderAddress": sender,
            "recipients":  {
                "to": [{"address": to}],
            },
            "content": {
                "subject": subject,
                "plainText": plain_text,
                "html": html_body
            }
        }

        # Fire-and-forget submission
        poller = client.begin_send(message)
        # We deliberately do not call poller.result() here to keep the API blazing fast.
        
    except Exception as exc:
        logger.exception('Failed to send email to %s: %s', to, exc)
        if raise_on_error:
            raise exc


# ---------------------------------------------------------------------------
# Specific email senders — one function per email type
# ---------------------------------------------------------------------------

def send_magic_link_email(to: str, magic_link_url: str) -> None:
    """Send the magic link login email."""
    html_body = render_to_string('emails/magic_link.html', {
        'magic_link_url': magic_link_url,
        'frontend_url': settings.FRONTEND_URL,
    })
    send_email(
        to=to,
        subject='Login to C Square Club',
        html_body=html_body,
        raise_on_error=True,
    )


def send_registration_submitted_email(to: str, event_title: str) -> None:
    """Notify student that their registration was received and is pending review."""
    html_body = render_to_string('emails/registration_submitted.html', {
        'event_title': event_title,
        'frontend_url': settings.FRONTEND_URL,
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
        'frontend_url': settings.FRONTEND_URL,
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
        'frontend_url': settings.FRONTEND_URL,
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
        'frontend_url': settings.FRONTEND_URL,
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
        'frontend_url': settings.FRONTEND_URL,
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
        'frontend_url': settings.FRONTEND_URL,
    })
    send_email(
        to=to,
        subject=f'You\'ve been invited to join {team_name} — {event_title}',
        html_body=html_body,
    )
