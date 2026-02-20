const express = require('express');
const router = express.Router();
const AdminControllers = require('../../controllers/Admin/AdminControllers');
const AdminLogController = require('../../controllers/Admin/AdminLogController');
const verifyAdmin = require('../../middleware/verifyAdmin');

// Authentication
console.log('[AdminRoutes] POST /login - Admin login');
router.post('/login', AdminControllers.login);

// Institution management (admin-protected)
console.log('[AdminRoutes] GET /institutions - List institutions (admin)');
router.get('/institutions', verifyAdmin, AdminControllers.listInstitutions);

console.log('[AdminRoutes] POST /institutions - Create institution (admin)');
router.post('/institutions', verifyAdmin, AdminControllers.createInstitution);

console.log('[AdminRoutes] PUT /institutions/:id - Update institution (admin)');
router.put('/institutions/:id', verifyAdmin, AdminControllers.updateInstitution);

console.log('[AdminRoutes] DELETE /institutions/:id - Delete institution (admin)');
router.delete('/institutions/:id', verifyAdmin, AdminControllers.deleteInstitution);

console.log('[AdminRoutes] GET /institution/:id/batches - Get institution batches (admin)');
router.get('/institution/:id/batches', verifyAdmin, AdminControllers.getInstitutionBatches);

// Sample data endpoints
console.log('[AdminRoutes] GET /sample-institutions - Get sample institutions');
router.get('/sample-institutions', AdminControllers.getInstitutions);

console.log('[AdminRoutes] GET /logs - Get admin logs');
router.get('/logs', verifyAdmin, AdminLogController.getLogs);

console.log('[AdminRoutes] POST /logs/clear - Archive and clear admin logs');
router.post('/logs/clear', verifyAdmin, AdminLogController.clearLogs);

console.log('[AdminRoutes] POST /contributors - Create contributor (admin)');
router.post('/contributors', verifyAdmin, AdminControllers.createContributor);

console.log('[AdminRoutes] GET /contributors - List contributors (admin)');
router.get('/contributors', verifyAdmin, AdminControllers.listContributors);

console.log('[AdminRoutes] GET /contributors/:id - Get contributor (admin)');
router.get('/contributors/:id', verifyAdmin, AdminControllers.getContributor);

console.log('[AdminRoutes] PUT /contributors/:id - Update contributor (admin)');
router.put('/contributors/:id', verifyAdmin, AdminControllers.updateContributor);

console.log('[AdminRoutes] DELETE /contributors/:id - Delete contributor (admin)');
router.delete('/contributors/:id', verifyAdmin, AdminControllers.deleteContributor);

// Chat endpoints for admin to view/send messages to an institution
const chatControllers = require('../../controllers/Chat/ChatControllers');
console.log('[AdminRoutes] GET /institution/:id/chat - List chat messages for institution (admin)');
router.get('/institution/:id/chat', verifyAdmin, chatControllers.listMessagesForAdminByInstitution);

console.log('[AdminRoutes] POST /institution/:id/chat - Send chat message to institution (admin)');
router.post('/institution/:id/chat', verifyAdmin, chatControllers.sendMessageByAdmin);

// Admin-Institution private chat (separate collection)
const adminInstChat = require('../../controllers/Chat/AdminInstitutionChatControllers');
console.log('[AdminRoutes] GET /institution/:id/admin-chat - List admin-chat (admin)');
router.get('/institution/:id/admin-chat', verifyAdmin, adminInstChat.listForAdminByInstitution);

console.log('[AdminRoutes] POST /institution/:id/admin-chat - Send admin-chat message (admin)');
router.post('/institution/:id/admin-chat', verifyAdmin, adminInstChat.sendByAdmin);

// Announcements (admin-protected)
console.log('[AdminRoutes] POST /announcements - Create announcement (admin)');
router.post('/announcements', verifyAdmin, AdminControllers.createAnnouncement);

console.log('[AdminRoutes] GET /announcements - List announcements (admin)');
router.get('/announcements', verifyAdmin, AdminControllers.listAnnouncements);

// Contributor Request Management
console.log('[AdminRoutes] GET /contributor-requests - List all contributor requests (admin)');
router.get('/contributor-requests', verifyAdmin, AdminControllers.listContributorRequests);

console.log('[AdminRoutes] GET /contributor-requests/:id - Get contributor request by ID (admin)');
router.get('/contributor-requests/:id', verifyAdmin, AdminControllers.getContributorRequest);

