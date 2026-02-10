const express = require('express');
const router = express.Router();
const multer = require('multer');
const ContributorControllers = require('../../controllers/Contributor/ContributorControllers');
const BulkQuestionControllers = require('../../controllers/Contributor/BulkQuestionControllers');
const ContributorQuestionControllers = require('../../controllers/Contributor/ContributorQuestionControllers');
const verifyContributor = require('../../middleware/verifyContributor');

// Configure multer for file upload (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only Excel files
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls, .csv) are allowed'));
    }
  }
});

// image upload for contributor question images (memory storage)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only images are allowed (jpeg, png, webp, gif)'));
  }
});

console.log('[ContributorRoutes] POST /login - Contributor login');
router.post('/login', ContributorControllers.login);

console.log('[ContributorRoutes] GET /dashboard - Contributor dashboard (protected)');
router.get('/dashboard', verifyContributor, ContributorControllers.dashboard);

console.log('[ContributorRoutes] POST /requests - Create contribution request');
router.post('/requests', verifyContributor, ContributorControllers.createRequest);

console.log('[ContributorRoutes] GET /requests - Get my requests');
router.get('/requests', verifyContributor, ContributorControllers.getMyRequests);

console.log('[ContributorRoutes] GET /requests/:id - Get request by ID');
router.get('/requests/:id', verifyContributor, ContributorControllers.getRequestById);

console.log('[ContributorRoutes] GET /contributions - Get my contributed questions');
router.get('/contributions', verifyContributor, ContributorQuestionControllers.listQuestions);

console.log('[ContributorRoutes] POST /contributions - Create a new contributed question');
// Expected form fields (multipart/form-data):
// - subTopic (string) [required]
// - difficulty (string) [required]
// - question (string) [required]
// - image (file) -> single question image
// - options (JSON string) -> array of { text?, isCorrect, imageUrl? }
// - solutions (JSON string) -> array of { explanation?, imageUrl? }
// - optionImages (files) -> optional files; send `optionImageOptionIndex` (JSON array) to map files to option indexes
// - solutionImages (files) -> optional files; send `solutionImageSolutionIndex` (JSON array) to map files to solution indexes
// Note: `image` is limited to 1 file now to match new backend model.
router.post('/contributions', verifyContributor, imageUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'optionImages', maxCount: 20 }, { name: 'solutionImages', maxCount: 20 }]), ContributorQuestionControllers.createQuestion);

console.log('[ContributorRoutes] GET /contributions/:id - Get contributed question by id');
router.get('/contributions/:id', verifyContributor, ContributorQuestionControllers.getQuestion);

console.log('[ContributorRoutes] PUT /contributions/:id - Update contributed question');
// Same fields as create. `image` is single-file replacement; `optionImages` and `solutionImages` may map to indexes via their respective mapping arrays.
router.put('/contributions/:id', verifyContributor, imageUpload.fields([{ name: 'image', maxCount: 1 }, { name: 'optionImages', maxCount: 20 }, { name: 'solutionImages', maxCount: 20 }]), ContributorQuestionControllers.updateQuestion);

console.log('[ContributorRoutes] DELETE /contributions/:id - Delete contributed question');
router.delete('/contributions/:id', verifyContributor, ContributorQuestionControllers.deleteQuestion);

console.log('[ContributorRoutes] GET /chat - Get or create chat with admin');
router.get('/chat', verifyContributor, ContributorControllers.getOrCreateChat);

console.log('[ContributorRoutes] POST /chat/message - Send message to admin');
router.post('/chat/message', verifyContributor, ContributorControllers.sendMessage);

console.log('[ContributorRoutes] POST /chat/read - Mark messages as read');
router.post('/chat/read', verifyContributor, ContributorControllers.markMessagesAsRead);

console.log('[ContributorRoutes] GET /chat/unread - Get unread message count');
router.get('/chat/unread', verifyContributor, ContributorControllers.getUnreadCount);

console.log('[ContributorRoutes] GET /library/my-questions - Get my library questions');
router.get('/library/my-questions', verifyContributor, ContributorControllers.getMyLibraryQuestions);

console.log('[ContributorRoutes] GET /library/structure - Get library structure');
router.get('/library/structure', verifyContributor, ContributorControllers.getLibraryStructure);

console.log('[ContributorRoutes] GET /bulk/template - Download bulk question template');
router.get('/bulk/template', verifyContributor, BulkQuestionControllers.generateTemplate);

console.log('[ContributorRoutes] POST /bulk/parse - Parse uploaded bulk question file');
router.post('/bulk/parse', verifyContributor, upload.single('file'), BulkQuestionControllers.parseUploadedFile);

module.exports = router;
