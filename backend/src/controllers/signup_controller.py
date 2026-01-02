from typing import Dict, Any, Optional, Tuple
from werkzeug.security import generate_password_hash, check_password_hash


COLLECTION_MAP = {
    'admin': 'admins',
    'faculty': 'faculty',
    'student': 'students',
    'recruiter': 'recruiters',
    'institutional': 'institutionals',
}


def _ensure_store(app):
    store = getattr(app, '_user_store', None)
    if store is None:
        store = {k: {} for k in COLLECTION_MAP.keys()}
        setattr(app, '_user_store', store)
    return store


def create_user(app, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create a user document in MongoDB (if available) or in-memory fallback.

    Expects payload to contain: username, password, role and optional role-specific fields.
    Returns the created document (without password field).
    """
    username = payload.get('username')
    password = payload.get('password')
    role = (payload.get('role') or 'student').lower()

    if not username or not password:
        raise ValueError('username and password required')

    if role not in COLLECTION_MAP:
        raise ValueError('invalid role')

    hashed = generate_password_hash(password)

    doc: Dict[str, Any] = {'username': username, 'password': hashed, 'role': role}

    # store common contact fields when provided
    if payload.get('email'):
        doc['email'] = payload.get('email')
    if payload.get('mobile'):
        doc['mobile'] = payload.get('mobile')

    # attach role-specific fields
    if role == 'student' or role == 'faculty':
        if payload.get('full_name'):
            doc['full_name'] = payload.get('full_name')
        if role == 'student' and payload.get('enrollment_id'):
            doc['enrollment_id'] = payload.get('enrollment_id')
        if role == 'faculty' and payload.get('faculty_id'):
            doc['faculty_id'] = payload.get('faculty_id')
        if payload.get('department'):
            doc['department'] = payload.get('department')

    if role == 'recruiter':
        doc['first_name'] = payload.get('first_name')
        doc['last_name'] = payload.get('last_name')

    if role == 'institutional':
        # Minimal institutional metadata; can be extended later
        if payload.get('institutional_id'):
            doc['institutional_id'] = payload.get('institutional_id')
        if payload.get('institution_name'):
            doc['institution_name'] = payload.get('institution_name')

    client = getattr(app, 'mongo_client', None)
    if client is not None:
        db = client.get_database('gradedgedev')
        col = db.get_collection(COLLECTION_MAP[role])
        existing = col.find_one({'username': username})
        if existing:
            raise ValueError('username already exists')
        res = col.insert_one(doc)
        # remove password before returning
        doc_copy = dict(doc)
        doc_copy.pop('password', None)
        doc_copy['_id'] = str(res.inserted_id)
        return doc_copy

    # fallback in-memory
    store = _ensure_store(app)
    bucket = store.get(role)
    if username in bucket:
        raise ValueError('username already exists')
    bucket[username] = doc
    doc_copy = dict(doc)
    doc_copy.pop('password', None)
    return doc_copy


def verify_user_credentials(app, username: str, password: str) -> Optional[Tuple[str, Dict[str, Any]]]:
    """Verify credentials across all role collections.

    Returns (role, user_doc_without_password) on success, else None.
    """
    client = getattr(app, 'mongo_client', None)
    if client is not None:
        db = client.get_database('gradedgedev')
        for role, colname in COLLECTION_MAP.items():
            col = db.get_collection(colname)
            user = col.find_one({'username': username})
            if user:
                pw_hash = user.get('password')
                if pw_hash and check_password_hash(pw_hash, password):
                    user_copy = dict(user)
                    user_copy.pop('password', None)
                    user_copy['role'] = role
                    user_copy['_id'] = str(user_copy.get('_id'))
                    return role, user_copy
                return None
        return None

    # fallback in-memory
    store = _ensure_store(app)
    for role, bucket in store.items():
        user = bucket.get(username)
        if user:
            if check_password_hash(user.get('password', ''), password):
                u = dict(user)
                u.pop('password', None)
                u['role'] = role
                return role, u
            return None

    return None


def reset_user_password(app, username: str, new_password: str) -> str:
    """Reset a user's password across all role collections or in-memory store.

    Returns the role whose password was updated. Raises ValueError if the
    user does not exist.
    """
    if not username or not new_password:
        raise ValueError('username and new password required')

    hashed = generate_password_hash(new_password)

    client = getattr(app, 'mongo_client', None)
    role_found: Optional[str] = None

    if client is not None:
        db = client.get_database('gradedgedev')
        for role, colname in COLLECTION_MAP.items():
            col = db.get_collection(colname)
            res = col.update_one({'username': username}, {'$set': {'password': hashed}})
            if res.matched_count:
                role_found = role
                break

    if role_found is None:
        store = _ensure_store(app)
        for role, bucket in store.items():
            user = bucket.get(username)
            if user:
                user['password'] = hashed
                role_found = role
                break

    if role_found is None:
        raise ValueError('user not found')

    return role_found

