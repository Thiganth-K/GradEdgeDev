from flask import Blueprint, request, jsonify, current_app
from src.controllers.faculty_controller import (
    create_faculty,
    list_faculty,
    get_faculty,
    update_faculty,
    delete_faculty,
)

faculty_bp = Blueprint('faculty_bp', __name__)


@faculty_bp.route('/api/faculty', methods=['GET'])
def faculty_list():
    try:
        docs = list_faculty(current_app)
        return jsonify({'ok': True, 'data': docs}), 200
    except Exception as exc:
        current_app.logger.exception('Failed to list faculty: %s', exc)
        return jsonify({'ok': False, 'error': str(exc)}), 500


@faculty_bp.route('/api/faculty', methods=['POST'])
def faculty_create():
    try:
        payload = request.get_json(silent=True) or {}
        doc = create_faculty(current_app, payload)
        return jsonify({'ok': True, 'data': doc}), 201
    except ValueError as ve:
        return jsonify({'ok': False, 'error': str(ve)}), 400
    except Exception as exc:
        current_app.logger.exception('Failed to create faculty: %s', exc)
        return jsonify({'ok': False, 'error': 'internal error'}), 500


@faculty_bp.route('/api/faculty/<username>', methods=['GET'])
def faculty_get(username):
    try:
        doc = get_faculty(current_app, username)
        if not doc:
            return jsonify({'ok': False, 'error': 'not found'}), 404
        return jsonify({'ok': True, 'data': doc}), 200
    except Exception as exc:
        current_app.logger.exception('Failed to get faculty: %s', exc)
        return jsonify({'ok': False, 'error': str(exc)}), 500


@faculty_bp.route('/api/faculty/<username>', methods=['PUT'])
def faculty_update(username):
    try:
        payload = request.get_json(silent=True) or {}
        doc = update_faculty(current_app, username, payload)
        return jsonify({'ok': True, 'data': doc}), 200
    except ValueError as ve:
        return jsonify({'ok': False, 'error': str(ve)}), 400
    except Exception as exc:
        current_app.logger.exception('Failed to update faculty: %s', exc)
        return jsonify({'ok': False, 'error': 'internal error'}), 500


@faculty_bp.route('/api/faculty/<username>', methods=['DELETE'])
def faculty_delete(username):
    try:
        ok = delete_faculty(current_app, username)
        if not ok:
            return jsonify({'ok': False, 'error': 'not found'}), 404
        return jsonify({'ok': True}), 200
    except Exception as exc:
        current_app.logger.exception('Failed to delete faculty: %s', exc)
        return jsonify({'ok': False, 'error': 'internal error'}), 500
