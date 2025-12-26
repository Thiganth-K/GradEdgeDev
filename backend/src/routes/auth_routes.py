from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from werkzeug.security import check_password_hash
import os
import random
from datetime import datetime, timedelta

from src.controllers.faculty_controller import verify_faculty_credentials
from src.controllers.signup_controller import create_user, verify_user_credentials, _ensure_store, COLLECTION_MAP, reset_user_password
from src.controllers.logs_controller import log_event
try:
    from src.mail.mail import send_otp_email, send_welcome_email
except Exception:
    send_otp_email = None
    send_welcome_email = None


router = APIRouter()


def _ensure_otp_store(app):
    store = getattr(app, '_otp_store', None)
    if store is None:
        store = {}
        setattr(app, '_otp_store', store)
    return store


def _generate_welcome_message(role: str, username: str | None) -> str:
    name = username or 'there'
    role = (role or 'student').lower()
    if role == 'admin':
        return f"Welcome, {name}! You can now manage users, logs, and platform settings."
    if role == 'faculty':
        return f"Welcome, {name}! You can now manage your students and track their performance."
    if role == 'recruiter':
        return f"Welcome, {name}! You can now explore candidates and manage your hiring pipeline."
    if role == 'institutional':
        return f"Welcome, {name}! Your institutional dashboard is ready to manage your cohorts."
    # default to student
    return f"Welcome, {name}! Your student dashboard is ready to explore."


async def _get_data(request: Request) -> dict:
    try:
        if 'application/json' in (request.headers.get('content-type') or ''):
            return await request.json() or {}
        form = await request.form()
        return dict(form) if form else {}
    except Exception:
        return {}


@router.post('/api/auth/login')
async def login(request: Request) -> JSONResponse:
    data = await _get_data(request)
    username = data.get('username') or data.get('name')
    password = data.get('password')

    if not username or not password:
        return JSONResponse({'ok': False, 'message': 'username and password required'}, status_code=400)

    app = request.app
    client = getattr(app, 'mongo_client', None)
    # Try DB-auth if available
    if client is not None:
        try:
            db = client.get_database('gradedgedev')
            # Check `users` collection first
            users_coll = db.get_collection('users')
            user_doc = users_coll.find_one({'username': username})
            if user_doc and 'password' in user_doc and check_password_hash(user_doc['password'], password):
                role = user_doc.get('role', 'student')
                if role in ('admin', 'faculty'):
                    redirect = '/admin/welcome'
                elif role == 'student':
                    redirect = '/student/welcome'
                elif role == 'recruiter':
                    redirect = '/recruiter/welcome'
                elif role == 'institutional':
                    redirect = '/institutional/welcome'
                else:
                    redirect = '/'
                try:
                    log_event(app, username, role, 'login')
                except Exception:
                    app.logger.exception('Failed to record login event')
                return JSONResponse({'ok': True, 'redirect': redirect, 'role': role, 'username': username})

            # Use general verifier across role collections
            try:
                res = verify_user_credentials(app, username, password)
                if res:
                    role, user = res
                    try:
                        log_event(app, username, role, 'login')
                    except Exception:
                        app.logger.exception('Failed to record login event')
                    if role in ('admin', 'faculty'):
                        redirect = '/admin/welcome'
                    elif role == 'student':
                        redirect = '/student/welcome'
                    elif role == 'recruiter':
                        redirect = '/recruiter/welcome'
                    elif role == 'institutional':
                        redirect = '/institutional/welcome'
                    else:
                        redirect = '/'
                    return JSONResponse({'ok': True, 'role': role, 'redirect': redirect, 'username': username}, status_code=200)
            except Exception:
                app.logger.exception('DB auth failure')

        except Exception:
            app.logger.exception('DB auth check failed')

    # Fallback to env credentials for admin
    env_user = os.environ.get('ADMIN_USERNAME') or os.environ.get('ADMIN_USER') or os.environ.get('ADMIN')
    env_pass = os.environ.get('ADMIN_PASSWORD') or os.environ.get('ADMIN_PASS') or os.environ.get('ADMIN_PASSWORD')
    if env_user:
        env_user = env_user.strip()
    if env_pass:
        env_pass = env_pass.strip()

    if env_user and env_pass and username == env_user and password == env_pass:
        try:
            log_event(app, username, 'admin', 'login')
        except Exception:
            app.logger.exception('Failed to record login event')
        return JSONResponse({'ok': True, 'redirect': '/admin/welcome', 'role': 'admin', 'username': username})

    # Try faculty accounts (DB or in-memory)
    try:
        if verify_faculty_credentials(app, username, password):
            try:
                log_event(app, username, 'faculty', 'login')
            except Exception:
                app.logger.exception('Failed to record login event')
            return JSONResponse({'ok': True, 'redirect': '/admin/welcome', 'role': 'faculty', 'username': username})
    except Exception:
        app.logger.exception('Faculty auth check failed')

    return JSONResponse({'ok': False, 'message': 'Invalid credentials'}, status_code=401)


