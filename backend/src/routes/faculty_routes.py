from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from src.controllers.faculty_controller import (
    create_faculty,
    list_faculty,
    get_faculty,
    update_faculty,
    delete_faculty,
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


@router.get('/api/faculty')
async def faculty_list(request: Request) -> JSONResponse:
    app = request.app
    try:
        docs = list_faculty(app)
        return JSONResponse({'ok': True, 'data': docs}, status_code=200)
    except Exception as exc:
        app.logger.exception('Failed to list faculty: %s', exc)
        return JSONResponse({'ok': False, 'error': str(exc)}, status_code=500)


@router.post('/api/faculty')
async def faculty_create(request: Request) -> JSONResponse:
    app = request.app
    try:
        payload = await _get_json_body(request)
        doc = create_faculty(app, payload)
        return JSONResponse({'ok': True, 'data': doc}, status_code=201)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to create faculty: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.get('/api/faculty/{username}')
async def faculty_get(username: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        doc = get_faculty(app, username)
        if not doc:
            return JSONResponse({'ok': False, 'error': 'not found'}, status_code=404)
        return JSONResponse({'ok': True, 'data': doc}, status_code=200)
    except Exception as exc:
        app.logger.exception('Failed to get faculty: %s', exc)
        return JSONResponse({'ok': False, 'error': str(exc)}, status_code=500)


@router.put('/api/faculty/{username}')
async def faculty_update(username: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        payload = await _get_json_body(request)
        doc = update_faculty(app, username, payload)
        return JSONResponse({'ok': True, 'data': doc}, status_code=200)
    except ValueError as ve:
        return JSONResponse({'ok': False, 'error': str(ve)}, status_code=400)
    except Exception as exc:
        app.logger.exception('Failed to update faculty: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)


@router.delete('/api/faculty/{username}')
async def faculty_delete(username: str, request: Request) -> JSONResponse:
    app = request.app
    try:
        ok = delete_faculty(app, username)
        if not ok:
            return JSONResponse({'ok': False, 'error': 'not found'}, status_code=404)
        return JSONResponse({'ok': True}, status_code=200)
    except Exception as exc:
        app.logger.exception('Failed to delete faculty: %s', exc)
        return JSONResponse({'ok': False, 'error': 'internal error'}, status_code=500)
