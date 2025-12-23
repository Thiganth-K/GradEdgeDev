import os
from werkzeug.security import generate_password_hash
from flask import current_app


def ensure_admin(app, username: str | None = None, password: str | None = None):
    """Ensure an admin user exists in the database. If Mongo not available, do nothing."""
    username = username or os.environ.get('ADMIN_USERNAME') or os.environ.get('ADMIN_USER') or 'thiganth'
    password = password or os.environ.get('ADMIN_PASSWORD') or os.environ.get('ADMIN_PASS') or 'thiganth'

    client = getattr(app, 'mongo_client', None)
    if client is None:
        app.logger.warning('No MongoDB client available; skipping admin creation')
        return

    db = client.get_database('gradedgedev')
    admins = db.get_collection('admins')

    existing = admins.find_one({'username': username})
    hashed = generate_password_hash(password)

    if existing:
        # update password hash if it differs
        if existing.get('password') != hashed:
            admins.update_one({'_id': existing['_id']}, {'$set': {'password': hashed}})
        return

    admins.insert_one({'username': username, 'password': hashed, 'role': 'admin'})


def get_admin_info(app):
    client = getattr(app, 'mongo_client', None)
    if client is None:
        return None
    admins = client.get_database('gradedgedev').get_collection('admins')
    doc = admins.find_one({}, {'_id': 0, 'username': 1})
    return doc
