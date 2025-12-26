from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

from src.controllers.logs_controller import get_logs

router = APIRouter()


@router.get('/api/admin/logs')
async def list_logs(request: Request) -> JSONResponse:
    """Return recent auth logs for admin UI consumers.

    Note: server-side auth is minimal; callers must ensure only admin users call this.
    """
    app = request.app
    try:
        try:
            limit = int(request.query_params.get('limit', '200'))
        except Exception:
            limit = 200
        docs = get_logs(app, limit=limit)
        return JSONResponse({'ok': True, 'logs': docs}, status_code=200)
    except Exception as exc:
        app.logger.exception('Failed to list logs: %s', exc)
        return JSONResponse({'ok': False, 'logs': []}, status_code=500)
