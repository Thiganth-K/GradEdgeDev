from flask import Blueprint, jsonify, current_app, request
from src.controllers.logs_controller import get_logs

logs_bp = Blueprint('logs_bp', __name__)


@logs_bp.route('/api/admin/logs', methods=['GET'])
def list_logs():
    # For now, this endpoint returns recent auth logs. It's intended for admin UIs.
    # Note: no robust server-side auth is enforced here; caller should ensure only admin calls it.
    try:
        limit = int(request.args.get('limit', '200'))
    except Exception:
        limit = 200
    docs = get_logs(current_app, limit=limit)
    return jsonify({'ok': True, 'logs': docs})
