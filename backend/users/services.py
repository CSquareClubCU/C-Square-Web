import logging
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from sesame.utils import get_token
from .models import User

logger = logging.getLogger(__name__)

CU_DOMAINS = ['cuchd.in', 'cumail.in']


def is_cu_student(email: str) -> bool:
    """Return True if the email domain belongs to Chandigarh University."""
    domain = email.split('@')[-1].lower()
    return domain in CU_DOMAINS


def send_magic_link(email: str) -> None:
    """
    Get or create a user by email, generate a sesame magic link token,
    and send it to the user's inbox via SMTP.
    In development (console backend), the email is printed to the terminal.
    """
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'full_name': email.split('@')[0],
            'is_cu_student': is_cu_student(email),
        }
    )

    token = get_token(user)
    magic_link = f"{settings.FRONTEND_URL}/auth/verify?token={token}"

    subject = "Your C Square Club Login Link"

    # Plain-text fallback (always include for email clients that don't render HTML)
    text_body = (
        f"Hi {user.full_name or 'there'},\n\n"
        f"Click the link below to log in to C Square Club:\n\n"
        f"{magic_link}\n\n"
        f"This link expires in 15 minutes and can only be used once.\n"
        f"If you didn't request this, you can safely ignore this email.\n\n"
        f"— C Square Club Team"
    )

    # HTML email body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="background:#000000;padding:32px 40px;">
                  <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">
                    C Square Club
                  </h1>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding:40px;">
                  <p style="margin:0 0 8px;font-size:15px;color:#374151;">
                    Hi <strong>{user.full_name or 'there'}</strong>,
                  </p>
                  <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.6;">
                    Click the button below to log in to C Square Club.
                    This link expires in <strong>15 minutes</strong> and can only be used once.
                  </p>
                  <!-- CTA Button -->
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="border-radius:6px;background:#000000;">
                        <a href="{magic_link}"
                           style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:6px;">
                          Log in to C Square Club
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:32px 0 0;font-size:13px;color:#6b7280;line-height:1.6;">
                    Or copy and paste this URL into your browser:<br>
                    <a href="{magic_link}" style="color:#000000;word-break:break-all;">{magic_link}</a>
                  </p>
                  <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:13px;color:#9ca3af;">
                    If you didn't request this email, you can safely ignore it.
                    No account will be created without clicking the link above.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;">
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
    </html>
    """

    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )
        msg.attach_alternative(html_body, "text/html")
        msg.send()
        logger.info(f"Magic link email sent to {email} (new_user={created})")
    except Exception as e:
        logger.error(f"Failed to send magic link email to {email}: {e}")
        raise
