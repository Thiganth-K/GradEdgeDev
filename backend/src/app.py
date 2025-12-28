from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path
import os
import sys
import logging

# make backend package importable when running this file directly
THIS_DIR = Path(__file__).resolve().parent
BACKEND_ROOT = THIS_DIR.parent
if str(BACKEND_ROOT) not in sys.path:
	sys.path.insert(0, str(BACKEND_ROOT))

try:
	from utils.db import connect_db
except Exception:
	connect_db = None
try:
	from utils.db import load_env_file
	# Load backend/.env early so env credentials are available even when DB isn't connected
	try:
		load_env_file()
	except Exception:
		pass
except Exception:
	load_env_file = None

os.environ.setdefault('NODE_ENV', os.environ.get('NODE_ENV', 'development'))
ENV = os.environ.get('NODE_ENV', 'development').lower()

app = FastAPI()
app.logger = logging.getLogger('gradedgedev')
app.logger.info('Starting backend (env=%s)', ENV)

# Resolve project root (two levels up from backend/src)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
LOGIN_FILE = PROJECT_ROOT / 'frontend' / 'pages' / 'login.html'
ADMIN_WELCOME = PROJECT_ROOT / 'frontend' / 'pages' / 'admin' / 'welcome.html'
FRONTEND_DIST = PROJECT_ROOT / 'frontend' / 'dist'
FRONTEND_INDEX = FRONTEND_DIST / 'index.html'

# Serve built frontend assets when present (Vite output). With NODE_ENV=production, expect dist to be present.
if FRONTEND_DIST.exists():
	assets_dir = FRONTEND_DIST / 'assets'
	if assets_dir.exists():
		app.mount('/assets', StaticFiles(directory=str(assets_dir)), name='assets')
	app.mount('/frontend', StaticFiles(directory=str(FRONTEND_DIST)), name='frontend')
else:
	app.logger.warning('frontend/dist not found; build the frontend (npm run build) to serve static assets from backend')

# Include routers if available
try:
	from src.routes.admin_routes import router as admin_router
	app.include_router(admin_router)
except Exception:
	logging.warning('Admin routes not available')

try:
	from src.routes.auth_routes import router as auth_router
	app.include_router(auth_router)
except Exception:
	logging.warning('Auth routes not available')

try:
	from src.routes.faculty_features_routes import router as faculty_features_router
	app.include_router(faculty_features_router)
except Exception:
	logging.warning('Faculty features routes not available')

try:
	from src.routes.faculty_routes import router as faculty_router
	app.include_router(faculty_router)
except Exception:
	logging.warning('Faculty routes not available')

try:
	from src.routes.logs_routes import router as logs_router
	app.include_router(logs_router)
except Exception:
	logging.warning('Logs routes not available')

try:
	from src.routes.institutional_routes import router as institutional_router
	app.include_router(institutional_router)
except Exception:
	logging.warning('Institutional routes not available')

try:
	from src.routes.student_routes import router as student_router
	app.include_router(student_router)
except Exception:
	logging.warning('Student routes not available')


@app.get('/')
@app.get('/login')
async def login() -> FileResponse:
	# Prefer built SPA index if available; otherwise fall back to legacy login.html
	if FRONTEND_INDEX.exists():
		return FileResponse(str(FRONTEND_INDEX))
	if LOGIN_FILE.exists():
		return FileResponse(str(LOGIN_FILE))
	raise HTTPException(status_code=404, detail='Login page not found')


@app.get('/admin/welcome')
async def admin_welcome() -> FileResponse:
	if ADMIN_WELCOME.exists():
		return FileResponse(str(ADMIN_WELCOME))
	raise HTTPException(status_code=404, detail='Admin welcome page not found')


@app.get('/{full_path:path}', include_in_schema=False)
async def spa_fallback(full_path: str) -> FileResponse:
	"""Serve the built SPA index for any non-API path when available."""
	if full_path.startswith('api'):
		raise HTTPException(status_code=404, detail='Not found')
	if FRONTEND_INDEX.exists():
		return FileResponse(str(FRONTEND_INDEX))
	raise HTTPException(status_code=404, detail='Not found')


@app.on_event('startup')
async def on_startup() -> None:
	# Optionally connect to MongoDB. Support either MONGODB_URI or legacy MONGO_URI keys
	mongo_uri = os.environ.get('MONGODB_URI') or os.environ.get('MONGO_URI')
	if mongo_uri and connect_db is not None:
		try:
			app.mongo_client = connect_db(mongo_uri)
			logging.info('Connected to MongoDB')
		except Exception as exc:
			logging.warning('MongoDB connection failed: %s', exc)
			app.mongo_client = None
	else:
		app.mongo_client = None

	# Ensure admin user exists (if DB available) and seed default users
	try:
		from src.controllers.admin_controller import ensure_admin
		try:
			from src.metadata.users import seed_users
			seed_users(app)
		except Exception:
			logging.info('No metadata seed available or seeding skipped')
		ensure_admin(app)
	except Exception as exc:
		logging.warning('ensure_admin failed: %s', exc)


if __name__ == '__main__':
	import uvicorn

	# Run development server: python backend/src/app.py
	uvicorn.run('src.app:app', host='127.0.0.1', port=5000, reload=True)