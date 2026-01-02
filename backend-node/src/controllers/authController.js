// Auth controller inspired by backend/src/routes/auth_routes.py.
// Supports env-based admin login and MongoDB-backed institutional,
// faculty and student logins. Debug logging is added so you can
// see live status of each step in the Node backend console when
// handling /api/auth/login.

const { getDb } = require('../config/db');
const { logEvent } = require('./logsController');
const { verifyPassword } = require('../utils/password');

async function login(payload) {
	const username = payload.username || payload.name;
	const password = payload.password;

	// Debug: log incoming payload (without password for safety)
	// eslint-disable-next-line no-console
	console.log('[AUTH] Login attempt', {
		username,
		hasPassword: Boolean(password),
		timestamp: new Date().toISOString(),
	});

	if (!username || !password) {
		return {
			ok: false,
			status: 400,
			body: { ok: false, message: 'username and password required' },
		};
	}

	// Env-based admin credentials, similar to Python backend fallback
	let envUser =
		process.env.ADMIN_USERNAME ||
		process.env.ADMIN_USER ||
		process.env.ADMIN;
	let envPass =
		process.env.ADMIN_PASSWORD ||
		process.env.ADMIN_PASS ||
		process.env.ADMIN_PASSWORD;

	if (envUser) envUser = envUser.trim();
	if (envPass) envPass = envPass.trim();

	// Debug: show what we are about to check
	// eslint-disable-next-line no-console
	console.log('[AUTH] Checking env admin credentials', {
		hasEnvUser: Boolean(envUser),
		hasEnvPass: Boolean(envPass),
		matchesEnvUser: envUser ? username === envUser : false,
	});

		if (envUser && envPass && username === envUser && password === envPass) {
		// Match Python behavior: redirect admin to /admin/welcome
		// eslint-disable-next-line no-console
		console.log('[AUTH] Admin login success via env credentials', {
			username,
		});
			// record audit log
			try {
				await logEvent(username, 'admin', `Logged in as admin`);
			} catch (e) {
				// ignore logging failures
			}
		return {
			ok: true,
			status: 200,
			body: {
				ok: true,
				redirect: '/admin/welcome',
				role: 'admin',
				username,
			},
		};
	}

	// DB-backed login for institutional, faculty, student
	try {
		const db = getDb();

		// 1) Institutional users
		try {
			const instColl = db.collection('institutionals');
			// Allow login using either institutional username or institutional_id code
			const inst = await instColl.findOne({
				$or: [
					{ username },
					{ institutional_id: username },
				],
			});
						if (inst && inst.password && (await verifyPassword(password, inst.password))) {
				// eslint-disable-next-line no-console
				console.log('[AUTH] Institutional login success', {
					username: inst.username,
					institutional_id: inst.institutional_id,
				});
							try {
								await logEvent(inst.username, 'institutional', `Logged in (${inst.institutional_id || 'N/A'})`);
							} catch (e) {
								// ignore
							}
				return {
					ok: true,
					status: 200,
					body: {
						ok: true,
						role: 'institutional',
						username: inst.username,
					},
				};
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('[AUTH] Error checking institutional credentials', err);
		}

		// 2) Faculty users
		try {
			const facColl = db.collection('faculty');
			const fac = await facColl.findOne({ username });
						if (fac && fac.password && (await verifyPassword(password, fac.password))) {
				// eslint-disable-next-line no-console
				console.log('[AUTH] Faculty login success', {
					username,
					faculty_id: fac.faculty_id,
				});
							try {
								await logEvent(username, 'faculty', `Logged in (${fac.faculty_id || 'N/A'})`);
							} catch (e) {
								// ignore
							}
				return {
					ok: true,
					status: 200,
					body: {
						ok: true,
						role: 'faculty',
						username,
					},
				};
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('[AUTH] Error checking faculty credentials', err);
		}

		// 3) Student users
		try {
			const studColl = db.collection('students');
			const stud = await studColl.findOne({ username });
						if (stud && stud.password && (await verifyPassword(password, stud.password))) {
				// eslint-disable-next-line no-console
				console.log('[AUTH] Student login success', {
					username,
				});
							try {
								await logEvent(username, 'student', `Logged in`);
							} catch (e) {
								// ignore
							}
				return {
					ok: true,
					status: 200,
					body: {
						ok: true,
						role: 'student',
						username,
					},
				};
			}
		} catch (err) {
			// eslint-disable-next-line no-console
			console.error('[AUTH] Error checking student credentials', err);
		}
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('[AUTH] Unexpected DB auth error', err);
	}

	// If none of the above matched, return invalid credentials
	// eslint-disable-next-line no-console
	console.warn('[AUTH] Login failed: no matching credentials in env or DB', {
		username,
		timestamp: new Date().toISOString(),
	});
	return {
		ok: false,
		status: 401,
		body: { ok: false, message: 'Invalid credentials' },
	};
}

function logout(payload) {
	const username = payload.username;
	const role = payload.role || 'unknown';

	if (username) {
		// In Python backend, this is logged to the logs collection.
		// Here we just log to the console; wire this up to your
		// logging/DB solution as needed.
		// eslint-disable-next-line no-console
		console.log(`User logout: username=${username}, role=${role}`);
		try {
			// fire-and-forget
			logEvent(username, role, `Logged out`).catch(() => {});
		} catch (e) {
			// ignore
		}
	}

	return {
		ok: true,
		status: 200,
		body: { ok: true, message: 'logged out' },
	};
}

module.exports = {
	login,
	logout,
};
