from flask import Flask, send_file, abort
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

app = Flask(__name__)

# Register admin routes if available
try:
	from src.routes.admin_routes import admin_bp
	app.register_blueprint(admin_bp)
except Exception as _:
	logging.warning('Admin routes not available')

# Register auth routes
try:
	from src.routes.auth_routes import auth_bp
	app.register_blueprint(auth_bp)
except Exception:
	logging.warning('Auth routes not available')

# Register faculty routes
try:
	from src.routes.faculty_routes import faculty_bp
	app.register_blueprint(faculty_bp)
except Exception:
	logging.warning('Faculty routes not available')

# Register logs routes
try:
	from src.routes.logs_routes import logs_bp
	app.register_blueprint(logs_bp)
except Exception:
	logging.warning('Logs routes not available')

# Resolve project root (two levels up from backend/src)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
LOGIN_FILE = PROJECT_ROOT / 'frontend' / 'pages' / 'login.html'


@app.route('/')
@app.route('/login')
def login():
	if LOGIN_FILE.exists():
		return send_file(str(LOGIN_FILE))
	return abort(404, description='Login page not found')


if __name__ == '__main__':
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

	# Ensure admin user exists (if DB available)
	try:
		from src.controllers.admin_controller import ensure_admin
		# seed default users (admin/faculty/student/recruiter)
		try:
			from src.metadata.users import seed_users
			seed_users(app)
		except Exception:
			logging.info('No metadata seed available or seeding skipped')
		ensure_admin(app)
	except Exception as exc:
		logging.warning('ensure_admin failed: %s', exc)

	# Serve admin welcome page route
	try:
		ADMIN_WELCOME = PROJECT_ROOT / 'frontend' / 'pages' / 'admin' / 'welcome.html'

		@app.route('/admin/welcome')
		def admin_welcome():
			if ADMIN_WELCOME.exists():
				return send_file(str(ADMIN_WELCOME))
			return abort(404, description='Admin welcome page not found')
	except Exception:
		logging.warning('Failed to register admin welcome route')

	# Run development server: python backend/src/app.py
	app.run(host='127.0.0.1', port=5000, debug=True)