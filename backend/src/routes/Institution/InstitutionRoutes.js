const express = require('express');
const router = express.Router();
const InstitutionControllers = require('../../controllers/Institution/InstitutionControllers');

const verifyInstitution = require('../../middleware/verifyInstitution');
const verifyFaculty = require('../../middleware/verifyFaculty');
const verifyStudent = require('../../middleware/verifyStudent');

// Authentication
console.log('[InstitutionRoutes] POST /login - Institution login');
router.post('/login', InstitutionControllers.login);

console.log('[InstitutionRoutes] POST /faculty/login - Faculty login');
router.post('/faculty/login', InstitutionControllers.facultyLogin);

console.log('[InstitutionRoutes] POST /student/login - Student login');
router.post('/student/login', InstitutionControllers.studentLogin);

console.log('[InstitutionRoutes] GET /welcome - Welcome (institution)');
router.get('/welcome', verifyInstitution, InstitutionControllers.welcome);

// Faculty self-service
console.log('[InstitutionRoutes] GET /faculty/announcements - List faculty announcements');
router.get('/faculty/announcements', verifyFaculty, InstitutionControllers.listFacultyAnnouncements);

console.log('[InstitutionRoutes] GET /faculty/batches - List faculty batches');
router.get('/faculty/batches', verifyFaculty, InstitutionControllers.listFacultyBatches);

// Faculty CRUD (institution-protected)
console.log('[InstitutionRoutes] GET /faculties - List faculties (institution)');
router.get('/faculties', verifyInstitution, InstitutionControllers.listFaculties);

console.log('[InstitutionRoutes] POST /faculties - Create faculty (institution)');
router.post('/faculties', verifyInstitution, InstitutionControllers.createFaculty);

console.log('[InstitutionRoutes] PUT /faculties/:id - Update faculty (institution)');
router.put('/faculties/:id', verifyInstitution, InstitutionControllers.updateFaculty);

console.log('[InstitutionRoutes] DELETE /faculties/:id - Delete faculty (institution)');
router.delete('/faculties/:id', verifyInstitution, InstitutionControllers.deleteFaculty);

// Students CRUD (institution-protected)
console.log('[InstitutionRoutes] GET /students - List students (institution)');
router.get('/students', verifyInstitution, InstitutionControllers.listStudents);

console.log('[InstitutionRoutes] POST /students - Create student (institution)');
router.post('/students', verifyInstitution, InstitutionControllers.createStudent);

console.log('[InstitutionRoutes] PUT /students/:id - Update student (institution)');
router.put('/students/:id', verifyInstitution, InstitutionControllers.updateStudent);

console.log('[InstitutionRoutes] DELETE /students/:id - Delete student (institution)');
router.delete('/students/:id', verifyInstitution, InstitutionControllers.deleteStudent);

// Batches CRUD (institution-protected)
console.log('[InstitutionRoutes] GET /batches - List batches (institution)');
router.get('/batches', verifyInstitution, InstitutionControllers.listBatches);

console.log('[InstitutionRoutes] POST /batches - Create batch (institution)');
router.post('/batches', verifyInstitution, InstitutionControllers.createBatch);

console.log('[InstitutionRoutes] PUT /batches/:id - Update batch (institution)');
router.put('/batches/:id', verifyInstitution, InstitutionControllers.updateBatch);

console.log('[InstitutionRoutes] DELETE /batches/:id - Delete batch (institution)');
router.delete('/batches/:id', verifyInstitution, InstitutionControllers.deleteBatch);

// Question Library CRUD (institution-protected)
console.log('[InstitutionRoutes] GET /questions - List questions (institution)');
router.get('/questions', verifyInstitution, InstitutionControllers.listQuestions);

console.log('[InstitutionRoutes] POST /questions - Create question (institution)');
router.post('/questions', verifyInstitution, InstitutionControllers.createQuestion);

console.log('[InstitutionRoutes] PATCH /questions/:id - Update question (institution)');
router.patch('/questions/:id', verifyInstitution, InstitutionControllers.updateQuestion);

console.log('[InstitutionRoutes] DELETE /questions/:id - Delete question (institution)');
router.delete('/questions/:id', verifyInstitution, InstitutionControllers.deleteQuestion);

