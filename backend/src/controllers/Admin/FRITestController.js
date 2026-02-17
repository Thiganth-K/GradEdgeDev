const FRITest = require('../../models/FRITest');
const Question = require('../../models/Question');
const Institution = require('../../models/Institution');
const { createLog } = require('./AdminLogController');

/**
 * Create a new FRI Test
 * Admin sets question distribution percentages and availability window
 */
const createFRITest = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const adminUsername = req.admin?.username;

    console.log('[Admin.createFRITest] called by admin:', adminUsername);

    const {
      name,
      description,
      aptitudePercentage,
      technicalPercentage,
      psychometricPercentage,
      totalQuestions,
      testDurationMinutes,
      availableFrom,
      availableTo,
      targetInstitutions,
      easyPercentage,
      mediumPercentage,
      hardPercentage,
      shuffleQuestions,
      showResultsImmediately,
      allowReview
    } = req.body;

    // Validation
    if (!name || !totalQuestions || !testDurationMinutes || !availableFrom || !availableTo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate percentages
    const totalCategoryPercentage = (aptitudePercentage || 0) + (technicalPercentage || 0) + (psychometricPercentage || 0);
    if (totalCategoryPercentage !== 100) {
      return res.status(400).json({ error: 'Category percentages must add up to 100' });
    }

    const totalDifficultyPercentage = (easyPercentage || 33) + (mediumPercentage || 34) + (hardPercentage || 33);
    if (totalDifficultyPercentage !== 100) {
      return res.status(400).json({ error: 'Difficulty percentages must add up to 100' });
    }

    // Validate dates
    const fromDate = new Date(availableFrom);
    const toDate = new Date(availableTo);
    if (fromDate >= toDate) {
      return res.status(400).json({ error: 'availableFrom must be before availableTo' });
    }

    // Verify question availability
    const aptitudeCount = Math.round((aptitudePercentage / 100) * totalQuestions);
    const technicalCount = Math.round((technicalPercentage / 100) * totalQuestions);
    const psychometricCount = Math.round((psychometricPercentage / 100) * totalQuestions);

    // Check if enough questions exist in each category
    const aptitudeQuestionsCount = await Question.countDocuments({ category: 'aptitude', inLibrary: true });
    const technicalQuestionsCount = await Question.countDocuments({ category: 'technical', inLibrary: true });
    const psychometricQuestionsCount = await Question.countDocuments({ category: 'psychometric', inLibrary: true });

    if (aptitudeCount > aptitudeQuestionsCount) {
      return res.status(400).json({ 
        error: `Not enough aptitude questions. Required: ${aptitudeCount}, Available: ${aptitudeQuestionsCount}` 
      });
    }
    if (technicalCount > technicalQuestionsCount) {
      return res.status(400).json({ 
        error: `Not enough technical questions. Required: ${technicalCount}, Available: ${technicalQuestionsCount}` 
      });
    }
    if (psychometricCount > psychometricQuestionsCount) {
      return res.status(400).json({ 
        error: `Not enough psychometric questions. Required: ${psychometricCount}, Available: ${psychometricQuestionsCount}` 
      });
    }

    // Create FRI Test
    const friTest = new FRITest({
      name,
      description,
      aptitudePercentage: aptitudePercentage || 0,
      technicalPercentage: technicalPercentage || 0,
      psychometricPercentage: psychometricPercentage || 0,
      totalQuestions,
      testDurationMinutes,
      availableFrom: fromDate,
      availableTo: toDate,
      targetInstitutions: targetInstitutions || [],
      easyPercentage: easyPercentage || 33,
      mediumPercentage: mediumPercentage || 34,
      hardPercentage: hardPercentage || 33,
      shuffleQuestions: shuffleQuestions !== false,
      showResultsImmediately: showResultsImmediately || false,
      allowReview: allowReview || false,
      createdBy: adminId,
      createdByUsername: adminUsername,
      status: 'active'
    });

    await friTest.save();

    // Log action
    await createLog({
      actorId: adminId,
      actorUsername: adminUsername,
      role: 'admin',
      actionType: 'create',
      message: `Created FRI Test: ${name}`,
      refs: { entity: 'FRITest', id: friTest._id }
    });

    console.log('[Admin.createFRITest] FRI Test created:', friTest._id);
    return res.status(201).json({ 
      message: 'FRI Test created successfully', 
      friTest 
    });

  } catch (err) {
    console.error('[Admin.createFRITest] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * List all FRI Tests created by admin
 */
const listFRITests = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const adminUsername = req.admin?.username;

    console.log('[Admin.listFRITests] called by admin:', adminUsername);

    const { status, includeExpired } = req.query;

    let query = { createdBy: adminId };
    
    if (status) {
      query.status = status;
    }

    // Exclude expired tests unless explicitly requested
    if (!includeExpired) {
      const now = new Date();
      query.availableTo = { $gte: now };
    }

    const friTests = await FRITest.find(query)
      .populate('targetInstitutions', 'name institutionId')
      .sort({ createdAt: -1 });

    return res.json({ friTests });

  } catch (err) {
    console.error('[Admin.listFRITests] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get a specific FRI Test
 */
const getFRITest = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const { id } = req.params;

    console.log('[Admin.getFRITest] called by admin, FRI test id:', id);

    const friTest = await FRITest.findOne({ _id: id, createdBy: adminId })
      .populate('targetInstitutions', 'name institutionId location');

    if (!friTest) {
      return res.status(404).json({ error: 'FRI Test not found' });
    }

    return res.json({ friTest });

  } catch (err) {
    console.error('[Admin.getFRITest] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Update an FRI Test
 */
const updateFRITest = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const adminUsername = req.admin?.username;
    const { id } = req.params;

    console.log('[Admin.updateFRITest] called by admin:', adminUsername, 'for FRI test:', id);

    const friTest = await FRITest.findOne({ _id: id, createdBy: adminId });
    if (!friTest) {
      return res.status(404).json({ error: 'FRI Test not found' });
    }

    const {
      name,
      description,
      aptitudePercentage,
      technicalPercentage,
      psychometricPercentage,
      totalQuestions,
      testDurationMinutes,
      availableFrom,
      availableTo,
      targetInstitutions,
      easyPercentage,
      mediumPercentage,
      hardPercentage,
      shuffleQuestions,
      showResultsImmediately,
      allowReview,
      status
    } = req.body;

    // Update fields if provided
    if (name !== undefined) friTest.name = name;
    if (description !== undefined) friTest.description = description;
    if (aptitudePercentage !== undefined) friTest.aptitudePercentage = aptitudePercentage;
    if (technicalPercentage !== undefined) friTest.technicalPercentage = technicalPercentage;
    if (psychometricPercentage !== undefined) friTest.psychometricPercentage = psychometricPercentage;
    if (totalQuestions !== undefined) friTest.totalQuestions = totalQuestions;
    if (testDurationMinutes !== undefined) friTest.testDurationMinutes = testDurationMinutes;
    if (availableFrom !== undefined) friTest.availableFrom = new Date(availableFrom);
    if (availableTo !== undefined) friTest.availableTo = new Date(availableTo);
    if (targetInstitutions !== undefined) friTest.targetInstitutions = targetInstitutions;
    if (easyPercentage !== undefined) friTest.easyPercentage = easyPercentage;
    if (mediumPercentage !== undefined) friTest.mediumPercentage = mediumPercentage;
    if (hardPercentage !== undefined) friTest.hardPercentage = hardPercentage;
    if (shuffleQuestions !== undefined) friTest.shuffleQuestions = shuffleQuestions;
    if (showResultsImmediately !== undefined) friTest.showResultsImmediately = showResultsImmediately;
    if (allowReview !== undefined) friTest.allowReview = allowReview;
    if (status !== undefined) friTest.status = status;

    await friTest.save();

    // Log action
    await createLog({
      actorId: adminId,
      actorUsername: adminUsername,
      role: 'admin',
      actionType: 'edit',
      message: `Updated FRI Test: ${friTest.name}`,
      refs: { entity: 'FRITest', id: friTest._id }
    });

    console.log('[Admin.updateFRITest] FRI Test updated:', friTest._id);
    return res.json({ message: 'FRI Test updated successfully', friTest });

  } catch (err) {
    console.error('[Admin.updateFRITest] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Delete an FRI Test
 */
const deleteFRITest = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const adminUsername = req.admin?.username;
    const { id } = req.params;

    console.log('[Admin.deleteFRITest] called by admin:', adminUsername, 'for FRI test:', id);

    const friTest = await FRITest.findOne({ _id: id, createdBy: adminId });
    if (!friTest) {
      return res.status(404).json({ error: 'FRI Test not found' });
    }

    // Archive instead of delete
    friTest.status = 'archived';
    await friTest.save();

    // Log action
    await createLog({
      actorId: adminId,
      actorUsername: adminUsername,
      role: 'admin',
      actionType: 'delete',
      message: `Archived FRI Test: ${friTest.name}`,
      refs: { entity: 'FRITest', id: friTest._id }
    });

    console.log('[Admin.deleteFRITest] FRI Test archived:', friTest._id);
    return res.json({ message: 'FRI Test archived successfully' });

  } catch (err) {
    console.error('[Admin.deleteFRITest] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get FRI Test statistics
 */
const getFRITestStats = async (req, res) => {
  try {
    const adminId = req.admin?.id;
    const { id } = req.params;

    console.log('[Admin.getFRITestStats] called for FRI test:', id);

    const friTest = await FRITest.findOne({ _id: id, createdBy: adminId });
    if (!friTest) {
      return res.status(404).json({ error: 'FRI Test not found' });
    }

    const FRITestSchedule = require('../../models/FRITestSchedule');

    // Get all schedules for this FRI test
    const schedules = await FRITestSchedule.find({ friTestId: id })
      .populate('institutionId', 'name institutionId')
      .populate('assignedFaculty', 'username');

    const stats = {
      totalInstitutionsScheduled: schedules.length,
      totalStudentsAssigned: schedules.reduce((sum, s) => sum + (s.totalAssignedStudents || 0), 0),
      totalCompleted: schedules.reduce((sum, s) => sum + (s.totalCompleted || 0), 0),
      schedules: schedules.map(s => ({
        institution: s.institutionId?.name,
        scheduledDate: s.scheduledDate,
        status: s.status,
        assignedStudents: s.totalAssignedStudents,
        completed: s.totalCompleted
      }))
    };

    return res.json({ stats });

  } catch (err) {
    console.error('[Admin.getFRITestStats] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = {
  createFRITest,
  listFRITests,
  getFRITest,
  updateFRITest,
  deleteFRITest,
  getFRITestStats
};
