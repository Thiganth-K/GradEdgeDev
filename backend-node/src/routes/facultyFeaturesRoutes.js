const express = require('express');

const router = express.Router();

// Placeholder routes for faculty feature APIs.
// Mirror backend/src/routes/faculty_features_routes.py here.

router.get('/api/faculty-features/health', (req, res) => {
	res.status(200).json({ ok: true, message: 'faculty features routes placeholder' });
});

// Sessions: create & list (compat with legacy frontend calling /api/faculty/sessions)
router.post('/api/faculty/sessions', async (req, res) => {
	try {
		const db = require('../config/db').getDb();
		const coll = db.collection('sessions');
		const payload = req.body || {};
		const doc = {
			faculty_id: payload.faculty_id || payload.facultyId || null,
			topic: payload.topic || payload.title || 'Session',
			start_time: payload.start_time || new Date().toISOString(),
			batch_code: payload.batch_code || payload.batchCode || null,
			createdAt: new Date().toISOString(),
		};
		const r = await coll.insertOne(doc);
		return res.status(200).json({ ok: true, session: { ...doc, _id: r.insertedId.toString() } });
	} catch (err) {
		console.error('[SESSIONS] create error', err && err.stack ? err.stack : err);
		return res.status(500).json({ ok: false, error: err.message || 'Failed to create session' });
	}
});

router.get('/api/faculty/sessions', async (req, res) => {
	try {
		const facultyId = req.query.faculty_id || req.query.facultyId || null;
		const db = require('../config/db').getDb();
		const coll = db.collection('sessions');
		const q = {};
		if (facultyId) q.faculty_id = String(facultyId);
		const docs = await coll.find(q).toArray();
		const out = docs.map(d => ({ ...d, _id: d._id.toString() }));
		return res.status(200).json({ ok: true, sessions: out });
	} catch (err) {
		console.error('[SESSIONS] list error', err && err.stack ? err.stack : err);
		return res.status(500).json({ ok: false, error: err.message || 'Failed to list sessions' });
	}
});

module.exports = router;
