const express = require('express');
const router = express.Router();
const AdminControllers = require('../../controllers/Admin/AdminControllers');
const verifyAdmin = require('../../middleware/verifyAdmin');

router.post('/login', AdminControllers.login);
// institution management (admin-protected)
router.get('/institutions', verifyAdmin, AdminControllers.listInstitutions);
router.post('/institutions', verifyAdmin, AdminControllers.createInstitution);
router.put('/institutions/:id', verifyAdmin, AdminControllers.updateInstitution);
router.delete('/institutions/:id', verifyAdmin, AdminControllers.deleteInstitution);

router.get('/sample-institutions', AdminControllers.getInstitutions);
router.get('/logs', verifyAdmin, AdminControllers.getLogs);

module.exports = router;
