const express = require('express');
const router = express.Router();
const FacultyControllers = require('../../controllers/Faculty/FacultyControllers');
const verifyFaculty = require('../../middleware/verifyFaculty');
const FacultyTestController = require('../../controllers/Faculty/FacultyTestController');
const InstitutionControllers = require('../../controllers/Institution/InstitutionControllers');

// FRI Tests assigned to faculty
console.log('[FacultyRoutes] GET /fri-tests - Get FRI test schedules assigned to faculty');
router.get('/fri-tests', verifyFaculty, FacultyControllers.getAssignedFRITests);

// Test evaluation with correct answers
console.log('[FacultyRoutes] GET /tests/:id/evaluation - Get test results with correct answers');
router.get('/tests/:id/evaluation', verifyFaculty, FacultyControllers.getTestResultsWithAnswers);

// Faculty tests (faculty-scoped tests created from question library)
console.log('[FacultyRoutes] Faculty test endpoints registered');
router.post('/tests', verifyFaculty, FacultyTestController.createFacultyTest);
router.get('/tests', verifyFaculty, FacultyTestController.listFacultyTests);
router.get('/tests/:id', verifyFaculty, FacultyTestController.getFacultyTest);
router.put('/tests/:id', verifyFaculty, FacultyTestController.updateFacultyTest);
router.delete('/tests/:id', verifyFaculty, FacultyTestController.deleteFacultyTest);

// Allow faculty to fetch question library (read-only) using faculty token
console.log('[FacultyRoutes] GET /questions - List question library for faculty');
router.get('/questions', verifyFaculty, InstitutionControllers.listQuestions);

module.exports = router;
