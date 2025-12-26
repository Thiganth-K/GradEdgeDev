from typing import Optional, Dict, Any

from werkzeug.security import generate_password_hash, check_password_hash

COLLECTION = 'institutionals'

# In-memory fallback store for development when MongoDB isn't configured
_INSTITUTIONAL_STORE: Dict[str, Dict[str, Any]] = {}


def _use_db(app) -> bool:
    return getattr(app, 'mongo_client', None) is not None


def create_institutional(app, payload: Dict[str, Any]) -> Dict[str, Any]:
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

        doc = payload.copy()
        doc['password'] = generate_password_hash(password)
        res = coll.insert_one(doc)
        # Build a JSON-serializable copy without password and with string _id
        doc_copy: Dict[str, Any] = {k: v for k, v in doc.items() if k != 'password'}
        doc_copy['_id'] = str(res.inserted_id)
        return doc_copy

    # In-memory fallback
    if username in _INSTITUTIONAL_STORE:
        raise ValueError('username already exists')
    doc = payload.copy()
    doc['password'] = generate_password_hash(password)
    _INSTITUTIONAL_STORE[username] = {k: v for k, v in doc.items() if k != '_id'}
    ret = _INSTITUTIONAL_STORE[username].copy()
    ret.pop('password', None)
    return ret


def list_institutional(app) -> list:
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        docs = list(coll.find({}, {'_id': 0, 'password': 0}))
        return docs

    return [{k: v for k, v in data.items() if k != 'password'} for data in _INSTITUTIONAL_STORE.values()]


def get_institutional(app, username: str) -> Optional[Dict[str, Any]]:
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        doc = coll.find_one({'username': username}, {'_id': 0, 'password': 0})
        return doc

    data = _INSTITUTIONAL_STORE.get(username)
    if not data:
        return None
    return {k: v for k, v in data.items() if k != 'password'}


def update_institutional(app, username: str, payload: Dict[str, Any]) -> Dict[str, Any]:
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

    target = _INSTITUTIONAL_STORE.get(username)
    if not target:
        raise ValueError('not found')

    new_username = update_doc.get('username', username)
    if new_username != username and new_username in _INSTITUTIONAL_STORE:
        raise ValueError('target username already exists')

    for k, v in update_doc.items():
        if k == 'password':
            target['password'] = v
        else:
            target[k] = v

    if new_username != username:
        _INSTITUTIONAL_STORE[new_username] = target
        del _INSTITUTIONAL_STORE[username]

    ret = {k: v for k, v in _INSTITUTIONAL_STORE.get(new_username, target).items() if k != 'password'}
    return ret


def delete_institutional(app, username: str) -> bool:
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        res = coll.delete_one({'username': username})
        return res.deleted_count > 0

    if username in _INSTITUTIONAL_STORE:
        del _INSTITUTIONAL_STORE[username]
        return True
    return False


def verify_institutional_credentials(app, username: str, password: str) -> bool:
    """Return True if username/password match an institutional account (DB or in-memory)."""
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        doc = coll.find_one({'username': username})
        if not doc or 'password' not in doc:
            return False
        return check_password_hash(doc['password'], password)

    data = _INSTITUTIONAL_STORE.get(username)
    if not data or 'password' not in data:
        return False
    return check_password_hash(data['password'], password)