@router.post('/api/auth/logout')
async def logout(request: Request) -> JSONResponse:
    data = await _get_data(request)
    username = data.get('username')
    role = data.get('role', 'unknown')
    app = request.app
    if username:
        try:
            log_event(app, username, role, 'logout')
        except Exception:
            app.logger.exception('Failed to record logout event')
    return JSONResponse({'ok': True, 'message': 'logged out'})



@router.post('/api/auth/signup')
async def signup(request: Request) -> JSONResponse:
    """Signup has been disabled on this deployment."""
    return JSONResponse({'ok': False, 'message': 'signup is disabled'}, status_code=403)


@router.post('/api/auth/signup/init')
async def signup_init(request: Request) -> JSONResponse:
    """Signup has been disabled on this deployment."""
    return JSONResponse({'ok': False, 'message': 'signup is disabled'}, status_code=403)


@router.post('/api/auth/signup/verify')
async def signup_verify(request: Request) -> JSONResponse:
    """Signup has been disabled on this deployment."""
    return JSONResponse({'ok': False, 'message': 'signup is disabled'}, status_code=403)


@router.post('/api/auth/signup/resend')
async def signup_resend(request: Request) -> JSONResponse:
    """Signup has been disabled on this deployment."""
    return JSONResponse({'ok': False, 'message': 'signup is disabled'}, status_code=403)


@router.post('/api/auth/password-reset/init')
async def password_reset_init(request: Request) -> JSONResponse:
    """Start password reset by sending a 4-digit OTP to the user's email.

    Expects: { username, email }
    """
    data = await _get_data(request)
    username = data.get('username')
    email = data.get('email')

    if not username or not email:
        return JSONResponse({'ok': False, 'message': 'username and email required'}, status_code=400)

    # locate user across role collections or in-memory store
    app = request.app
    client = getattr(app, 'mongo_client', None)
    user_doc = None
    stored_email = None
    role = None

    if client is not None:
        db = client.get_database('gradedgedev')
        for r, colname in COLLECTION_MAP.items():
            col = db.get_collection(colname)
            doc = col.find_one({'username': username})
            if doc:
                user_doc = doc
                stored_email = (doc.get('email') or '').strip().lower() if doc.get('email') else None
                role = r
                break
    else:
        store = _ensure_store(app)
        for r, bucket in store.items():
            doc = bucket.get(username)
            if doc:
                user_doc = doc
                stored_email = (doc.get('email') or '').strip().lower() if doc.get('email') else None
                role = r
                break

    if not user_doc:
        return JSONResponse({'ok': False, 'message': 'user not found'}, status_code=404)

    email_normalized = email.strip().lower()
    if stored_email and stored_email != email_normalized:
        return JSONResponse({'ok': False, 'message': 'email does not match our records'}, status_code=400)

    # generate 4-digit OTP (valid for 2 minutes)
    otp = str(random.randint(1000, 9999))
    otp_store = _ensure_otp_store(app)
    key = f'reset:{username}:{email_normalized}'
    expires = datetime.utcnow() + timedelta(minutes=2)
    otp_store[key] = {'otp': otp, 'expires': expires, 'username': username, 'role': role, 'email': email_normalized}

    try:
        if send_otp_email is None:
            app.logger.warning('send_otp_email not configured for password reset; OTP=%s', otp)
        else:
            send_otp_email(email, otp)
    except Exception:
        app.logger.exception('Failed to send password reset OTP email; using logged OTP for dev')
        debug = os.environ.get('OTP_DEBUG', 'false').lower() in ('1', 'true', 'yes')
        payload = {
            'ok': True,
            'message': 'Password reset OTP generated; email send failed (check server logs for code)',
        }
        if debug:
            payload['otp'] = otp
        return JSONResponse(payload, status_code=200)

    debug = os.environ.get('OTP_DEBUG', 'false').lower() in ('1', 'true', 'yes')
    payload = {'ok': True, 'message': 'Password reset OTP sent to email'}
    if debug:
        payload['otp'] = otp
    return JSONResponse(payload, status_code=200)


