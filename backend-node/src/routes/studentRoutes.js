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

module.exports = router;