console.log('[AdminRoutes] PUT /contributor-requests/:id/status - Update request status (admin)');
router.put('/contributor-requests/:id/status', verifyAdmin, AdminControllers.updateContributorRequestStatus);

// Admin-Contributor Chat
console.log('[AdminRoutes] GET /contributor-chats - List all contributor chats (admin)');
router.get('/contributor-chats', verifyAdmin, AdminControllers.listContributorChats);

console.log('[AdminRoutes] GET /contributor-chats/:contributorId - Get chat with contributor (admin)');
router.get('/contributor-chats/:contributorId', verifyAdmin, AdminControllers.getContributorChat);

console.log('[AdminRoutes] POST /contributor-chats/:contributorId/message - Send message to contributor (admin)');
router.post('/contributor-chats/:contributorId/message', verifyAdmin, AdminControllers.sendMessageToContributor);

console.log('[AdminRoutes] POST /contributor-chats/:contributorId/read - Mark messages as read (admin)');
router.post('/contributor-chats/:contributorId/read', verifyAdmin, AdminControllers.markContributorMessagesAsRead);

console.log('[AdminRoutes] GET /contributor-chats/unread/count - Get unread messages count (admin)');
router.get('/contributor-chats/unread/count', verifyAdmin, AdminControllers.getUnreadMessagesCount);

// Admin <-> SuperAdmin chat
const superAdminChat = require('../../controllers/Chat/SuperadminAdminChatControllers');
console.log('[AdminRoutes] GET /superadmin-chats - List all superadmin chats (admin)');
router.get('/superadmin-chats', verifyAdmin, superAdminChat.listForAdmin);

console.log('[AdminRoutes] GET /superadmin-chats/:superadminName - Get chat with superadmin (admin)');
router.get('/superadmin-chats/:superadminName', verifyAdmin, superAdminChat.getChatWithSuperadmin);

console.log('[AdminRoutes] POST /superadmin-chats/:superadminName/message - Send message to superadmin (admin)');
router.post('/superadmin-chats/:superadminName/message', verifyAdmin, superAdminChat.sendMessageToSuperadmin);

console.log('[AdminRoutes] POST /superadmin-chats/:superadminName/read - Mark superadmin messages as read (admin)');
router.post('/superadmin-chats/:superadminName/read', verifyAdmin, superAdminChat.markSuperadminMessagesRead);

console.log('[AdminRoutes] GET /superadmin-chats/unread/count - Get unread counts for superadmin chats');
router.get('/superadmin-chats/unread/count', verifyAdmin, superAdminChat.getUnreadMessagesCount);

// Library Management
console.log('[AdminRoutes] GET /library/questions-by-contributor - Get library questions grouped by contributor (admin)');
router.get('/library/questions-by-contributor', verifyAdmin, AdminControllers.getLibraryQuestionsByContributor);

console.log('[AdminRoutes] GET /library/contributor/:contributorId - Get library questions by contributor ID (admin)');
router.get('/library/contributor/:contributorId', verifyAdmin, AdminControllers.getLibraryQuestionsByContributorId);

console.log('[AdminRoutes] POST /library/questions/:questionId - Add question to library (admin)');
router.post('/library/questions/:questionId', verifyAdmin, AdminControllers.addQuestionToLibrary);

console.log('[AdminRoutes] DELETE /library/questions/:questionId - Remove question from library (admin)');
router.delete('/library/questions/:questionId', verifyAdmin, AdminControllers.removeQuestionFromLibrary);

console.log('[AdminRoutes] GET /library/structure - Get library structure (admin)');
router.get('/library/structure', verifyAdmin, AdminControllers.getLibraryStructure);

// Contributor question review
console.log('[AdminRoutes] GET /contributor-questions/pending - List pending contributor questions (admin)');
router.get('/contributor-questions/pending', verifyAdmin, AdminControllers.listPendingContributorQuestions);

console.log('[AdminRoutes] PUT /contributor-questions/:id/approve - Approve a contributor question (admin)');
router.put('/contributor-questions/:id/approve', verifyAdmin, AdminControllers.approveContributorQuestion);

console.log('[AdminRoutes] PUT /contributor-questions/:id/reject - Reject a contributor question (admin)');
router.put('/contributor-questions/:id/reject', verifyAdmin, AdminControllers.rejectContributorQuestion);

module.exports = router;
