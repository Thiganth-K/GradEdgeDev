const express = require('express');
const {
	listAllStudents,
	createTestStudent,
	getStudentProfile,
	updateStudentProfile,
	sendOtpForCredentials,
	verifyOtp,
} = require('../controllers/studentController');

const router = express.Router();
const { listTestsForStudent, getTestForStudent, submitTest } = require('../controllers/mcqTestController');

// Prefix mirrors Python router ("/api/student")

// GET /api/student/list/all
router.get('/api/student/list/all', async (req, res) => {
	const result = await listAllStudents();
	res.status(result.status).json(result.body);
});

// POST /api/student/create-test-student
router.post('/api/student/create-test-student', async (req, res) => {
	const result = await createTestStudent();
	res.status(result.status).json(result.body);
});

// GET /api/student/:username
router.get('/api/student/:username', async (req, res) => {
	const { username } = req.params;
	const result = await getStudentProfile(username);
	res.status(result.status).json(result.body);
});

// PUT /api/student/:username
router.put('/api/student/:username', async (req, res) => {
	const { username } = req.params;
	const result = await updateStudentProfile(username, req.body || {});
	res.status(result.status).json(result.body);
});

// POST /api/student/:username/send-otp
router.post('/api/student/:username/send-otp', async (req, res) => {
	const { username } = req.params;
	const email = (req.body && req.body.email) || null;
	const result = await sendOtpForCredentials(username, email);
	res.status(result.status).json(result.body);
});

// POST /api/student/:username/verify-otp
router.post('/api/student/:username/verify-otp', async (req, res) => {
	const { username } = req.params;
	const otp = (req.body && req.body.otp) || null;
	const result = await verifyOtp(username, otp);
	res.status(result.status).json(result.body);
});

// --- Student MCQ tests ---

// List tests assigned to student (uses username as student_id)
router.get('/api/student/:username/tests', async (req, res) => {
	try {
		const tests = await listTestsForStudent(req.params.username);
		return res.status(200).json({ ok: true, data: tests });
	} catch (err) {
		return res.status(500).json({ ok: false, error: err.message || 'Failed to list tests' });
	}
});

// Get test details for taking (questions without correct answers)
router.get('/api/student/:username/tests/:testId', async (req, res) => {
	try {
		const test = await getTestForStudent(req.params.testId);
		return res.status(200).json({ ok: true, data: test });
	} catch (err) {
		const status = err.message === 'test not found' ? 404 : 500;
		return res.status(status).json({ ok: false, error: err.message || 'Failed to get test' });
	}
});

// Submit test answers
router.post('/api/student/:username/tests/:testId/submit', async (req, res) => {
	try {
		const answers = Array.isArray(req.body && req.body.answers) ? req.body.answers : [];
		const result = await submitTest(req.params.username, req.params.testId, answers);
		return res.status(200).json({ ok: true, data: result });
	} catch (err) {
		const status = err.message === 'test not found' ? 404 : 400;
		return res.status(status).json({ ok: false, error: err.message || 'Failed to submit test' });
	}
});

// List announcements relevant to a student
router.get('/api/student/:username/announcements', async (req, res) => {
	try {
		const username = req.params.username;
		const db = require('../config/db').getDb();
		const students = db.collection('students');
		const student = await students.findOne({ username });
		console.log('[STUDENT] announcements requested for', username, 'found student?', !!student);
		if (!student) return res.status(404).json({ ok: false, error: 'student not found' });

		const annColl = db.collection('announcements');
		const q = { institutional_id: student.institutional_id };
		// Fetch announcements targeted to all (no target_batch_codes) or to student's batch
		// Fetch all announcements for the institution, then filter server-side
		const all = await annColl.find({ institutional_id: student.institutional_id }).sort({ createdAt: -1 }).toArray();

		const testsColl = db.collection('mcq_tests');

		const filtered = [];
		for (const d of all) {
			// If no targeting specified, include
			const targets = Array.isArray(d.target_batch_codes) ? d.target_batch_codes.map(String) : [];
			if (!targets || targets.length === 0) {
				filtered.push(d);
				continue;
			}

			// Normalize student's batch candidates
			const studentBatchCandidates = new Set();
			if (student.batch_code) studentBatchCandidates.add(String(student.batch_code));
			if (student.batch_id) studentBatchCandidates.add(String(student.batch_id));
			if (student.batch) studentBatchCandidates.add(String(student.batch));

			// If any target matches student's batch values, include
			const intersects = targets.some(t => studentBatchCandidates.has(String(t)));
			if (intersects) {
				filtered.push(d);
				continue;
			}

			// If announcement references a test, check test assigned lists
			if (d.test_id) {
				try {
					const testDoc = await testsColl.findOne({ _id: new (require('mongodb').ObjectId)(d.test_id) });
					if (testDoc) {
						const assignedStudents = Array.isArray(testDoc.assigned_student_ids) ? testDoc.assigned_student_ids.map(String) : [];
						const assignedBatches = Array.isArray(testDoc.assigned_batch_codes) ? testDoc.assigned_batch_codes.map(String) : [];
						if (assignedStudents.includes(String(student.username)) || assignedStudents.includes(String(student.enrollment_id))) {
							filtered.push(d);
							continue;
						}
						if (assignedBatches.some(b => studentBatchCandidates.has(String(b)))) {
							filtered.push(d);
							continue;
						}
					}
				} catch (e) {
					console.error('[STUDENT] error checking test assignment for announcement', d.test_id, e && e.stack ? e.stack : e);
				}
			}
		}

		console.log('[STUDENT] announcements query for', student.institutional_id, 'found total', all.length, 'filtered', filtered.length)

		const out = filtered.map(d => ({ id: d._id.toString(), title: d.title, description: d.description, date: d.createdAt, category: d.category || 'General', test_id: d.test_id }));
		return res.status(200).json({ ok: true, data: out });
	} catch (err) {
		console.error('[STUDENT] list announcements error', err && err.stack ? err.stack : err);
		return res.status(500).json({ ok: false, error: err.message || 'Failed to list announcements' });
	}
});

module.exports = router;
