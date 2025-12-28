from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request, Body
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import csv
import io
import logging

from src.controllers.batch_controller import create_batch, list_batches, get_batch, add_students_to_batch
from src.controllers.announcement_controller import create_announcement, list_announcements
from src.controllers.session_controller import create_session, list_sessions
from src.controllers.student_controller import batch_create_students, list_students_by_institution
from src.controllers.faculty_controller import get_faculty_by_faculty_id

# We'll use the existing router variable, but since we are replacing the file content, we define it here.
router = APIRouter()
logger = logging.getLogger(__name__)

# --- Batch Management ---

@router.post('/api/faculty/batches')
async def api_create_batch(request: Request):
    try:
        data = await request.json()
        result = create_batch(request.app, data)
        return JSONResponse({'ok': True, 'batch': result})
    except ValueError as e:
        return JSONResponse({'ok': False, 'message': str(e)}, status_code=400)
    except Exception as e:
        return JSONResponse({'ok': False, 'message': str(e)}, status_code=500)

@router.get('/api/faculty/batches')
async def api_list_batches(request: Request, faculty_id: Optional[str] = None):
    # Scope: If faculty_id is provided, return only their batches.
    batches = list_batches(request.app, faculty_id)
    return JSONResponse({'ok': True, 'batches': batches})


