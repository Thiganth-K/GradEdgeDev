const express = require('express');
const router = express.Router();
const SuperAdminControllers = require('../../controllers/SuperAdmin/SuperAdminControllers');
const verifySuperAdmin = require('../../middleware/verifySuperAdmin');

// Authentication
console.log('[SuperAdminRoutes] POST /login - SuperAdmin login');
router.post('/login', SuperAdminControllers.login);

// Sample data endpoints
console.log('[SuperAdminRoutes] GET /institutions - Get sample institutions');
router.get('/institutions', SuperAdminControllers.getInstitutions);

console.log('[SuperAdminRoutes] GET /logs - Get system logs');
router.get('/logs', SuperAdminControllers.getLogs);

// Admin management CRUD (no auth)
console.log('[SuperAdminRoutes] GET /admins - List all admins (superadmin)');
router.get('/admins', SuperAdminControllers.listAdmins);

console.log('[SuperAdminRoutes] POST /admins - Create admin (superadmin)');
router.post('/admins', SuperAdminControllers.createAdmin);

console.log('[SuperAdminRoutes] PUT /admins/:id - Update admin (superadmin)');
router.put('/admins/:id', SuperAdminControllers.updateAdmin);

console.log('[SuperAdminRoutes] DELETE /admins/:id - Delete admin (superadmin)');
router.delete('/admins/:id', SuperAdminControllers.deleteAdmin);

module.exports = router;
