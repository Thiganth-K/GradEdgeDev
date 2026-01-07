const express = require('express');
const router = express.Router();
const InstitutionControllers = require('../../controllers/Institution/InstitutionControllers');

router.post('/login', InstitutionControllers.login);
router.get('/welcome', InstitutionControllers.welcome);

module.exports = router;