@router.post('/api/auth/password-reset/verify')
async def password_reset_verify(request: Request) -> JSONResponse:
    """Verify OTP and update the user's password.

    Expects: { username, email, otp, new_password }
    """
    data = await _get_data(request)
    username = data.get('username')
    email = data.get('email')
    otp = str(data.get('otp') or '')
    new_password = data.get('new_password')

    if not username or not email or not otp or not new_password:
        return JSONResponse({'ok': False, 'message': 'username, email, otp and new_password required'}, status_code=400)

    app = request.app
    otp_store = _ensure_otp_store(app)
    key = f'reset:{username}:{email.strip().lower()}'
    entry = otp_store.get(key)
    if not entry:
        return JSONResponse({'ok': False, 'message': 'no pending password reset for this user/email'}, status_code=400)
    if entry.get('expires') < datetime.utcnow():
        otp_store.pop(key, None)
        return JSONResponse({'ok': False, 'message': 'otp expired'}, status_code=400)
    if entry.get('otp') != otp:
        return JSONResponse({'ok': False, 'message': 'invalid otp'}, status_code=400)

    try:
        role = reset_user_password(app, username, new_password)
        try:
            log_event(app, username, role, 'password_reset')
        except Exception:
            app.logger.exception('Failed to record password reset event')
        otp_store.pop(key, None)
        return JSONResponse({'ok': True, 'message': 'password updated successfully'}, status_code=200)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'message': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Password reset verify failed: %s', exc)
        return JSONResponse({'ok': False, 'message': 'internal error'}, status_code=500)


@router.post('/api/auth/password-reset/resend')
async def password_reset_resend(request: Request) -> JSONResponse:
    """Regenerate and resend OTP for a pending password reset.

    Expects: { username, email }
    """
    data = await _get_data(request)
    username = data.get('username')
    email = data.get('email')

    if not username or not email:
        return JSONResponse({'ok': False, 'message': 'username and email required'}, status_code=400)

    app = request.app
    otp_store = _ensure_otp_store(app)
    key = f'reset:{username}:{email.strip().lower()}'
    entry = otp_store.get(key)
    if not entry:
        return JSONResponse({'ok': False, 'message': 'no pending password reset for this user/email'}, status_code=400)

    # Generate new OTP and extend expiry (2 minutes)
    otp = str(random.randint(1000, 9999))
    expires = datetime.utcnow() + timedelta(minutes=2)
    entry['otp'] = otp
    entry['expires'] = expires
    otp_store[key] = entry

    try:
        if send_otp_email is None:
            app.logger.warning('send_otp_email not configured (password reset resend); OTP=%s', otp)
        else:
            send_otp_email(email, otp)
    except Exception:
        app.logger.exception('Failed to resend password reset OTP email; using logged OTP for dev')
        debug = os.environ.get('OTP_DEBUG', 'false').lower() in ('1', 'true', 'yes')
        payload = {
            'ok': True,
            'message': 'Password reset OTP regenerated; email resend failed (check server logs for code)',
        }
        if debug:
            payload['otp'] = otp
        return JSONResponse(payload, status_code=200)

    debug = os.environ.get('OTP_DEBUG', 'false').lower() in ('1', 'true', 'yes')
    payload = {'ok': True, 'message': 'Password reset OTP resent to email'}
    if debug:
        payload['otp'] = otp
    return JSONResponse(payload, status_code=200)
