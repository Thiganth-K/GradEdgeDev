const express = require('express');
const { login, logout } = require('../controllers/authController');

const router = express.Router();

// POST /api/auth/login
router.post('/api/auth/login', async (req, res) => {
	try {
		const result = await login(req.body || {});
		res.status(result.status).json(result.body);
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Error in /api/auth/login', err);
		res.status(500).json({ ok: false, message: 'internal error' });
	}
});

// POST /api/auth/logout
router.post('/api/auth/logout', (req, res) => {
	try {
		const result = logout(req.body || {});
		res.status(result.status).json(result.body);
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Error in /api/auth/logout', err);
		res.status(500).json({ ok: false, message: 'internal error' });
	}
});

// You can add signup/OTP routes here later, mirroring the Python backend.

module.exports = router;

