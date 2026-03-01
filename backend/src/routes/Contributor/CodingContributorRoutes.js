const express = require('express');
const router = express.Router();
const multer = require('multer');
const CodingContributorController = require('../../controllers/Contributor/CodingContributorController');
const verifyContributor = require('../../middleware/verifyContributor');
const verifyAdmin = require('../../middleware/verifyAdmin');

// Configure multer for image uploads
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per image
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only images are allowed (jpeg, png, webp, gif)'));
    }
  }
});

// Middleware to verify either contributor or admin
const verifyContributorOrAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'missing or invalid authorization header' });
  }

  const token = parts[1];
  const jwt = require('jsonwebtoken');
  
  // Try admin secret first
  const adminSecret = process.env.ADMIN_JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET;
  const contributorSecret = process.env.CONTRIBUTOR_JWT_SECRET || adminSecret;
  
  try {
    const decoded = jwt.verify(token, adminSecret);
    if (decoded && decoded.role === 'admin') {
      req.admin = decoded;
      return next();
    }
  } catch (err) {
    // Not an admin token, try contributor
  }
  
  try {
    const decoded = jwt.verify(token, contributorSecret);
    if (decoded && decoded.role === 'contributor') {
      req.contributor = decoded;
      return next();
    }
  } catch (err) {
    return res.status(401).json({ success: false, message: 'invalid token' });
  }
  
  return res.status(403).json({ success: false, message: 'forbidden' });
};

/**
 * @route   POST /contributor/coding-problems
 * @desc    Create a new coding problem
 * @access  Contributor
 * @fields  multipart/form-data:
 *          - subTopic (string, required)
 *          - difficulty (string, required: Easy|Medium|Hard)
 *          - problemName (string, required)
 *          - problemStatement (string, required)
 *          - images (files, optional, multiple)
 *          - supportedLanguages (JSON string, optional)
 *          - constraints (JSON string, optional)
 *          - sampleInput (string, optional)
 *          - sampleOutput (string, optional)
 *          - industrialTestCases (JSON string, optional)
 *          - hiddenTestCases (JSON string, optional)
 *          - solutionApproach (string, optional)
 */
console.log('[CodingContributorRoutes] POST /contributor/coding-problems - Create coding problem');
router.post(
  '/',
  verifyContributor,
  imageUpload.fields([{ name: 'images', maxCount: 10 }]),
  CodingContributorController.createCodingProblem
);

/**
 * @route   GET /contributor/coding-problems
 * @desc    Get all coding problems (with filters)
 * @access  Admin
 * @query   difficulty (Easy|Medium|Hard)
 *          status (pending|approved|rejected)
 *          subTopic (string)
 *          page (number, default: 1)
 *          limit (number, default: 20)
 */
console.log('[CodingContributorRoutes] GET /contributor/coding-problems - Get all coding problems');
router.get(
  '/',
  verifyAdmin,
  CodingContributorController.getAllCodingProblems
);

/**
 * @route   GET /contributor/coding-problems/my-problems
 * @desc    Get my coding problems
 * @access  Contributor
 * @query   status (pending|approved|rejected)
 *          difficulty (Easy|Medium|Hard)
 *          page (number, default: 1)
 *          limit (number, default: 20)
 */
console.log('[CodingContributorRoutes] GET /contributor/coding-problems/my-problems - Get my coding problems');
router.get(
  '/my-problems',
  verifyContributor,
  CodingContributorController.getMyCodingProblems
);

/**
 * @route   GET /contributor/coding-problems/:id
 * @desc    Get a coding problem by ID
 * @access  Contributor (own problems) or Admin
 */
console.log('[CodingContributorRoutes] GET /contributor/coding-problems/:id - Get coding problem by ID');
router.get(
  '/:id',
  verifyContributorOrAdmin,
  CodingContributorController.getCodingProblemById
);

/**
 * @route   PUT /contributor/coding-problems/:id
 * @desc    Update a coding problem
 * @access  Creator or Admin
 * @fields  Same as POST, all optional
 */
console.log('[CodingContributorRoutes] PUT /contributor/coding-problems/:id - Update coding problem');
router.put(
  '/:id',
  verifyContributorOrAdmin,
  imageUpload.fields([{ name: 'images', maxCount: 10 }]),
  CodingContributorController.updateCodingProblem
);

/**
 * @route   DELETE /contributor/coding-problems/:id
 * @desc    Delete a coding problem
 * @access  Admin only
 */
console.log('[CodingContributorRoutes] DELETE /contributor/coding-problems/:id - Delete coding problem');
router.delete(
  '/:id',
  verifyContributorOrAdmin,
  CodingContributorController.deleteCodingProblem
);

/**
 * @route   PATCH /contributor/coding-problems/:id/approve
 * @desc    Approve a coding problem
 * @access  Admin only
 */
console.log('[CodingContributorRoutes] PATCH /contributor/coding-problems/:id/approve - Approve coding problem');
router.patch(
  '/:id/approve',
  verifyAdmin,
  CodingContributorController.approveCodingProblem
);

/**
 * @route   PATCH /contributor/coding-problems/:id/reject
 * @desc    Reject a coding problem
 * @access  Admin only
 * @body    reason (string, optional)
 */
console.log('[CodingContributorRoutes] PATCH /contributor/coding-problems/:id/reject - Reject coding problem');
router.patch(
  '/:id/reject',
  verifyAdmin,
  CodingContributorController.rejectCodingProblem
);

module.exports = router;
