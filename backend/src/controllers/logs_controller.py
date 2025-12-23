from datetime import datetime
import logging
from typing import List, Dict, Any


def log_event(app, username: str, role: str, action: str, extra: Dict[str, Any] | None = None):
    """Record an auth event (login/logout) to MongoDB if available, else keep in-memory.

    Stored document fields: username, role, action, ts (ISO), extra(optional)
    """
    try:
        entry = {
            'username': username,
            'role': role,
            'action': action,
            'ts': datetime.utcnow(),
        }
        if extra:
            entry['extra'] = extra

        client = getattr(app, 'mongo_client', None)
        if client is not None:
            db = client.get_database('gradedgedev')
            logs = db.get_collection('auth_logs')
            # ensure ts stored as datetime for queries
            logs.insert_one(entry)
            return True

        # in-memory fallback - stored on the app object
        store = getattr(app, '_auth_log_store', None)
        if store is None:
            store = []
            setattr(app, '_auth_log_store', store)
        # store a serializable representation
        store.append({'username': username, 'role': role, 'action': action, 'ts': entry['ts'].isoformat(), 'extra': extra})
        return True
    except Exception:
        logging.exception('Failed to log auth event')
        return False


def get_logs(app, limit: int = 200) -> List[Dict[str, Any]]:
    """Retrieve recent auth logs. Returns list of dicts.

    If Mongo is available, fetch from `auth_logs` sorted by ts desc.
    Otherwise, return the in-memory store (most recent first).
    """
    client = getattr(app, 'mongo_client', None)
    if client is not None:
        db = client.get_database('gradedgedev')
        logs = db.get_collection('auth_logs')
        docs = list(logs.find({}, {'_id': 0}).sort('ts', -1).limit(limit))
        # convert datetimes to isoformat
        for d in docs:
            if isinstance(d.get('ts'), datetime):
                d['ts'] = d['ts'].isoformat()
        return docs

    store = getattr(app, '_auth_log_store', []) or []
    # return reversed (most recent first)
    return list(reversed(store))[:limit]
