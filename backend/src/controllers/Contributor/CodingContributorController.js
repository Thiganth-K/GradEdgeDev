const CodingContributor = require('../../models/CodingContributor');
const Library = require('../../models/Library');
const { uploadBuffer, deletePublicId } = require('../../utils/cloudinary');

/**
 * @route   POST /contributor/coding-problems
 * @desc    Create a new coding problem
 * @access  Contributor
 */
const createCodingProblem = async (req, res) => {
  try {
    const payload = req.body || {};

    // Validate required fields
    if (!payload.subTopic) {
      return res.status(400).json({ success: false, message: 'subTopic is required' });
    }
    if (!payload.difficulty) {
      return res.status(400).json({ success: false, message: 'difficulty is required' });
    }
    if (!payload.problemName) {
      return res.status(400).json({ success: false, message: 'problemName is required' });
    }
    if (!payload.problemStatement) {
      return res.status(400).json({ success: false, message: 'problemStatement is required' });
    }

    // Validate difficulty enum
    if (!['Easy', 'Medium', 'Hard'].includes(payload.difficulty)) {
      return res.status(400).json({ 
        success: false, 
        message: 'difficulty must be one of: Easy, Medium, Hard' 
      });
    }

    // Parse JSON fields if they are strings
    if (typeof payload.supportedLanguages === 'string') {
      try { 
        payload.supportedLanguages = JSON.parse(payload.supportedLanguages); 
      } catch (e) { 
        payload.supportedLanguages = []; 
      }
    }
    if (typeof payload.constraints === 'string') {
      try { 
        payload.constraints = JSON.parse(payload.constraints); 
      } catch (e) { 
        payload.constraints = []; 
      }
    }
    if (typeof payload.industrialTestCases === 'string') {
      try { 
        payload.industrialTestCases = JSON.parse(payload.industrialTestCases); 
      } catch (e) { 
        payload.industrialTestCases = []; 
      }
    }
    if (typeof payload.hiddenTestCases === 'string') {
      try { 
        payload.hiddenTestCases = JSON.parse(payload.hiddenTestCases); 
      } catch (e) { 
        payload.hiddenTestCases = []; 
      }
    }

    // Handle image uploads
    payload.imageUrls = payload.imageUrls || [];
    payload.imagePublicIds = payload.imagePublicIds || [];
    if (req.files && req.files.images && Array.isArray(req.files.images)) {
      for (const file of req.files.images) {
        if (file && file.buffer) {
          try {
            const result = await uploadBuffer(file.buffer, 'coding_problems');
            if (result && result.secure_url && result.public_id) {
              payload.imageUrls.push(result.secure_url);
              payload.imagePublicIds.push(result.public_id);
            }
          } catch (err) {
            console.warn('[createCodingProblem] image upload failed:', err.message);
          }
        }
      }
    }

    // Get contributor ID from verified token
    const contributorId = req.contributor && req.contributor.id;
    if (!contributorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Create the coding problem
    const codingProblem = new CodingContributor({
      ...payload,
      createdBy: contributorId,
      status: 'pending' // Always defaults to pending
    });

    await codingProblem.save();

    return res.status(201).json({ 
      success: true, 
      message: 'Coding problem created successfully', 
      data: codingProblem 
    });

  } catch (error) {
    console.error('[createCodingProblem] error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to create coding problem',
      error: error.message 
    });
  }
};

/**
 * @route   GET /contributor/coding-problems
 * @desc    Get all coding problems (Admin only, with filters)
 * @access  Admin
 */
const getAllCodingProblems = async (req, res) => {
  try {
    const { difficulty, status, subTopic, page = 1, limit = 20 } = req.query;

    // Build filter object
    const filter = {};
    if (difficulty) {
      if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid difficulty. Must be Easy, Medium, or Hard' 
        });
      }
      filter.difficulty = difficulty;
    }
    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid status. Must be pending, approved, or rejected' 
        });
      }
      filter.status = status;
    }
    if (subTopic) {
      filter.subTopic = { $regex: subTopic, $options: 'i' }; // Case-insensitive search
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get problems with pagination
    const problems = await CodingContributor.find(filter)
      .populate('createdBy', 'username fname lname email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await CodingContributor.countDocuments(filter);

    return res.status(200).json({ 
      success: true, 
      data: problems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('[getAllCodingProblems] error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch coding problems',
      error: error.message 
    });
  }
};

/**
 * @route   GET /contributor/coding-problems/:id
 * @desc    Get a coding problem by ID
 * @access  Contributor/Admin
 */
const getCodingProblemById = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await CodingContributor.findById(id)
      .populate('createdBy', 'username fname lname email');

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }

    // Check access: only creator or admin can view
    const contributorId = req.contributor && req.contributor.id;
    const isAdmin = req.admin && req.admin.role === 'admin';

    if (!isAdmin && problem.createdBy._id.toString() !== contributorId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only view your own problems' 
      });
    }

    return res.status(200).json({ success: true, data: problem });

  } catch (error) {
    console.error('[getCodingProblemById] error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid problem ID' });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch coding problem',
      error: error.message 
    });
  }
};

