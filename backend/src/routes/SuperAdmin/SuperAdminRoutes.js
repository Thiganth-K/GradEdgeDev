const express = require('express');
const router = express.Router();
const SuperAdminControllers = require('../../controllers/SuperAdmin/SuperAdminControllers');
const verifySuperAdmin = require('../../middleware/verifySuperAdmin');
const superAdminChat = require('../../controllers/Chat/SuperadminAdminChatControllers');

// Authentication
console.log('[SuperAdminRoutes] POST /login - SuperAdmin login');
router.post('/login', SuperAdminControllers.login);

// Sample data endpoints
console.log('[SuperAdminRoutes] GET /institutions - Get sample institutions');
router.get('/institutions', SuperAdminControllers.getInstitutions);

console.log('[SuperAdminRoutes] GET /logs - Get system logs');
router.get('/logs', SuperAdminControllers.getLogs);

console.log('[SuperAdminRoutes] GET /dashboard-stats - Get dashboard statistics');
router.get('/dashboard-stats', SuperAdminControllers.getDashboardStats);

// Admin management CRUD (no auth)
console.log('[SuperAdminRoutes] GET /admins - List all admins (superadmin)');
router.get('/admins', SuperAdminControllers.listAdmins);

console.log('[SuperAdminRoutes] POST /admins - Create admin (superadmin)');
router.post('/admins', SuperAdminControllers.createAdmin);

console.log('[SuperAdminRoutes] PUT /admins/:id - Update admin (superadmin)');
router.put('/admins/:id', SuperAdminControllers.updateAdmin);

console.log('[SuperAdminRoutes] DELETE /admins/:id - Delete admin (superadmin)');
router.delete('/admins/:id', SuperAdminControllers.deleteAdmin);

console.log('[SuperAdminRoutes] GET /system-vitals - Get system vitals');
router.get('/system-vitals', SuperAdminControllers.getSystemVitals);

console.log('[SuperAdminRoutes] GET /me - Get superadmin profile');
router.get('/me', verifySuperAdmin, SuperAdminControllers.getProfile);

// SuperAdmin <-> Admin chat
console.log('[SuperAdminRoutes] GET /admin-chats - List admin chats (superadmin)');
router.get('/admin-chats', verifySuperAdmin, superAdminChat.listForSuperAdmin);

console.log('[SuperAdminRoutes] GET /admin-chats/:adminId - Get chat with admin (superadmin)');
router.get('/admin-chats/:adminId', verifySuperAdmin, superAdminChat.getChatWithAdmin);

console.log('[SuperAdminRoutes] POST /admin-chats/:adminId/message - Send message to admin (superadmin)');
router.post('/admin-chats/:adminId/message', verifySuperAdmin, superAdminChat.sendMessageToAdmin);

console.log('[SuperAdminRoutes] POST /admin-chats/:adminId/read - Mark admin messages as read (superadmin)');
router.post('/admin-chats/:adminId/read', verifySuperAdmin, superAdminChat.markAdminMessagesRead);

console.log('[SuperAdminRoutes] GET /admin-chats/unread/count - Get unread counts for admin chats');
router.get('/admin-chats/unread/count', verifySuperAdmin, superAdminChat.getUnreadMessagesCount);

module.exports = router;
