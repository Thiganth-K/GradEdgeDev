from flask import Blueprint, request, jsonify, current_app
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import check_password_hash
import os
from src.controllers.faculty_controller import verify_faculty_credentials
from src.controllers.signup_controller import create_user, verify_user_credentials
from src.controllers.logs_controller import log_event


auth_bp = Blueprint('auth_bp', __name__)


@auth_bp.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or request.form or {}
    username = data.get('username') or data.get('name')
    password = data.get('password')

    if not username or not password:
        return jsonify({'ok': False, 'message': 'username and password required'}), 400

    client = getattr(current_app, 'mongo_client', None)
    # Try DB-auth if available
    if client is not None:
        try:
            db = client.get_database('gradedgedev')
            # Check `users` collection first
            users_coll = db.get_collection('users')
            user_doc = users_coll.find_one({'username': username})
            if user_doc and 'password' in user_doc and check_password_hash(user_doc['password'], password):
                role = user_doc.get('role', 'student')
                redirect = '/admin/welcome' if role in ('admin', 'faculty') else '/'
                try:
                    log_event(current_app, username, role, 'login')
                except Exception:
                    current_app.logger.exception('Failed to record login event')
                return jsonify({'ok': True, 'redirect': redirect, 'role': role, 'username': username})

            # Use general verifier across role collections
            try:
                res = verify_user_credentials(current_app, username, password)
                if res:
                    role, user = res
                    try:
                        log_event(current_app, username, role, 'login')
                    except Exception:
                        current_app.logger.exception('Failed to record login event')
                    redirect = '/admin/welcome' if role in ('admin', 'faculty') else '/'
                    return jsonify({'ok': True, 'role': role, 'redirect': redirect, 'username': username}), 200
            except Exception:
                current_app.logger.exception('DB auth failure')

        except Exception:
            current_app.logger.exception('DB auth check failed')

    # Fallback to env credentials for admin
    env_user = os.environ.get('ADMIN_USERNAME') or os.environ.get('ADMIN_USER') or os.environ.get('ADMIN')
    env_pass = os.environ.get('ADMIN_PASSWORD') or os.environ.get('ADMIN_PASS') or os.environ.get('ADMIN_PASSWORD')
    if env_user:
        env_user = env_user.strip()
    if env_pass:
        env_pass = env_pass.strip()

    if env_user and env_pass and username == env_user and password == env_pass:
        try:
            log_event(current_app, username, 'admin', 'login')
        except Exception:
            current_app.logger.exception('Failed to record login event')
        return jsonify({'ok': True, 'redirect': '/admin/welcome', 'role': 'admin', 'username': username})

    # Try faculty accounts (DB or in-memory)
    try:
        if verify_faculty_credentials(current_app, username, password):
            try:
                log_event(current_app, username, 'faculty', 'login')
            except Exception:
                current_app.logger.exception('Failed to record login event')
            return jsonify({'ok': True, 'redirect': '/admin/welcome', 'role': 'faculty', 'username': username})
    except Exception:
        current_app.logger.exception('Faculty auth check failed')

    return jsonify({'ok': False, 'message': 'Invalid credentials'}), 401



@auth_bp.route('/api/auth/logout', methods=['POST'])
def logout():
    data = request.get_json(silent=True) or request.form or {}
    username = data.get('username')
    role = data.get('role', 'unknown')
    if username:
        try:
            log_event(current_app, username, role, 'logout')
        except Exception:
            current_app.logger.exception('Failed to record logout event')
    return jsonify({'ok': True, 'message': 'logged out'})



@auth_bp.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json(silent=True) or request.form or {}
    username = data.get('username')
    password = data.get('password')
    role = (data.get('role') or 'student').lower()

    if not username or not password:
        return jsonify({'ok': False, 'message': 'username and password required'}), 400

    try:
        user = create_user(current_app, data)
        try:
            log_event(current_app, username, role, 'signup')
        except Exception:
            current_app.logger.exception('Failed to record signup event')
        return jsonify({'ok': True, 'user': user}), 200
    except ValueError as ve:
        return jsonify({'ok': False, 'message': str(ve)}), 400
    except Exception as exc:
        current_app.logger.exception('Signup failed: %s', exc)
        return jsonify({'ok': False, 'message': 'internal error'}), 500
