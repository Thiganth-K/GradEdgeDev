from typing import Dict, Any, List, Optional
from models.batch import Batch

COLLECTION = 'batches'
# In-memory store
_BATCH_STORE: Dict[str, Dict[str, Any]] = {}

def _use_db(app):
    return getattr(app, 'mongo_client', None) is not None

def create_batch(app, payload: Dict[str, Any]) -> Dict[str, Any]:
    batch_code = payload.get('batch_code')
    if not batch_code:
        raise ValueError('batch_code required')

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        if coll.find_one({'batch_code': batch_code}):
            raise ValueError('batch_code already exists')
        coll.insert_one(payload)
        return payload

    if batch_code in _BATCH_STORE:
        raise ValueError('batch_code already exists')
    _BATCH_STORE[batch_code] = payload
    return payload

def list_batches(app, faculty_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query = {}
    if faculty_id:
        query['faculty_id'] = faculty_id

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        return list(coll.find(query, {'_id': 0}))

    if faculty_id:
        return [b for b in _BATCH_STORE.values() if b.get('faculty_id') == faculty_id]
    return list(_BATCH_STORE.values())

def get_batch(app, batch_code: str) -> Optional[Dict[str, Any]]:
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        return coll.find_one({'batch_code': batch_code}, {'_id': 0})
    return _BATCH_STORE.get(batch_code)

def add_students_to_batch(app, batch_code: str, student_ids: List[str]) -> Dict[str, Any]:
    # Logic to add students to batch "students" list
    # For now assuming simple update
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        coll.update_one(
            {'batch_code': batch_code},
            {'$addToSet': {'students': {'$each': student_ids}}}
        )
        return get_batch(app, batch_code)

    if batch_code in _BATCH_STORE:
        current = set(_BATCH_STORE[batch_code].get('students', []))
        current.update(student_ids)
        _BATCH_STORE[batch_code]['students'] = list(current)
        return _BATCH_STORE[batch_code]
    raise ValueError('Batch not found')
