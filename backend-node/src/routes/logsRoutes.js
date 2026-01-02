const express = require('express');
const { getLogs, backupAndDelete } = require('../controllers/logsController');

const router = express.Router();

// Health for logs
router.get('/api/logs/health', (req, res) => {
	res.status(200).json({ ok: true, message: 'logs routes active' });
});

// Admin-facing logs endpoint with optional filters
// Query params: username, role, action, startTs, endTs, limit
router.get('/api/admin/logs', async (req, res) => {
	try {
		const { username, role, action, startTs, endTs, limit } = req.query;
		const opts = { username, role, action, startTs, endTs, limit };
		const docs = await getLogs(opts);
		res.status(200).json({ ok: true, logs: docs });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Failed to fetch logs', err);
		res.status(500).json({ ok: false, error: 'failed to fetch logs' });
	}
});


// Backup and delete logs (admin action). Optional filters in body or query.
router.post('/api/admin/logs/backup-delete', async (req, res) => {
	try {
		const { username, role, action, startTs, endTs } = { ...req.query, ...(req.body || {}) };
		const opts = { username, role, action, startTs, endTs };
		const result = await backupAndDelete(opts);
		res.status(200).json({ ok: true, backup: result.filename, path: result.path, deletedCount: result.deletedCount });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Failed to backup and delete logs', err);
		res.status(500).json({ ok: false, error: 'failed to backup and delete logs' });
	}
});

module.exports = router;
