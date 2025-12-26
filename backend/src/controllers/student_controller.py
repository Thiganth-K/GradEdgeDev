from typing import Dict, Any, List, Iterable
import os
from pymongo import ReturnDocument
from werkzeug.security import generate_password_hash

try:
    from src.mail.mail import send_welcome_email
except Exception:
    send_welcome_email = None

try:
    from utils.db import connect_db
except Exception:
    connect_db = None

COLLECTION = 'students'

# In-memory fallback store when MongoDB is not configured
_STUDENT_STORE: List[Dict[str, Any]] = []


def _use_db(app) -> bool:
    return getattr(app, 'mongo_client', None) is not None


def _ensure_db(app):
    """Return a MongoDB database handle or raise if not connected."""
    client = getattr(app, 'mongo_client', None)
    if client is None and connect_db is not None:
        mongo_uri = os.environ.get('MONGODB_URI') or os.environ.get('MONGO_URI')
        if mongo_uri:
            try:
                client = connect_db(mongo_uri)
                app.mongo_client = client
            except Exception as exc:
                raise RuntimeError(f'database not connected: {exc}') from exc

    if client is None:
        raise RuntimeError('database not connected; set MONGODB_URI or MONGO_URI')

    db = client.get_database('gradedgedev')
    return db


def _parse_csv_rows(csv_text: str) -> List[List[str]]:
    rows: List[List[str]] = []
    for line in csv_text.splitlines():
        line = line.strip()
        if not line:
            continue
        parts = [p.strip() for p in line.split(',')]
        if len(parts) < 5:
            raise ValueError('each CSV line must have 5 columns: name,regno,dept,email,mobile')
        rows.append(parts[:5])
    return rows


