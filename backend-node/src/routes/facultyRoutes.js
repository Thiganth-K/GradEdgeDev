const express = require('express');

const { listStudentsForFaculty } = require('../controllers/studentController');
const { listBatchesForFaculty, addStudentsToBatch } = require('../controllers/batchController');
const { getFacultyByUsername } = require('../controllers/facultyController');
const { listTestsForFaculty, getResults } = require('../controllers/mcqTestController');
const { getDb } = require('../config/db');

const router = express.Router();

// Health check
router.get('/api/faculty/health', (req, res) => {
	res.status(200).json({ ok: true, message: 'faculty routes OK' });
});

// Lookup faculty by username (used by frontend to resolve faculty_id)
// GET /api/faculty/:username
router.get('/api/faculty/:username', async (req, res) => {
	try {
		const doc = await getFacultyByUsername(req.params.username);
		if (!doc) {
			return res.status(404).json({ ok: false, error: 'Faculty not found' });
		}
		return res.status(200).json({ ok: true, data: doc });
	} catch (err) {
		return res.status(500).json({ ok: false, error: err.message || 'Failed to fetch faculty' });
	}
});

// List batches assigned to a faculty member (RESTful)
// GET /api/faculty/:facultyId/batches
router.get('/api/faculty/:facultyId/batches', async (req, res) => {
	const { facultyId } = req.params;
	try {
		const batches = await listBatchesForFaculty(facultyId);
		return res.status(200).json({ ok: true, data: batches });
	} catch (err) {
		console.error('[FACULTY] list batches error', err && err.stack ? err.stack : err);
		return res.status(500).json({ ok: false, error: err.message || 'Failed to list batches' });
	}
});

// Support legacy frontend path: GET /api/faculty/sessions?faculty_id=xxx
router.get('/api/faculty/sessions', async (req, res) => {
	try {
		const facultyId = req.query.faculty_id || req.query.facultyId || null;
		const db = getDb();
		const coll = db.collection('sessions');
		const q = {};
		if (facultyId) q.faculty_id = String(facultyId);
		const docs = await coll.find(q).toArray();
		const out = docs.map(d => ({ ...d, _id: d._id.toString() }));
		return res.status(200).json({ ok: true, sessions: out });
	} catch (err) {
		console.error('[FACULTY] sessions list error', err && err.stack ? err.stack : err);
		return res.status(500).json({ ok: false, error: err.message || 'Failed to list sessions' });
	}
});

// List students belonging to a faculty member
// GET /api/faculty/:facultyId/students
router.get('/api/faculty/:facultyId/students', async (req, res) => {
	const { facultyId } = req.params;
	try {
		const students = await listStudentsForFaculty(facultyId);
		return res.status(200).json({ ok: true, data: students });
	} catch (err) {
		console.error('[FACULTY] list students error', err && err.stack ? err.stack : err);
		return res.status(500).json({ ok: false, error: err.message || 'Failed to list students' });
	}
});

// Assign students to a batch (faculty view)
// POST /api/faculty/batches/:batchCode/assign
router.post('/api/faculty/:facultyId/batches/:batchCode/assign', async (req, res) => {
	const { facultyId, batchCode } = req.params;
	const { student_ids: studentIds } = req.body || {};
	try {
		// Optionally validate facultyId owns or is associated with the batch in controller
		const updated = await addStudentsToBatch(batchCode, studentIds || []);
		return res.status(200).json({ ok: true, data: updated });
	} catch (err) {
		console.error('[FACULTY] assign to batch error', err && err.stack ? err.stack : err);
		return res.status(500).json({ ok: false, error: err.message || 'Failed to assign students to batch' });
	}
});

// List tests assigned to a faculty
// GET /api/faculty/:facultyId/tests
router.get('/api/faculty/:facultyId/tests', async (req, res) => {
	const { facultyId } = req.params;
	try {
		const tests = await listTestsForFaculty(facultyId);
		return res.status(200).json({ ok: true, data: tests });
	} catch (err) {
		console.error('[FACULTY] list tests error', err && err.stack ? err.stack : err);
		return res.status(500).json({ ok: false, error: err.message || 'Failed to list tests' });
	}
});

// Get test results (submissions) for a test
// GET /api/faculty/:facultyId/tests/:testId/results
router.get('/api/faculty/:facultyId/tests/:testId/results', async (req, res) => {
	try {
		const results = await getResults(req.params.testId);
		return res.status(200).json({ ok: true, data: results });
	} catch (err) {
		console.error('[FACULTY] get results error', err && err.stack ? err.stack : err);
		const status = err.message === 'test not found' ? 404 : 500;
		return res.status(status).json({ ok: false, error: err.message || 'Failed to get results' });
	}
});

module.exports = router;
