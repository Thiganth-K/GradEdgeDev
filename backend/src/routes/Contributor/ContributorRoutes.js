const express = require('express');
const router = express.Router();
const ContributorControllers = require('../../controllers/Contributor/ContributorControllers');
const verifyContributor = require('../../middleware/verifyContributor');

console.log('[ContributorRoutes] POST /login - Contributor login');
router.post('/login', ContributorControllers.login);

console.log('[ContributorRoutes] GET /dashboard - Contributor dashboard (protected)');
router.get('/dashboard', verifyContributor, ContributorControllers.dashboard);

module.exports = router;
