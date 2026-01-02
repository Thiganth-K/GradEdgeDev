const express = require('express');
const { getAdminInfo } = require('../controllers/adminController');
const { listInstitutional } = require('../controllers/institutionalController');
const { logEvent } = require('../controllers/logsController');

const router = express.Router();

// GET /api/admin/me
router.get('/api/admin/me', (req, res) => {
	try {
		const info = getAdminInfo();
		// eslint-disable-next-line no-console
		console.log('[ADMIN] /api/admin/me called', {
			username: info.username,
			timestamp: new Date().toISOString(),
		});
		// record that admin viewed their info
		try { logEvent(info.username, 'admin', `Viewed admin dashboard`); } catch (e) {}
		res.status(200).json(info);
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Failed to get admin info', err);
		res
			.status(500)
			.json({ error: 'failed to fetch admin info' });
	}
});

// GET /api/admin/institutionals
// Simple admin-focused view of all institutional accounts (without passwords)
router.get('/api/admin/institutionals', async (req, res) => {
	try {
		const docs = await listInstitutional();
		// eslint-disable-next-line no-console
		console.log('[ADMIN] Listed institutional accounts', {
			count: Array.isArray(docs) ? docs.length : 0,
			timestamp: new Date().toISOString(),
		});
		res.status(200).json({ ok: true, data: docs });
		const count = Array.isArray(docs) ? docs.length : 0;
		try { logEvent('admin', 'admin', `Viewed ${count} institutional user(s)`); } catch (e) {}
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Failed to list institutional accounts', err);
		res
			.status(500)
			.json({ ok: false, error: 'failed to list institutional accounts' });
	}
});

module.exports = router;
