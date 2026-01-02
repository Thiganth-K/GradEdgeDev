import os
import smtplib
import ssl
import logging
from email.message import EmailMessage

_LOG = logging.getLogger(__name__)


def _get_env_choices(*names, default=None):
    for n in names:
        v = os.environ.get(n)
        if v is not None and v != '':
            return v
    return default


def send_otp_email(to_email: str, otp: str, subject: str | None = None, body: str | None = None) -> None:
    """Send a simple plaintext OTP email using SMTP settings from environment.

    This helper accepts multiple common dotenv names for compatibility:
      host: SMTP_HOST or SMTP_SERVER
      port: SMTP_PORT
      user: SMTP_USER or SMTP_USERNAME
      pass: SMTP_PASS or SMTP_PASSWORD
      from: SMTP_FROM or FROM_EMAIL
      tls flag: SMTP_USE_TLS

    Raises RuntimeError if host/port are missing. On send failure the exception
    is re-raised, but the OTP is logged to help local development debugging.
    """
    host = _get_env_choices('SMTP_HOST', 'SMTP_SERVER')
    port_str = _get_env_choices('SMTP_PORT')
    user = _get_env_choices('SMTP_USER', 'SMTP_USERNAME')
    password = _get_env_choices('SMTP_PASS', 'SMTP_PASSWORD')
    from_addr = _get_env_choices('SMTP_FROM', 'FROM_EMAIL', default=None) or user or f'no-reply@{host or "localhost"}'
    use_tls = _get_env_choices('SMTP_USE_TLS', default='true').lower() in ('1', 'true', 'yes')

    try:
        port = int(port_str) if port_str else 587
    except Exception:
        port = 587

    if not host:
        raise RuntimeError('SMTP_HOST or SMTP_SERVER required')

    subject = subject or 'Your GradEdgeDev verification code'
    body = body or f'Your GradEdgeDev verification code is: {otp}'

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_email
    msg.set_content(body)

    # Use SSL if port 465, otherwise optionally STARTTLS
    try:
        if port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context) as server:
                if user and password:
                    server.login(user, password)
                server.send_message(msg)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            try:
                if use_tls:
                    server.starttls(context=ssl.create_default_context())
                if user and password:
                    server.login(user, password)
                server.send_message(msg)
            finally:
                try:
                    server.quit()
                except Exception:
                    pass
    except Exception as exc:
        # Helpful log for local dev: show OTP in server logs so testing works
        _LOG.exception('SMTP send failed')
        _LOG.info('Fallback OTP for %s: %s', to_email, otp)
        raise


def send_welcome_email(to_email: str, role: str, username: str | None, message: str) -> None:
    """Send a simple role-based welcome email to first-time signups.

    Reuses the same SMTP configuration as send_otp_email.
    """
    host = _get_env_choices('SMTP_HOST', 'SMTP_SERVER')
    port_str = _get_env_choices('SMTP_PORT')
    user = _get_env_choices('SMTP_USER', 'SMTP_USERNAME')
    password = _get_env_choices('SMTP_PASS', 'SMTP_PASSWORD')
    from_addr = _get_env_choices('SMTP_FROM', 'FROM_EMAIL', default=None) or user or f'no-reply@{host or "localhost"}'
    use_tls = _get_env_choices('SMTP_USE_TLS', default='true').lower() in ('1', 'true', 'yes')

    try:
        port = int(port_str) if port_str else 587
    except Exception:
        port = 587

    if not host:
        raise RuntimeError('SMTP_HOST or SMTP_SERVER required')

    role_label = (role or 'student').capitalize()
    name = username or 'there'
    subject = f'Welcome to GradEdgeDev, {name}!'
    body = f"Hello {name},\n\n{message}\n\nRole: {role_label}\n\nThanks for joining GradEdgeDev!"

    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = from_addr
    msg['To'] = to_email
    msg.set_content(body)

    try:
        if port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(host, port, context=context) as server:
                if user and password:
                    server.login(user, password)
                server.send_message(msg)
        else:
            server = smtplib.SMTP(host, port, timeout=10)
            try:
                if use_tls:
                    server.starttls(context=ssl.create_default_context())
                if user and password:
                    server.login(user, password)
                server.send_message(msg)
            finally:
                try:
                    server.quit()
                except Exception:
                    pass
    except Exception:
        _LOG.exception('Failed to send welcome email to %s', to_email)
