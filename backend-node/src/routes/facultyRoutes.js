const express = require('express');

const { listStudentsForFaculty } = require('../controllers/studentController');
const { listBatchesForFaculty, addStudentsToBatch } = require('../controllers/batchController');
const { getFacultyByUsername } = require('../controllers/facultyController');

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

module.exports = router;
