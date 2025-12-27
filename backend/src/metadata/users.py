from werkzeug.security import generate_password_hash
from typing import Dict
import logging

# Default metadata for role-based users.
# Passwords here are plaintext for clarity but are hashed before inserting into DB.
DEFAULT_USERS: Dict[str, Dict] = {
    'admin': {'username': 'admin', 'role': 'admin', 'password': 'adminpass'},
    'faculty1': {'username': 'faculty1', 'role': 'faculty', 'password': 'facpass', 'faculty_id': 'FAC-001', 'institutional_id': 'INST-001'},
    'student1': {'username': 'student1', 'role': 'student', 'password': 'studpass', 'enrollment_id': 'STU-001', 'institutional_id': 'INST-001'},
    'recruiter1': {'username': 'recruiter1', 'role': 'recruiter', 'password': 'recpass'},
}


def seed_users(app):
    """Ensure default users exist in the `users` and role-specific collections when a MongoDB client is available.

    This function will hash the passwords and upsert users by `username`.
    If no DB client is available, it logs and returns.
    """
    try:
        client = getattr(app, 'mongo_client', None)
        if not client:
            logging.info('No mongo client available; skipping user seeding')
            return
        db = client.get_database('gradedgedev')
        users_coll = db.get_collection('users')
        faculty_coll = db.get_collection('faculty')
        students_coll = db.get_collection('students')

        for key, meta in DEFAULT_USERS.items():
            username = meta['username']
            role = meta['role']
            pwd = meta['password']
            hashed = generate_password_hash(pwd)
            
            # 1. Upsert into generic 'users' collection (for auth)
            users_coll.update_one(
                {'username': username},
                {'$setOnInsert': {'username': username, 'role': role, 'password': hashed}},
                upsert=True,
            )

            # 2. Upsert into specific profile collections
            if role == 'faculty':
                faculty_coll.update_one(
                    {'username': username},
                    {'$setOnInsert': {
                        'username': username, 
                        'password': hashed, 
                        'faculty_id': meta.get('faculty_id'),
                        'institutional_id': meta.get('institutional_id'),
                        'full_name': 'Faculty One'
                    }},
                    upsert=True
                )
            elif role == 'student':
                students_coll.update_one(
                    {'username': username},
                    {'$setOnInsert': {
                        'username': username, 
                        'password': hashed, 
                        'enrollment_id': meta.get('enrollment_id'),
                        'institutional_id': meta.get('institutional_id'),
                        'full_name': 'Student One'
                    }},
                    upsert=True
                )

        logging.info('Default users seeded (auth and profiles)')
    except Exception as exc:
        logging.exception('Failed to seed default users: %s', exc)
