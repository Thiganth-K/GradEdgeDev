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
            logging.info('No mongo client available; seeding in-memory users')
            try:
                from src.controllers.signup_controller import _ensure_store, COLLECTION_MAP
                store = _ensure_store(app)
                for key, meta in DEFAULT_USERS.items():
                    username = meta['username']
                    role = meta['role']
                    pwd = meta['password']
                    hashed = generate_password_hash(pwd)
                    
                    if role in COLLECTION_MAP:
                        # Create doc similar to what create_user does, but with our defaults
                        doc = {
                            'username': username,
                            'password': hashed,
                            'role': role,
                            **{k: v for k, v in meta.items() if k not in ('username', 'role', 'password')}
                        }
                        if role == 'student':
                            doc.setdefault('full_name', 'Student One')
                        elif role == 'faculty':
                            doc.setdefault('full_name', 'Faculty One')
                        
                        store[role][username] = doc
                        
                logging.info('Default users seeded (in-memory)')
            except Exception as e:
                logging.warning('Failed to seed in-memory users: %s', e)
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
