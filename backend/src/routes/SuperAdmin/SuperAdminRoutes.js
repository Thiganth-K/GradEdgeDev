const express = require('express');
const router = express.Router();
const SuperAdminControllers = require('../../controllers/SuperAdmin/SuperAdminControllers');
const verifySuperAdmin = require('../../middleware/verifySuperAdmin');

router.post('/login', SuperAdminControllers.login);
router.get('/institutions', SuperAdminControllers.getInstitutions);
router.get('/logs', SuperAdminControllers.getLogs);
// Admin management CRUD (protected)
router.get('/admins', verifySuperAdmin, SuperAdminControllers.listAdmins);
router.post('/admins', verifySuperAdmin, SuperAdminControllers.createAdmin);
router.put('/admins/:id', verifySuperAdmin, SuperAdminControllers.updateAdmin);
router.delete('/admins/:id', verifySuperAdmin, SuperAdminControllers.deleteAdmin);

module.exports = router;
