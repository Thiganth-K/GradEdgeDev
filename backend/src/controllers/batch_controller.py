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

    # Normalize optional fields
    payload = payload.copy()
    if 'name' in payload and payload.get('name') is None:
        payload.pop('name')

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        if coll.find_one({'batch_code': batch_code}):
            raise ValueError('batch_code already exists')
        res = coll.insert_one(payload)
        doc = payload.copy()
        # Convert ObjectId to string for JSON safety
        if res.inserted_id:
            doc['_id'] = str(res.inserted_id)
        doc.pop('_id', None)
        return doc

    if batch_code in _BATCH_STORE:
        raise ValueError('batch_code already exists')
    _BATCH_STORE[batch_code] = payload
    return payload

def list_batches(app, faculty_id: Optional[str] = None, institutional_id: Optional[str] = None) -> List[Dict[str, Any]]:
    query: Dict[str, Any] = {}
    if faculty_id:
        query['faculty_id'] = faculty_id
    if institutional_id:
        query['institutional_id'] = institutional_id

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        return list(coll.find(query, {'_id': 0}))

    results = list(_BATCH_STORE.values())
    if query:
        def _match(doc: Dict[str, Any]) -> bool:
            for k, v in query.items():
                if doc.get(k) != v:
                    return False
            return True
        results = [b for b in results if _match(b)]
    return results

def get_batch(app, batch_code: str) -> Optional[Dict[str, Any]]:
    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        return coll.find_one({'batch_code': batch_code}, {'_id': 0})
    return _BATCH_STORE.get(batch_code)

def add_students_to_batch(app, batch_code: str, student_ids: List[str], *, institutional_id: Optional[str] = None, faculty_id: Optional[str] = None) -> Dict[str, Any]:
    """Attach the given students to the batch and mark the students with batch_id.

    Updates both the batch document (students list) and student documents (batch_id, faculty_id) when DB is available.
    """
    if not student_ids:
        raise ValueError('student_ids required')

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')

        # Update batch membership
        coll_batches = db.get_collection(COLLECTION)
        res = coll_batches.update_one(
            {'batch_code': batch_code},
            {'$addToSet': {'students': {'$each': student_ids}}}
        )
        if res.matched_count == 0:
            raise ValueError('Batch not found')

        # Update students with batch assignment (best-effort)
        if institutional_id:
            filter_spec: Dict[str, Any] = {'institutional_id': institutional_id, 'enrollment_id': {'$in': student_ids}}
        else:
            filter_spec = {'enrollment_id': {'$in': student_ids}}

        set_spec: Dict[str, Any] = {'batch_id': batch_code}
        if faculty_id:
            set_spec['faculty_id'] = faculty_id

        db.get_collection('students').update_many(filter_spec, {'$set': set_spec})

        return get_batch(app, batch_code) or {'batch_code': batch_code, 'students': student_ids}

    # In-memory fallback
    if batch_code in _BATCH_STORE:
        current = set(_BATCH_STORE[batch_code].get('students', []))
        current.update(student_ids)
        _BATCH_STORE[batch_code]['students'] = list(current)
        # Update in-memory students if present
        from src.controllers.student_controller import _STUDENT_STORE  # type: ignore
        for s in _STUDENT_STORE:
            if s.get('enrollment_id') in student_ids:
                s['batch_id'] = batch_code
                if faculty_id:
                    s['faculty_id'] = faculty_id
        return _BATCH_STORE[batch_code]

    raise ValueError('Batch not found')
