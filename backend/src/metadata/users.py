from werkzeug.security import generate_password_hash
from typing import Dict
import logging

# Default metadata for role-based users.
# Passwords here are plaintext for clarity but are hashed before inserting into DB.
DEFAULT_USERS: Dict[str, Dict] = {
    'admin': {'username': 'admin', 'role': 'admin', 'password': 'adminpass'},
    'faculty1': {'username': 'faculty1', 'role': 'faculty', 'password': 'facpass'},
    'student1': {'username': 'student1', 'role': 'student', 'password': 'studpass'},
    'recruiter1': {'username': 'recruiter1', 'role': 'recruiter', 'password': 'recpass'},
}


def seed_users(app):
    """Ensure default users exist in the `users` collection when a MongoDB client is available.

    This function will hash the passwords and upsert users by `username`.
    If no DB client is available, it logs and returns.
    """
    try:
        client = getattr(app, 'mongo_client', None)
        if not client:
            logging.info('No mongo client available; skipping user seeding')
            return
        db = client.get_database('gradedgedev')
        coll = db.get_collection('users')
        for key, meta in DEFAULT_USERS.items():
            username = meta['username']
            role = meta['role']
            pwd = meta['password']
            hashed = generate_password_hash(pwd)
            coll.update_one(
                {'username': username},
                {'$setOnInsert': {'username': username, 'role': role, 'password': hashed}},
                upsert=True,
            )
        logging.info('Default users seeded (if they did not already exist)')
    except Exception as exc:
        logging.exception('Failed to seed default users: %s', exc)
