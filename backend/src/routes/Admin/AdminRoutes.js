const express = require('express');
const router = express.Router();
const AdminControllers = require('../../controllers/Admin/AdminControllers');
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

// Sample data endpoints
console.log('[AdminRoutes] GET /sample-institutions - Get sample institutions');
router.get('/sample-institutions', AdminControllers.getInstitutions);

console.log('[AdminRoutes] GET /logs - Get admin logs');
router.get('/logs', verifyAdmin, AdminControllers.getLogs);

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

module.exports = router;
