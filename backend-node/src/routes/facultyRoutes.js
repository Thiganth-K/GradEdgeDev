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

// List batches assigned to a faculty member
// GET /api/faculty/batches?faculty_id=...
router.get('/api/faculty/batches', async (req, res) => {
	const facultyId = req.query.faculty_id;
	try {
		const batches = await listBatchesForFaculty(facultyId);
		res.status(200).json({ batches });
	} catch (err) {
		res.status(400).json({ error: err.message || 'Failed to list batches' });
	}
});

// List students belonging to a faculty member
// GET /api/faculty/:facultyId/students
router.get('/api/faculty/:facultyId/students', async (req, res) => {
	try {
		const students = await listStudentsForFaculty(req.params.facultyId);
		res.status(200).json({ data: students });
	} catch (err) {
		res.status(400).json({ error: err.message || 'Failed to list students' });
	}
});

// Assign students to a batch (faculty view)
// POST /api/faculty/batches/:batchCode/assign
router.post('/api/faculty/batches/:batchCode/assign', async (req, res) => {
	const { batchCode } = req.params;
	const { student_ids: studentIds } = req.body || {};
	try {
		const updated = await addStudentsToBatch(batchCode, studentIds || []);
		res.status(200).json({ ok: true, data: updated });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message || 'Failed to assign students to batch' });
	}
});

module.exports = router;
