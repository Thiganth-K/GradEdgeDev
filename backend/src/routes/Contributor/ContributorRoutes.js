const express = require('express');
const router = express.Router();
const ContributorControllers = require('../../controllers/Contributor/ContributorControllers');
const verifyContributor = require('../../middleware/verifyContributor');

console.log('[ContributorRoutes] POST /login - Contributor login');
router.post('/login', ContributorControllers.login);

console.log('[ContributorRoutes] GET /dashboard - Contributor dashboard (protected)');
router.get('/dashboard', verifyContributor, ContributorControllers.dashboard);

console.log('[ContributorRoutes] POST /requests - Create contribution request');
router.post('/requests', verifyContributor, ContributorControllers.createRequest);

console.log('[ContributorRoutes] GET /requests - Get my requests');
router.get('/requests', verifyContributor, ContributorControllers.getMyRequests);

console.log('[ContributorRoutes] GET /requests/:id - Get request by ID');
router.get('/requests/:id', verifyContributor, ContributorControllers.getRequestById);

console.log('[ContributorRoutes] GET /contributions - Get my contributed questions');
router.get('/contributions', verifyContributor, ContributorControllers.getMyContributions);

console.log('[ContributorRoutes] POST /contributions - Create a new contributed question');
router.post('/contributions', verifyContributor, ContributorControllers.createQuestion);

console.log('[ContributorRoutes] GET /chat - Get or create chat with admin');
router.get('/chat', verifyContributor, ContributorControllers.getOrCreateChat);

console.log('[ContributorRoutes] POST /chat/message - Send message to admin');
router.post('/chat/message', verifyContributor, ContributorControllers.sendMessage);

console.log('[ContributorRoutes] POST /chat/read - Mark messages as read');
router.post('/chat/read', verifyContributor, ContributorControllers.markMessagesAsRead);

console.log('[ContributorRoutes] GET /chat/unread - Get unread message count');
router.get('/chat/unread', verifyContributor, ContributorControllers.getUnreadCount);

console.log('[ContributorRoutes] GET /library/my-questions - Get my library questions');
router.get('/library/my-questions', verifyContributor, ContributorControllers.getMyLibraryQuestions);

console.log('[ContributorRoutes] GET /library/structure - Get library structure');
router.get('/library/structure', verifyContributor, ContributorControllers.getLibraryStructure);

module.exports = router;
