from typing import Dict, Any, List, Iterable
from werkzeug.security import generate_password_hash

COLLECTION = 'students'

# In-memory fallback store when MongoDB is not configured
_STUDENT_STORE: List[Dict[str, Any]] = []


def _use_db(app) -> bool:
    return getattr(app, 'mongo_client', None) is not None


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

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)

        # check duplicates by enrollment_id/regno
        regnos = [s['enrollment_id'] for s in students]
        existing = list(coll.find({'enrollment_id': {'$in': regnos}}, {'enrollment_id': 1}))
        if existing:
            raise ValueError(f"duplicate regno/enrollment_id: {', '.join([e.get('enrollment_id','') for e in existing])}")

        docs = []
        for s in students:
            doc = {
                **s,
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
        return returned

    # in-memory fallback
    regnos = [s['enrollment_id'] for s in students]
    dup = {s['enrollment_id'] for s in _STUDENT_STORE if s.get('enrollment_id') in regnos}
    if dup:
        raise ValueError(f"duplicate regno/enrollment_id: {', '.join(dup)}")

    created: List[Dict[str, Any]] = []
    for s in students:
        doc = {
            **s,
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

    if _use_db(app):
        client = getattr(app, 'mongo_client')
        db = client.get_database('gradedgedev')
        coll = db.get_collection(COLLECTION)
        docs = list(coll.find({'institutional_id': institutional_id}, {'password': 0}))
        for d in docs:
            if '_id' in d:
                d['_id'] = str(d['_id'])
        return docs

    return [s.copy() for s in _STUDENT_STORE if s.get('institutional_id') == institutional_id]
