const express = require('express');
const router = express.Router();
const FacultyControllers = require('../../controllers/Faculty/FacultyControllers');
const verifyFaculty = require('../../middleware/verifyFaculty');

// Test evaluation with correct answers
console.log('[FacultyRoutes] GET /tests/:id/evaluation - Get test results with correct answers');
router.get('/tests/:id/evaluation', verifyFaculty, FacultyControllers.getTestResultsWithAnswers);

module.exports = router;