@router.post('/api/faculty/batches/{batch_code}/assign')
async def api_assign_students_to_batch(batch_code: str, request: Request):
    """Assign the provided students (by enrollment_id) to a batch for a faculty."""
    try:
        payload = await request.json()
    except Exception:
        return JSONResponse({'ok': False, 'error': 'invalid json body'}, status_code=400)

    student_ids: List[str] = payload.get('student_ids') or []
    faculty_id: Optional[str] = payload.get('faculty_id')

    if not student_ids:
        return JSONResponse({'ok': False, 'error': 'student_ids required'}, status_code=400)
    if not faculty_id:
        return JSONResponse({'ok': False, 'error': 'faculty_id required'}, status_code=400)

    app = request.app
    faculty = get_faculty_by_faculty_id(app, faculty_id)
    if not faculty:
        return JSONResponse({'ok': False, 'error': 'faculty not found'}, status_code=404)

    institutional_id = faculty.get('institutional_id')
    if not institutional_id:
        return JSONResponse({'ok': False, 'error': 'institutional_id missing for faculty'}, status_code=400)

    batch = get_batch(app, batch_code)
    if not batch:
        return JSONResponse({'ok': False, 'error': 'batch not found'}, status_code=404)
    if batch.get('faculty_id') and batch.get('faculty_id') != faculty_id:
        return JSONResponse({'ok': False, 'error': 'batch owned by another faculty'}, status_code=403)

    try:
        updated = add_students_to_batch(app, batch_code, student_ids, institutional_id=institutional_id, faculty_id=faculty_id)
        return JSONResponse({'ok': True, 'batch': updated})
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        logger.error('assign to batch failed: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)

# --- Student Management ---

@router.get('/api/faculty/{faculty_id}/students')
async def api_list_faculty_students(faculty_id: str, request: Request, batch_id: Optional[str] = None):
    """
    List students for a specific faculty.
    Optionally filter by batch_id.
    """
    app = request.app
    try:
        faculty = get_faculty_by_faculty_id(app, faculty_id)
        if not faculty:
            return JSONResponse({'ok': False, 'error': 'faculty not found'}, status_code=404)

        institutional_id = faculty.get('institutional_id')
        if not institutional_id:
            return JSONResponse({'ok': False, 'error': 'institutional_id missing for faculty'}, status_code=400)

        students = list_students_by_institution(app, institutional_id)

        filtered: List[Dict[str, Any]] = []
        for student in students:
            if student.get('faculty_id') and student.get('faculty_id') != faculty_id:
                continue
            if batch_id and student.get('batch_id') != batch_id:
                continue
            filtered.append(student)

        return JSONResponse({'ok': True, 'data': filtered}, status_code=200)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as e:
        logger.error(f"Error listing faculty students: {e}")
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.post('/api/faculty/students/preview-csv')
async def api_preview_csv(file: UploadFile = File(...)):
    """
    Parse CSV and return rows for preview.
    Does NOT save to DB.
    """
    if not file.filename.lower().endswith('.csv'):
        return JSONResponse({'ok': False, 'message': 'File must be a CSV'}, status_code=400)

    try:
        content = await file.read()
        text_stream = io.TextIOWrapper(io.BytesIO(content), encoding='utf-8')
        reader = csv.DictReader(text_stream)
        
        # Normalize headers to lowercase/strip
        # Expected: Name, Register Number, Email, Department (optional)
        
        rows = []
        for i, row in enumerate(reader):
            # Try to map common column names
            name = row.get('Name') or row.get('name') or row.get('Full Name')
            regno = row.get('Register Number') or row.get('register_number') or row.get('Enrollment ID') or row.get('regno')
            email = row.get('Email') or row.get('email')
            dept = row.get('Department') or row.get('department') or row.get('Dept')
            
            if name or regno: # Only include if at least name or regno is present
                rows.append({
                    'id': i, # temp id for frontend key
                    'full_name': name,
                    'enrollment_id': regno,
                    'email': email,
                    'department': dept,
                    'status': 'Pending' # Initial status for preview
                })
                
        return JSONResponse({'ok': True, 'rows': rows, 'count': len(rows)})

    except Exception as e:
        return JSONResponse({'ok': False, 'message': f"Preview failed: {str(e)}"}, status_code=500)


@router.post('/api/faculty/students/import')
async def api_import_students(request: Request):
    """
    Commit imported students to DB.
    """
    try:
        payload = await request.json()
        students = payload.get('students', [])
        batch_id = payload.get('batch_id')
        faculty_id = payload.get('faculty_id')

        if not students:
             return JSONResponse({'ok': False, 'message': 'No students to import'}, status_code=400)

        faculty = get_faculty_by_faculty_id(request.app, faculty_id) if faculty_id else None
        if not faculty:
             return JSONResponse({'ok': False, 'message': 'Faculty not found'}, status_code=404)

        institutional_id = faculty.get('institutional_id')
        faculty_username = faculty.get('username')

        app = request.app
        if not hasattr(app, 'mongo_client') or app.mongo_client is None:
             return JSONResponse({'ok': False, 'message': 'Database connection failed'}, status_code=500)
             
        db = app.mongo_client.gradedgedev
        coll = db.students
        
        processed_count = 0
        errors = []
        
        for s in students:
            enrollment_id = s.get('enrollment_id')
            if not enrollment_id:
                continue
                
            doc = {
                'username': enrollment_id,
                'enrollment_id': enrollment_id,
                'full_name': s.get('full_name'),
                'email': s.get('email'),
                'department': s.get('department'),
                'faculty_id': faculty_id,
                'faculty_username': faculty_username,
                'institutional_id': institutional_id,
                'batch_id': batch_id,
                'role': 'student',
                'status': 'Active',
            }

            try:
                existing = coll.find_one({'enrollment_id': enrollment_id})
                if existing:
                    coll.update_one({'enrollment_id': enrollment_id}, {'$set': {
                        'batch_id': batch_id,
                        'faculty_id': faculty_id,
                        'faculty_username': faculty_username,
                        'institutional_id': institutional_id,
                    }})
                else:
                    from werkzeug.security import generate_password_hash
                    doc['password'] = generate_password_hash(enrollment_id)
                    coll.insert_one(doc)
                
                processed_count += 1
            except Exception as e:
                errors.append(f"Failed {enrollment_id}: {str(e)}")

        return JSONResponse({'ok': True, 'processed': processed_count, 'errors': errors})

    except Exception as e:
        return JSONResponse({'ok': False, 'message': str(e)}, status_code=500)

# --- Announcements ---

@router.post('/api/faculty/announcements')
async def api_create_announcement(request: Request):
    try:
        data = await request.json()
        result = create_announcement(request.app, data)
        return JSONResponse({'ok': True, 'announcement': result})
    except Exception as e:
        return JSONResponse({'ok': False, 'message': str(e)}, status_code=500)

@router.get('/api/faculty/announcements')
async def api_list_announcements(request: Request, faculty_id: Optional[str] = None):
    announcements = list_announcements(request.app, faculty_id)
    return JSONResponse({'ok': True, 'announcements': announcements})

# --- Scheduler / Sessions ---

@router.post('/api/faculty/sessions')
async def api_create_session(request: Request):
    try:
        data = await request.json()
        result = create_session(request.app, data)
        return JSONResponse({'ok': True, 'session': result})
    except Exception as e:
        return JSONResponse({'ok': False, 'message': str(e)}, status_code=500)

@router.get('/api/faculty/sessions')
async def api_list_sessions(request: Request, faculty_id: Optional[str] = None):
    sessions = list_sessions(request.app, faculty_id)
    return JSONResponse({'ok': True, 'sessions': sessions})
