const express = require('express');
const router = express.Router();
const AdminControllers = require('../../controllers/Admin/AdminControllers');

router.post('/login', AdminControllers.login);
router.get('/institutions', AdminControllers.getInstitutions);
router.get('/logs', AdminControllers.getLogs);

module.exports = router;