/**
 * @route   PUT /contributor/coding-problems/:id
 * @desc    Update a coding problem
 * @access  Creator or Admin
 */
const updateCodingProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    const problem = await CodingContributor.findById(id);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }

    // Check access: only creator or admin can update
    const contributorId = req.contributor && req.contributor.id;
    const isAdmin = req.admin && req.admin.role === 'admin';

    if (!isAdmin && problem.createdBy.toString() !== contributorId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. You can only update your own problems' 
      });
    }

    // Validate difficulty if provided
    if (payload.difficulty && !['Easy', 'Medium', 'Hard'].includes(payload.difficulty)) {
      return res.status(400).json({ 
        success: false, 
        message: 'difficulty must be one of: Easy, Medium, Hard' 
      });
    }

    // Parse JSON fields if they are strings
    if (typeof payload.supportedLanguages === 'string') {
      try { 
        payload.supportedLanguages = JSON.parse(payload.supportedLanguages); 
      } catch (e) { 
        delete payload.supportedLanguages; 
      }
    }
    if (typeof payload.constraints === 'string') {
      try { 
        payload.constraints = JSON.parse(payload.constraints); 
      } catch (e) { 
        delete payload.constraints; 
      }
    }
    if (typeof payload.industrialTestCases === 'string') {
      try { 
        payload.industrialTestCases = JSON.parse(payload.industrialTestCases); 
      } catch (e) { 
        delete payload.industrialTestCases; 
      }
    }
    if (typeof payload.hiddenTestCases === 'string') {
      try { 
        payload.hiddenTestCases = JSON.parse(payload.hiddenTestCases); 
      } catch (e) { 
        delete payload.hiddenTestCases; 
      }
    }

    // Handle new image uploads
    if (req.files && req.files.images && Array.isArray(req.files.images)) {
      payload.imageUrls = problem.imageUrls || [];
      payload.imagePublicIds = problem.imagePublicIds || [];
      for (const file of req.files.images) {
        if (file && file.buffer) {
          try {
            const result = await uploadBuffer(file.buffer, 'coding_problems');
            if (result && result.secure_url && result.public_id) {
              payload.imageUrls.push(result.secure_url);
              payload.imagePublicIds.push(result.public_id);
            }
          } catch (err) {
            console.warn('[updateCodingProblem] image upload failed:', err.message);
          }
        }
      }
    }

    // Prevent changing status directly (use approve/reject endpoints)
    delete payload.status;
    delete payload.createdBy;
    delete payload.createdAt;

    // Update the problem
    Object.assign(problem, payload);
    await problem.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Coding problem updated successfully', 
      data: problem 
    });

  } catch (error) {
    console.error('[updateCodingProblem] error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid problem ID' });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to update coding problem',
      error: error.message 
    });
  }
};

/**
 * @route   DELETE /contributor/coding-problems/:id
 * @desc    Delete a coding problem
 * @access  Admin only
 */
const deleteCodingProblem = async (req, res) => {
  try {
    const { id } = req.params;

    const problem = await CodingContributor.findById(id);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }

    // Delete images from Cloudinary
    const cloudErrors = [];
    if (problem.imagePublicIds && problem.imagePublicIds.length > 0) {
      for (const publicId of problem.imagePublicIds) {
        try {
          await deletePublicId(publicId);
        } catch (err) {
          console.warn('[deleteCodingProblem] failed to delete image:', publicId, err.message);
          cloudErrors.push({ publicId, error: err.message });
        }
      }
    }

    await CodingContributor.findByIdAndDelete(id);

    return res.status(200).json({ 
      success: true, 
      message: 'Coding problem deleted successfully',
      cloudErrors: cloudErrors.length > 0 ? cloudErrors : undefined
    });

  } catch (error) {
    console.error('[deleteCodingProblem] error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid problem ID' });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to delete coding problem',
      error: error.message 
    });
  }
};

