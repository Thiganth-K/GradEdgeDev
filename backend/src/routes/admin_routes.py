from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from src.controllers.admin_controller import get_admin_info

router = APIRouter()


@router.get('/api/admin/me')
async def admin_me(request: Request) -> JSONResponse:
    app = request.app
    try:
        info = get_admin_info(app)
        if info and 'username' in info:
            username = info['username']
        else:
            import os
            username = os.environ.get('ADMIN_USERNAME') or os.environ.get('ADMIN_USER') or 'thiganth'

        return JSONResponse({'username': username, 'greeting': f'Welcome, {username}!'}, status_code=200)
    except Exception as exc:
        app.logger.exception('Failed to get admin info: %s', exc)
        return JSONResponse({'error': 'failed to fetch admin info'}, status_code=500)
