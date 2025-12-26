from typing import Optional, Dict, Any, Iterable
from werkzeug.security import generate_password_hash, check_password_hash

COLLECTION = 'faculty'

# In-memory fallback store for development when MongoDB isn't configured
_FACULTY_STORE: Dict[str, Dict[str, Any]] = {}


def _use_db(app):
    return getattr(app, 'mongo_client', None) is not None


def _generate_faculty_id(app, institutional_id: str) -> str:
    """Generate the next faculty_id using the institutional_id as prefix.

    Pattern: <institutional_id>-<n>, where n increments from 1 based on existing records.
    """
    prefix = f"{institutional_id}-"

    def _extract_suffix(fid: str) -> int:
        try:
            return int(fid.split('-')[-1])
        except Exception:
            return 0

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        existing: Iterable[str] = [doc.get('faculty_id', '') for doc in coll.find({'faculty_id': {'$regex': f'^{prefix}'}}, {'faculty_id': 1, '_id': 0})]
    else:
        existing = [doc.get('faculty_id', '') for doc in _FACULTY_STORE.values()]

    max_suffix = max((_extract_suffix(fid) for fid in existing if str(fid).startswith(prefix)), default=0)
    return f"{prefix}{max_suffix + 1}"


def create_faculty_for_institution(app, institutional_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Create a faculty user and auto-assign faculty_id prefixed with institutional_id.

    Ensures the resulting faculty_id starts with the institutional_id and increments a numeric suffix.
    """
    username = payload.get('username')
    password = payload.get('password')
    if not username or not password:
        raise ValueError('username and password required')
    if not institutional_id:
        raise ValueError('institutional_id required')

    requested_faculty_id = payload.get('faculty_id')
    if requested_faculty_id and not str(requested_faculty_id).startswith(f"{institutional_id}-"):
        raise ValueError('faculty_id must start with institutional_id prefix')

    faculty_id = requested_faculty_id or _generate_faculty_id(app, institutional_id)
    adjusted_payload = payload.copy()
    adjusted_payload['faculty_id'] = faculty_id
    adjusted_payload['institutional_id'] = institutional_id

    return create_faculty(app, adjusted_payload)


def create_faculty(app, payload: Dict[str, Any]) -> Dict[str, Any]:
    username = payload.get('username')
    password = payload.get('password')
    if not username or not password:
        raise ValueError('username and password required')

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        existing = coll.find_one({'username': username})
        if existing:
            raise ValueError('username already exists')

        faculty_id = payload.get('faculty_id')
        if faculty_id:
            existing_faculty_id = coll.find_one({'faculty_id': faculty_id})
            if existing_faculty_id:
                raise ValueError('faculty_id already exists')

        doc = payload.copy()
        doc['password'] = generate_password_hash(password)
        res = coll.insert_one(doc)
        doc.pop('password', None)
        doc['_id'] = str(res.inserted_id)
        return doc

    # In-memory fallback
    if username in _FACULTY_STORE:
        raise ValueError('username already exists')
    faculty_id = payload.get('faculty_id')
    if faculty_id:
        if any(doc.get('faculty_id') == faculty_id for doc in _FACULTY_STORE.values()):
            raise ValueError('faculty_id already exists')
    doc = payload.copy()
    doc['password'] = generate_password_hash(password)
    _FACULTY_STORE[username] = {k: v for k, v in doc.items() if k != '_id'}
    ret = _FACULTY_STORE[username].copy()
    ret.pop('password', None)
    return ret


def list_faculty(app) -> list:
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        docs = list(coll.find({}, {'_id': 0, 'password': 0}))
        return docs

    return [ {k: v for k, v in data.items() if k != 'password'} for data in _FACULTY_STORE.values() ]


def list_faculty_by_institution(app, institutional_id: str) -> list:
    if not institutional_id:
        raise ValueError('institutional_id required')

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        docs = list(coll.find({'institutional_id': institutional_id}, {'_id': 0, 'password': 0}))
        return docs

    return [
        {k: v for k, v in data.items() if k != 'password'}
        for data in _FACULTY_STORE.values()
        if data.get('institutional_id') == institutional_id
    ]


def get_faculty(app, username: str) -> Optional[Dict[str, Any]]:
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        doc = coll.find_one({'username': username}, {'_id': 0, 'password': 0})
        return doc

    data = _FACULTY_STORE.get(username)
    if not data:
        return None
    return {k: v for k, v in data.items() if k != 'password'}


def get_faculty_for_institution(app, institutional_id: str, username: str) -> Optional[Dict[str, Any]]:
    if not institutional_id:
        raise ValueError('institutional_id required')
    doc = get_faculty(app, username)
    if doc and doc.get('institutional_id') == institutional_id:
        return doc
    return None


def update_faculty(app, username: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    # Prevent empty payloads
    update_doc = payload.copy()
    if 'password' in update_doc and update_doc['password']:
        update_doc['password'] = generate_password_hash(update_doc['password'])
    else:
        update_doc.pop('password', None)

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        # username change check
        if 'username' in update_doc and update_doc['username'] != username:
            if coll.find_one({'username': update_doc['username']}):
                raise ValueError('target username already exists')
        coll.update_one({'username': username}, {'$set': update_doc})
        doc = coll.find_one({'username': update_doc.get('username', username)}, {'_id': 0, 'password': 0})
        return doc

    # In-memory fallback
    target = _FACULTY_STORE.get(username)
    if not target:
        raise ValueError('not found')
    # username change
    new_username = update_doc.get('username', username)
    if new_username != username and new_username in _FACULTY_STORE:
        raise ValueError('target username already exists')

    # apply updates
    for k, v in update_doc.items():
        if k == 'password':
            target['password'] = v
        else:
            target[k] = v

    # if username changed, move entry
    if new_username != username:
        _FACULTY_STORE[new_username] = target
        del _FACULTY_STORE[username]

    ret = {k: v for k, v in _FACULTY_STORE.get(new_username, target).items() if k != 'password'}
    return ret


def update_faculty_for_institution(app, institutional_id: str, username: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    if not institutional_id:
        raise ValueError('institutional_id required')

    # Fetch first to validate ownership
    existing = get_faculty(app, username)
    if not existing or existing.get('institutional_id') != institutional_id:
        raise ValueError('faculty not found for this institution')

    # Enforce prefix rules if faculty_id is being changed
    faculty_id = payload.get('faculty_id')
    if faculty_id is not None:
        if not str(faculty_id).startswith(f"{institutional_id}-"):
            raise ValueError('faculty_id must start with institutional_id prefix')

    return update_faculty(app, username, payload)


def delete_faculty(app, username: str) -> bool:
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        res = coll.delete_one({'username': username})
        return res.deleted_count > 0

    if username in _FACULTY_STORE:
        del _FACULTY_STORE[username]
        return True
    return False


def delete_faculty_for_institution(app, institutional_id: str, username: str) -> bool:
    if not institutional_id:
        raise ValueError('institutional_id required')

    existing = get_faculty(app, username)
    if not existing or existing.get('institutional_id') != institutional_id:
        return False

    return delete_faculty(app, username)


def verify_faculty_credentials(app, username: str, password: str) -> bool:
    """Return True if username/password match a faculty account (DB or in-memory)."""
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        doc = coll.find_one({'username': username})
        if not doc or 'password' not in doc:
            return False
        return check_password_hash(doc['password'], password)

    # in-memory
    data = _FACULTY_STORE.get(username)
    if not data or 'password' not in data:
        return False
    return check_password_hash(data['password'], password)