/**
 * @route   PATCH /contributor/coding-problems/:id/approve
 * @desc    Approve a coding problem and add to Library
 * @access  Admin only
 */
const approveCodingProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUser = req.admin && req.admin.username;
    
    console.log('[approveCodingProblem] called by', adminUser, 'for', id);

    const problem = await CodingContributor.findById(id);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }

    if (problem.status === 'approved') {
      return res.status(400).json({ 
        success: false, 
        message: 'Coding problem is already approved' 
      });
    }

    // Create library entry from coding question (follows same pattern as MCQ approval)
    const libEntry = await Library.createFromCodingQuestion(problem);

    // Mark coding problem as approved
    problem.status = 'approved';
    problem.rejectionReason = undefined; // Clear rejection reason if any
    await problem.save();

    console.log('[approveCodingProblem] ✓ approved coding problem', id, 'and added to library');

    return res.status(200).json({ 
      success: true, 
      message: 'Coding problem approved and added to library successfully', 
      data: problem,
      libraryEntry: libEntry 
    });

  } catch (error) {
    console.error('[approveCodingProblem] error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid problem ID' });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to approve coding problem',
      error: error.message 
    });
  }
};

/**
 * @route   PATCH /contributor/coding-problems/:id/reject
 * @desc    Reject a coding problem
 * @access  Admin only
 */
const rejectCodingProblem = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUser = req.admin && req.admin.username;
    
    console.log('[rejectCodingProblem] called by', adminUser, 'for', id);

    const problem = await CodingContributor.findById(id);

    if (!problem) {
      return res.status(404).json({ success: false, message: 'Coding problem not found' });
    }

    problem.status = 'rejected';
    if (reason) {
      problem.rejectionReason = reason;
    }
    await problem.save();

    console.log('[rejectCodingProblem] ✓ rejected coding problem', id);

    return res.status(200).json({ 
      success: true, 
      message: 'Coding problem rejected successfully', 
      data: problem 
    });

  } catch (error) {
    console.error('[rejectCodingProblem] error:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ success: false, message: 'Invalid problem ID' });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to reject coding problem',
      error: error.message 
    });
  }
};

/**
 * @route   GET /admin/coding-problems/pending
 * @desc    Get all pending coding problems (Admin only)
 * @access  Admin only
 */
const getPendingCodingProblems = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const { page = 1, limit = 20 } = req.query;
    
    console.log('[getPendingCodingProblems] called by', adminUser);

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const problems = await CodingContributor.find({ status: 'pending' })
      .populate('createdBy', 'username fname lname email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await CodingContributor.countDocuments({ status: 'pending' });

    console.log('[getPendingCodingProblems] ✓ found', problems.length, 'pending coding problems');

    return res.status(200).json({ 
      success: true, 
      data: problems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('[getPendingCodingProblems] error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch pending coding problems',
      error: error.message 
    });
  }
};

/**
 * @route   GET /contributor/coding-problems/my-problems
 * @desc    Get coding problems created by the logged-in contributor
 * @access  Contributor
 */
const getMyCodingProblems = async (req, res) => {
  try {
    const contributorId = req.contributor && req.contributor.id;
    
    if (!contributorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { status, difficulty, page = 1, limit = 20 } = req.query;

    // Build filter
    const filter = { createdBy: contributorId };
    if (status) {
      if (!['pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid status. Must be pending, approved, or rejected' 
        });
      }
      filter.status = status;
    }
    if (difficulty) {
      if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid difficulty. Must be Easy, Medium, or Hard' 
        });
      }
      filter.difficulty = difficulty;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const problems = await CodingContributor.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await CodingContributor.countDocuments(filter);

    return res.status(200).json({ 
      success: true, 
      data: problems,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('[getMyCodingProblems] error:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch your coding problems',
      error: error.message 
    });
  }
};

module.exports = {
  createCodingProblem,
  getAllCodingProblems,
  getCodingProblemById,
  updateCodingProblem,
  deleteCodingProblem,
  approveCodingProblem,
  rejectCodingProblem,
  getMyCodingProblems,
  getPendingCodingProblems
};