// Tests CRUD (institution-protected)
console.log('[InstitutionRoutes] GET /tests - List tests (institution)');
router.get('/tests', verifyInstitution, InstitutionControllers.listTests);

console.log('[InstitutionRoutes] GET /tests/:id - Get test (institution)');
router.get('/tests/:id', verifyInstitution, InstitutionControllers.getTest);

console.log('[InstitutionRoutes] POST /tests - Create test (institution)');
router.post('/tests', verifyInstitution, InstitutionControllers.createTest);

console.log('[InstitutionRoutes] PUT /tests/:id - Update test (institution)');
router.put('/tests/:id', verifyInstitution, InstitutionControllers.updateTest);

console.log('[InstitutionRoutes] DELETE /tests/:id - Delete test (institution)');
router.delete('/tests/:id', verifyInstitution, InstitutionControllers.deleteTest);

console.log('[InstitutionRoutes] POST /tests/:id/assign - Assign test to batches (institution)');
router.post('/tests/:id/assign', verifyInstitution, InstitutionControllers.assignTestBatches);

// Student Test Participation (student-protected)
console.log('[InstitutionRoutes] GET /student/tests - List available tests (student)');
router.get('/student/tests', verifyStudent, InstitutionControllers.listStudentTests);

console.log('[InstitutionRoutes] GET /student/tests/:id - Get test (student)');
router.get('/student/tests/:id', verifyStudent, InstitutionControllers.getStudentTest);

console.log('[InstitutionRoutes] POST /student/tests/:id/start - Start test attempt (student)');
router.post('/student/tests/:id/start', verifyStudent, InstitutionControllers.startTestAttempt);

console.log('[InstitutionRoutes] POST /student/tests/:id/submit - Submit test attempt (student)');
router.post('/student/tests/:id/submit', verifyStudent, InstitutionControllers.submitTestAttempt);

// Faculty Test Views (faculty-protected)
console.log('[InstitutionRoutes] GET /faculty/tests - List assigned tests (faculty)');
router.get('/faculty/tests', verifyFaculty, InstitutionControllers.listAssignedTestsForFaculty);

console.log('[InstitutionRoutes] GET /faculty/tests/:id/results - Get test results (faculty)');
router.get('/faculty/tests/:id/results', verifyFaculty, InstitutionControllers.getTestResultsForFaculty);

// Institution Announcements (institution-protected)
console.log('[InstitutionRoutes] GET /announcements - List announcements (institution)');
router.get('/announcements', verifyInstitution, InstitutionControllers.listInstitutionAnnouncements);

console.log('[InstitutionRoutes] POST /announcements/:id/read - Mark announcement as read (institution)');
router.post('/announcements/:id/read', verifyInstitution, InstitutionControllers.markAnnouncementAsRead);

console.log('[InstitutionRoutes] POST /announcements - Create announcement (institution)');
router.post('/announcements', verifyInstitution, InstitutionControllers.createInstitutionAnnouncement);

console.log('[InstitutionRoutes] GET /faculty/announcements/list - List announcements for faculty (faculty)');
router.get('/faculty/announcements/list', verifyFaculty, InstitutionControllers.listAnnouncementsForFaculty);

console.log('[InstitutionRoutes] GET /student/announcements - List announcements for student (student)');
router.get('/student/announcements', verifyStudent, InstitutionControllers.listAnnouncementsForStudent);

// Chat between institution and admin
const chatControllers = require('../../controllers/Chat/ChatControllers');
console.log('[InstitutionRoutes] POST /chat - Send chat message (institution)');
router.post('/chat', verifyInstitution, chatControllers.sendMessageByInstitution);

console.log('[InstitutionRoutes] GET /chat - List chat messages (institution)');
router.get('/chat', verifyInstitution, chatControllers.listMessagesForInstitution);

console.log('[InstitutionRoutes] POST /faculty/chat - Send chat message (faculty)');
router.post('/faculty/chat', verifyFaculty, chatControllers.sendMessageByFaculty);

console.log('[InstitutionRoutes] GET /faculty/chat - List chat messages (faculty)');
router.get('/faculty/chat', verifyFaculty, chatControllers.listMessagesForFaculty);

module.exports = router;