def _normalize_rows(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    rows: Iterable[Any] | None = payload.get('rows')
    csv_text: str | None = payload.get('csv')

    parsed: List[List[str]] = []
    if csv_text:
        parsed = _parse_csv_rows(str(csv_text))
    elif isinstance(rows, list):
        for r in rows:
            if isinstance(r, dict):
                parsed.append([
                    str(r.get('name', '')).strip(),
                    str(r.get('regno', '')).strip(),
                    str(r.get('dept', '')).strip(),
                    str(r.get('email', '')).strip(),
                    str(r.get('mobile', '')).strip(),
                ])
            elif isinstance(r, (list, tuple)) and len(r) >= 5:
                parsed.append([str(r[0]).strip(), str(r[1]).strip(), str(r[2]).strip(), str(r[3]).strip(), str(r[4]).strip()])
            else:
                raise ValueError('rows must contain dicts or lists with 5 entries')
    else:
        raise ValueError('provide either csv or rows for batch creation')

    students: List[Dict[str, Any]] = []
    for name, regno, dept, email, mobile in parsed:
        if not name or not regno:
            raise ValueError('name and regno are required for each student')
        students.append({
            'full_name': name,
            'enrollment_id': regno,
            'department': dept,
            'email': email,
            'mobile': mobile,
        })
    return students


def batch_create_students(app, institutional_id: str, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    if not institutional_id:
        raise ValueError('institutional_id required')

    faculty_id = payload.get('faculty_id')
    faculty_username = payload.get('faculty_username')

    students = _normalize_rows(payload)
    if not students:
        raise ValueError('no students to create')

    if _use_db(app) or connect_db is not None:
        db = _ensure_db(app)
        coll = db.get_collection(COLLECTION)

        # check duplicates by enrollment_id/regno
        regnos = [s['enrollment_id'] for s in students]
        existing = list(coll.find({'enrollment_id': {'$in': regnos}}, {'enrollment_id': 1}))
        if existing:
            raise ValueError(f"duplicate regno/enrollment_id: {', '.join([e.get('enrollment_id','') for e in existing])}")

        docs = []
        for s in students:
            username = s['enrollment_id']
            password_plain = s['enrollment_id']
            doc = {
                **s,
                'username': username,
                'role': 'student',
                'password': generate_password_hash(password_plain),
                'institutional_id': institutional_id,
                'faculty_id': faculty_id,
                'faculty_username': faculty_username,
            }
            docs.append(doc)
        res = coll.insert_many(docs)
        returned = []
        for doc, oid in zip(docs, res.inserted_ids):
            ret = doc.copy()
            ret['_id'] = str(oid)
            returned.append(ret)

        # best-effort email
        if send_welcome_email:
            for doc in docs:
                email = doc.get('email')
                if not email:
                    continue
                try:
                    msg = (
                        f"Welcome! Your student account is ready.\n\n"
                        f"Username: {doc['username']}\n"
                        f"Password: {doc['username']}\n"
                        f"Role: student"
                    )
                    send_welcome_email(email, 'student', doc['username'], msg)
                except Exception:
                    pass
        return returned

    # in-memory fallback
    regnos = [s['enrollment_id'] for s in students]
    dup = {s['enrollment_id'] for s in _STUDENT_STORE if s.get('enrollment_id') in regnos}
    if dup:
        raise ValueError(f"duplicate regno/enrollment_id: {', '.join(dup)}")

    created: List[Dict[str, Any]] = []
    for s in students:
        username = s['enrollment_id']
        password_plain = s['enrollment_id']
        doc = {
            **s,
            'username': username,
            'role': 'student',
            'password': generate_password_hash(password_plain),
            'institutional_id': institutional_id,
            'faculty_id': faculty_id,
            'faculty_username': faculty_username,
        }
        _STUDENT_STORE.append(doc)
        created.append(doc.copy())
    return created


def list_students_by_institution(app, institutional_id: str) -> List[Dict[str, Any]]:
    if not institutional_id:
        raise ValueError('institutional_id required')

    if _use_db(app) or connect_db is not None:
        db = _ensure_db(app)
        coll = db.get_collection(COLLECTION)
        docs = list(coll.find({'institutional_id': institutional_id}, {'password': 0}))
        for d in docs:
            if '_id' in d:
                d['_id'] = str(d['_id'])
        return docs

    return [s.copy() for s in _STUDENT_STORE if s.get('institutional_id') == institutional_id]


def update_student_for_institution(app, institutional_id: str, enrollment_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    if not institutional_id:
        raise ValueError('institutional_id required')
    if not enrollment_id:
        raise ValueError('enrollment_id required')

    updates: Dict[str, Any] = {}
    new_enrollment = payload.get('enrollment_id') if 'enrollment_id' in payload else payload.get('regno')
    if 'enrollment_id' in payload or 'regno' in payload:
        if new_enrollment is None or str(new_enrollment).strip() == '':
            updates['enrollment_id'] = None
        else:
            updates['enrollment_id'] = str(new_enrollment).strip()
            updates['username'] = updates['enrollment_id']
            updates['password'] = generate_password_hash(updates['enrollment_id'])

    for key in ['full_name', 'department', 'email', 'mobile', 'faculty_id', 'faculty_username']:
        if key in payload:
            val = payload.get(key)
            if val is None:
                updates[key] = None
            else:
                updates[key] = str(val).strip() if isinstance(val, str) else val

    if not updates:
        raise ValueError('no fields to update')

    if _use_db(app) or connect_db is not None:
        db = _ensure_db(app)
        coll = db.get_collection(COLLECTION)

        if 'enrollment_id' in updates and updates['enrollment_id'] not in (None, enrollment_id, ''):
            exists = coll.find_one(
                {'institutional_id': institutional_id, 'enrollment_id': updates['enrollment_id']},
                {'_id': 1},
            )
            if exists:
                raise ValueError('enrollment_id already exists')

        set_ops = {k: v for k, v in updates.items() if v is not None}
        unset_ops = {k: '' for k, v in updates.items() if v is None}

        update_spec: Dict[str, Any] = {}
        if set_ops:
            update_spec['$set'] = set_ops
        if unset_ops:
            update_spec['$unset'] = unset_ops

        doc = coll.find_one_and_update(
            {'institutional_id': institutional_id, 'enrollment_id': enrollment_id},
            update_spec,
            return_document=ReturnDocument.AFTER,
        )
        if not doc:
            raise ValueError('student not found')
        if '_id' in doc:
            doc['_id'] = str(doc['_id'])
        return doc

    # in-memory update
    for i, s in enumerate(_STUDENT_STORE):
        if s.get('institutional_id') == institutional_id and s.get('enrollment_id') == enrollment_id:
            if 'enrollment_id' in updates and updates['enrollment_id'] != enrollment_id:
                dup = next(
                    (x for x in _STUDENT_STORE if x.get('institutional_id') == institutional_id and x.get('enrollment_id') == updates['enrollment_id']),
                    None,
                )
                if dup:
                    raise ValueError('enrollment_id already exists')
            _STUDENT_STORE[i] = {**s, **updates}
            return _STUDENT_STORE[i].copy()

    raise ValueError('student not found')


def delete_student_for_institution(app, institutional_id: str, enrollment_id: str) -> bool:
    if not institutional_id:
        raise ValueError('institutional_id required')
    if not enrollment_id:
        raise ValueError('enrollment_id required')

    if _use_db(app) or connect_db is not None:
        db = _ensure_db(app)
        coll = db.get_collection(COLLECTION)
        res = coll.delete_one({'institutional_id': institutional_id, 'enrollment_id': enrollment_id})
        return res.deleted_count > 0

    # in-memory delete
    before = len(_STUDENT_STORE)
    _STUDENT_STORE[:] = [s for s in _STUDENT_STORE if not (s.get('institutional_id') == institutional_id and s.get('enrollment_id') == enrollment_id)]
    return len(_STUDENT_STORE) != before
