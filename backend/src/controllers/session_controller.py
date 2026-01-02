from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid

COLLECTION = 'sessions'
_SESSION_STORE: Dict[str, Dict[str, Any]] = {}

def _use_db(app):
    return getattr(app, 'mongo_client', None) is not None

def create_session(app, payload: Dict[str, Any]) -> Dict[str, Any]:
    session_id = str(uuid.uuid4())
    payload['id'] = session_id
    
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        coll.insert_one(payload)
        payload.pop('_id', None)
        return payload

    _SESSION_STORE[session_id] = payload
    return payload

def list_sessions(app, faculty_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = {}
    if faculty_id:
        query['faculty_id'] = faculty_id

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        return list(coll.find(query, {'_id': 0}))

    if faculty_id:
        return [s for s in _SESSION_STORE.values() if s.get('faculty_id') == faculty_id]
    return list(_SESSION_STORE.values())
