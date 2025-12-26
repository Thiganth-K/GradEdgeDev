from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from src.controllers.institutional_controller import (
    create_institutional,
    list_institutional,
    get_institutional,
    update_institutional,
    delete_institutional,
)
from src.controllers.faculty_controller import (
    create_faculty_for_institution,
    list_faculty_by_institution,
    get_faculty_for_institution,
    update_faculty_for_institution,
    delete_faculty_for_institution,
)
from src.controllers.student_controller import (
    batch_create_students,
    list_students_by_institution,
)

router = APIRouter()


async def _get_json_body(request: Request) -> dict:
    try:
        if 'application/json' in (request.headers.get('content-type') or ''):
            return await request.json() or {}
        form = await request.form()
        return dict(form) if form else {}
    except Exception:
        return {}


@router.get('/api/institutional')
async def institutional_list(request: Request) -> JSONResponse:
    app = request.app
    try:
        docs = list_institutional(app)
        return JSONResponse({'ok': True, 'data': docs}, status_code=200)
    except Exception as exc:
        app.logger.exception('Failed to list institutional users: %s', exc)
        return JSONResponse({'ok': False, 'error': str(exc)}, status_code=500)


@router.post('/api/institutional')
async def institutional_create(request: Request) -> JSONResponse:
    app = request.app
    try:
        payload = await _get_json_body(request)
        doc = create_institutional(app, payload)
        return JSONResponse({'ok': True, 'data': doc}, status_code=201)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to create institutional user: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.post('/api/institutional/{institutional_id}/faculty')
async def institutional_create_faculty(institutional_id: str, request: Request) -> JSONResponse:
    """Create a faculty account owned by an institutional user with prefixed faculty_id."""
    app = request.app
    try:
        payload = await _get_json_body(request)
        doc = create_faculty_for_institution(app, institutional_id, payload)
        return JSONResponse({'ok': True, 'data': doc}, status_code=201)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to create faculty for institution: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.get('/api/institutional/{institutional_id}/faculty')
async def institutional_list_faculty(institutional_id: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        docs = list_faculty_by_institution(app, institutional_id)
        return JSONResponse({'ok': True, 'data': docs}, status_code=200)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to list faculty for institution: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.get('/api/institutional/{institutional_id}/faculty/{username}')
async def institutional_get_faculty(institutional_id: str, username: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        doc = get_faculty_for_institution(app, institutional_id, username)
        if not doc:
            return JSONResponse({'ok': False, 'error': 'not found'}, status_code=404)
        return JSONResponse({'ok': True, 'data': doc}, status_code=200)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to get faculty for institution: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.put('/api/institutional/{institutional_id}/faculty/{username}')
async def institutional_update_faculty(institutional_id: str, username: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        payload = await _get_json_body(request)
        doc = update_faculty_for_institution(app, institutional_id, username, payload)
        return JSONResponse({'ok': True, 'data': doc}, status_code=200)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to update faculty for institution: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.delete('/api/institutional/{institutional_id}/faculty/{username}')
async def institutional_delete_faculty(institutional_id: str, username: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        ok = delete_faculty_for_institution(app, institutional_id, username)
        if not ok:
            return JSONResponse({'ok': False, 'error': 'not found'}, status_code=404)
        return JSONResponse({'ok': True}, status_code=200)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to delete faculty for institution: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.post('/api/institutional/{institutional_id}/students/batch')
async def institutional_batch_students(institutional_id: str, request: Request) -> JSONResponse:
    """Create a batch of students for an institution (CSV or rows), optionally mapped to a faculty.

    Body supports either:
    { csv: "name,regno,dept,email,mobile\n...", faculty_id?, faculty_username? }
    or { rows: [{name, regno, dept, email, mobile}, ...], faculty_id?, faculty_username? }
    """
    app = request.app
    try:
        payload = await _get_json_body(request)
        docs = batch_create_students(app, institutional_id, payload)
        return JSONResponse({'ok': True, 'data': docs}, status_code=201)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to batch create students: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.get('/api/institutional/{institutional_id}/students')
async def institutional_list_students(institutional_id: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        docs = list_students_by_institution(app, institutional_id)
        return JSONResponse({'ok': True, 'data': docs}, status_code=200)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to list students: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.get('/api/institutional/{username}')
async def institutional_get(username: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        doc = get_institutional(app, username)
        if not doc:
            return JSONResponse({'ok': False, 'error': 'not found'}, status_code=404)
        return JSONResponse({'ok': True, 'data': doc}, status_code=200)
    except Exception as exc:
        app.logger.exception('Failed to get institutional user: %s', exc)
        return JSONResponse({'ok': False, 'error': str(exc)}, status_code=500)


@router.put('/api/institutional/{username}')
async def institutional_update(username: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        payload = await _get_json_body(request)
        doc = update_institutional(app, username, payload)
        return JSONResponse({'ok': True, 'data': doc}, status_code=200)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to update institutional user: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.delete('/api/institutional/{username}')
async def institutional_delete(username: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        ok = delete_institutional(app, username)
        if not ok:
            return JSONResponse({'ok': False, 'error': 'not found'}, status_code=404)
        return JSONResponse({'ok': True}, status_code=200)
    except Exception as exc:
        app.logger.exception('Failed to delete institutional user: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)
