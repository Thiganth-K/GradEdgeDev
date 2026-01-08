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

module.exports = router;
