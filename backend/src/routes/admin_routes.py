from flask import Blueprint, jsonify, current_app

from src.controllers.admin_controller import get_admin_info

admin_bp = Blueprint('admin_bp', __name__)


@admin_bp.route('/api/admin/me', methods=['GET'])
def admin_me():
    try:
        info = get_admin_info(current_app)
        if info and 'username' in info:
            username = info['username']
        else:
            import os
            username = os.environ.get('ADMIN_USERNAME') or os.environ.get('ADMIN_USER') or 'thiganth'

        return jsonify({'username': username, 'greeting': f'Welcome, {username}!'}), 200
    except Exception as exc:
        current_app.logger.exception('Failed to get admin info: %s', exc)
        return jsonify({'error': 'failed to fetch admin info'}), 500
