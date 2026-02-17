const FRITest = require('../../models/FRITest');
const FRITestSchedule = require('../../models/FRITestSchedule');
const Question = require('../../models/Question');
const Batch = require('../../models/Batch');
const Student = require('../../models/Student');
const { createLog } = require('../Admin/AdminLogController');

/**
 * List available FRI Tests for the institution
 * Shows tests within the availability window and targeted to this institution
 */
const listAvailableFRITests = async (req, res) => {
  try {
    const institutionId = req.institution?.id;
    const institutionName = req.institution?.name;

    console.log('[Institution.listAvailableFRITests] called by institution:', institutionName);

    const now = new Date();

    // Find active FRI tests that are:
    // 1. Currently within availability window
    // 2. Either targeted to all institutions or specifically to this institution
    const friTests = await FRITest.find({
      status: 'active',
      availableFrom: { $lte: now },
      availableTo: { $gte: now },
      $or: [
        { targetInstitutions: { $size: 0 } }, // No specific targets = all institutions
        { targetInstitutions: institutionId }
      ]
    }).sort({ createdAt: -1 });

    // Check which tests have already been scheduled by this institution
    const scheduledTestIds = await FRITestSchedule.find({
      institutionId,
      status: { $in: ['scheduled', 'active', 'completed'] }
    }).distinct('friTestId');

    const testsWithScheduleStatus = friTests.map(test => ({
      ...test.toObject(),
      isScheduled: scheduledTestIds.some(id => id.toString() === test._id.toString())
    }));

    return res.json({ friTests: testsWithScheduleStatus });

  } catch (err) {
    console.error('[Institution.listAvailableFRITests] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get details of a specific FRI Test
 */
const getFRITestDetails = async (req, res) => {
  try {
    const institutionId = req.institution?.id;
    const { id } = req.params;

    console.log('[Institution.getFRITestDetails] called for FRI test:', id);

    const now = new Date();

    const friTest = await FRITest.findOne({
      _id: id,
      status: 'active',
      availableFrom: { $lte: now },
      availableTo: { $gte: now },
      $or: [
        { targetInstitutions: { $size: 0 } },
        { targetInstitutions: institutionId }
      ]
    });

    if (!friTest) {
      return res.status(404).json({ error: 'FRI Test not found or not available' });
    }

    // Check if already scheduled
    const existingSchedule = await FRITestSchedule.findOne({
      friTestId: id,
      institutionId,
      status: { $in: ['scheduled', 'active', 'completed'] }
    });

    return res.json({ 
      friTest,
      isScheduled: !!existingSchedule,
      schedule: existingSchedule 
    });

  } catch (err) {
    console.error('[Institution.getFRITestDetails] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Schedule an FRI Test
 * Institution selects date, faculty, and students to conduct the test
 */
const scheduleFRITest = async (req, res) => {
  try {
    const institutionId = req.institution?.id;
    const institutionName = req.institution?.name;
    const { id } = req.params;

    console.log('[Institution.scheduleFRITest] called by institution:', institutionName, 'for FRI test:', id);

    const {
      scheduledDate,
      scheduledEndDate,
      assignedFaculty,
      assignedStudents,
      assignedBatches,
      instructions
    } = req.body;

    if (!scheduledDate) {
      return res.status(400).json({ error: 'Scheduled date is required' });
    }

    // Verify FRI Test exists and is available
    const now = new Date();
    const friTest = await FRITest.findOne({
      _id: id,
      status: 'active',
      availableFrom: { $lte: now },
      availableTo: { $gte: now },
      $or: [
        { targetInstitutions: { $size: 0 } },
        { targetInstitutions: institutionId }
      ]
    });

    if (!friTest) {
      return res.status(404).json({ error: 'FRI Test not found or not available' });
    }

    // Check if already scheduled
    const existingSchedule = await FRITestSchedule.findOne({
      friTestId: id,
      institutionId,
      status: { $in: ['scheduled', 'active', 'completed'] }
    });

    if (existingSchedule) {
      return res.status(400).json({ error: 'FRI Test already scheduled for this institution' });
    }

    // Validate scheduled date is within availability window
    const schedDate = new Date(scheduledDate);
    if (schedDate < friTest.availableFrom || schedDate > friTest.availableTo) {
      return res.status(400).json({ 
        error: 'Scheduled date must be within the FRI Test availability window' 
      });
    }

    // Get faculty details if assigned
    let facultyUsername = null;
    if (assignedFaculty) {
      const Faculty = require('../../models/Faculty');
      const faculty = await Faculty.findOne({ _id: assignedFaculty, createdBy: institutionId });
      if (faculty) {
        facultyUsername = faculty.username;
      }
    }

    // Collect all student IDs
    let allStudentIds = [...(assignedStudents || [])];
    
    if (assignedBatches && assignedBatches.length > 0) {
      const batches = await Batch.find({ 
        _id: { $in: assignedBatches },
        createdBy: institutionId 
      });
      
      for (const batch of batches) {
        allStudentIds.push(...batch.students);
      }
    }

    // Remove duplicates
    allStudentIds = [...new Set(allStudentIds.map(id => id.toString()))];

    // Generate questions based on FRI test criteria
    const generatedQuestions = await generateQuestionsForFRITest(friTest);

    if (generatedQuestions.length < friTest.totalQuestions) {
      return res.status(400).json({ 
        error: 'Not enough questions available to generate the test. Please contact administrator.' 
      });
    }

    // Create schedule
    const schedule = new FRITestSchedule({
      friTestId: id,
      institutionId,
      institutionName,
      scheduledDate: schedDate,
      scheduledEndDate: scheduledEndDate ? new Date(scheduledEndDate) : null,
      assignedFaculty: assignedFaculty || null,
      assignedFacultyUsername: facultyUsername,
      assignedStudents: allStudentIds,
      assignedBatches: assignedBatches || [],
      generatedQuestions,
      instructions,
      status: 'scheduled',
      totalAssignedStudents: allStudentIds.length,
      createdBy: institutionId
    });

    await schedule.save();

    // Log action
    await createLog({
      actorId: institutionId,
      actorUsername: institutionName,
      role: 'institution',
      actionType: 'create',
      message: `Scheduled FRI Test: ${friTest.name}`,
      refs: { entity: 'FRITestSchedule', id: schedule._id, friTestId: id }
    });

    console.log('[Institution.scheduleFRITest] FRI Test scheduled:', schedule._id);
    return res.status(201).json({ 
      message: 'FRI Test scheduled successfully', 
      schedule 
    });

  } catch (err) {
    console.error('[Institution.scheduleFRITest] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Helper function to generate questions for FRI test
 */
async function generateQuestionsForFRITest(friTest) {
  try {
    const aptitudeCount = Math.round((friTest.aptitudePercentage / 100) * friTest.totalQuestions);
    const technicalCount = Math.round((friTest.technicalPercentage / 100) * friTest.totalQuestions);
    const psychometricCount = Math.round((friTest.psychometricPercentage / 100) * friTest.totalQuestions);

    const questions = [];
    let orderIndex = 0;

    // Helper to get questions by category and difficulty distribution
    const getQuestionsByCategory = async (category, count) => {
      const easyCount = Math.round((friTest.easyPercentage / 100) * count);
      const mediumCount = Math.round((friTest.mediumPercentage / 100) * count);
      const hardCount = count - easyCount - mediumCount; // Remaining goes to hard

      const categoryQuestions = [];

      // Get easy questions
      if (easyCount > 0) {
        const easyQuestions = await Question.aggregate([
          { $match: { category, difficulty: 'easy', inLibrary: true } },
          { $sample: { size: easyCount } }
        ]);
        categoryQuestions.push(...easyQuestions.map(q => ({ ...q, difficulty: 'easy' })));
      }

      // Get medium questions
      if (mediumCount > 0) {
        const mediumQuestions = await Question.aggregate([
          { $match: { category, difficulty: 'medium', inLibrary: true } },
          { $sample: { size: mediumCount } }
        ]);
        categoryQuestions.push(...mediumQuestions.map(q => ({ ...q, difficulty: 'medium' })));
      }

      // Get hard questions
      if (hardCount > 0) {
        const hardQuestions = await Question.aggregate([
          { $match: { category, difficulty: 'hard', inLibrary: true } },
          { $sample: { size: hardCount } }
        ]);
        categoryQuestions.push(...hardQuestions.map(q => ({ ...q, difficulty: 'hard' })));
      }

      return categoryQuestions;
    };

    // Get aptitude questions
    if (aptitudeCount > 0) {
      const aptQuestions = await getQuestionsByCategory('aptitude', aptitudeCount);
      questions.push(...aptQuestions.map(q => ({
        questionId: q._id,
        category: 'aptitude',
        difficulty: q.difficulty,
        orderIndex: orderIndex++
      })));
    }

    // Get technical questions
    if (technicalCount > 0) {
      const techQuestions = await getQuestionsByCategory('technical', technicalCount);
      questions.push(...techQuestions.map(q => ({
        questionId: q._id,
        category: 'technical',
        difficulty: q.difficulty,
        orderIndex: orderIndex++
      })));
    }

    // Get psychometric questions
    if (psychometricCount > 0) {
      const psychoQuestions = await getQuestionsByCategory('psychometric', psychometricCount);
      questions.push(...psychoQuestions.map(q => ({
        questionId: q._id,
        category: 'psychometric',
        difficulty: q.difficulty,
        orderIndex: orderIndex++
      })));
    }

    // Shuffle if required
    if (friTest.shuffleQuestions) {
      questions.sort(() => Math.random() - 0.5);
      // Reassign order indices after shuffle
      questions.forEach((q, index) => {
        q.orderIndex = index;
      });
    }

    return questions;

  } catch (err) {
    console.error('[generateQuestionsForFRITest] error:', err);
    throw err;
  }
}

/**
 * List scheduled FRI Tests for the institution
 */
const listScheduledFRITests = async (req, res) => {
  try {
    const institutionId = req.institution?.id;

    console.log('[Institution.listScheduledFRITests] called by institution');

    const { status } = req.query;

    let query = { institutionId };
    if (status) {
      query.status = status;
    }

    const schedules = await FRITestSchedule.find(query)
      .populate('friTestId', 'name description totalQuestions testDurationMinutes')
      .populate('assignedFaculty', 'username role')
      .sort({ scheduledDate: -1 });

    return res.json({ schedules });

  } catch (err) {
    console.error('[Institution.listScheduledFRITests] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Get scheduled FRI Test details
 */
const getScheduledFRITest = async (req, res) => {
  try {
    const institutionId = req.institution?.id;
    const { id } = req.params;

    console.log('[Institution.getScheduledFRITest] called for schedule:', id);

    const schedule = await FRITestSchedule.findOne({ _id: id, institutionId })
      .populate('friTestId')
      .populate('assignedFaculty', 'username role')
      .populate('assignedStudents', 'username name email')
      .populate('assignedBatches', 'name');

    if (!schedule) {
      return res.status(404).json({ error: 'Scheduled FRI Test not found' });
    }

    return res.json({ schedule });

  } catch (err) {
    console.error('[Institution.getScheduledFRITest] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Update scheduled FRI Test
 */
const updateScheduledFRITest = async (req, res) => {
  try {
    const institutionId = req.institution?.id;
    const institutionName = req.institution?.name;
    const { id } = req.params;

    console.log('[Institution.updateScheduledFRITest] called for schedule:', id);

    const schedule = await FRITestSchedule.findOne({ _id: id, institutionId });
    if (!schedule) {
      return res.status(404).json({ error: 'Scheduled FRI Test not found' });
    }

    // Only allow updates if not yet completed
    if (schedule.status === 'completed') {
      return res.status(400).json({ error: 'Cannot update completed FRI Test schedule' });
    }

    const {
      scheduledDate,
      scheduledEndDate,
      assignedFaculty,
      assignedStudents,
      assignedBatches,
      instructions,
      status
    } = req.body;

    if (scheduledDate) schedule.scheduledDate = new Date(scheduledDate);
    if (scheduledEndDate) schedule.scheduledEndDate = new Date(scheduledEndDate);
    if (instructions !== undefined) schedule.instructions = instructions;
    if (status) schedule.status = status;

    if (assignedFaculty !== undefined) {
      schedule.assignedFaculty = assignedFaculty;
      if (assignedFaculty) {
        const Faculty = require('../../models/Faculty');
        const faculty = await Faculty.findOne({ _id: assignedFaculty, createdBy: institutionId });
        schedule.assignedFacultyUsername = faculty ? faculty.username : null;
      }
    }

    if (assignedStudents !== undefined || assignedBatches !== undefined) {
      let allStudentIds = [...(assignedStudents || schedule.assignedStudents || [])];
      
      const batchIds = assignedBatches || schedule.assignedBatches;
      if (batchIds && batchIds.length > 0) {
        const batches = await Batch.find({ 
          _id: { $in: batchIds },
          createdBy: institutionId 
        });
        
        for (const batch of batches) {
          allStudentIds.push(...batch.students);
        }
      }

      allStudentIds = [...new Set(allStudentIds.map(id => id.toString()))];
      schedule.assignedStudents = allStudentIds;
      schedule.totalAssignedStudents = allStudentIds.length;
      
      if (assignedBatches !== undefined) {
        schedule.assignedBatches = assignedBatches;
      }
    }

    await schedule.save();

    // Log action
    await createLog({
      actorId: institutionId,
      actorUsername: institutionName,
      role: 'institution',
      actionType: 'edit',
      message: `Updated FRI Test schedule`,
      refs: { entity: 'FRITestSchedule', id: schedule._id }
    });

    return res.json({ message: 'Scheduled FRI Test updated successfully', schedule });

  } catch (err) {
    console.error('[Institution.updateScheduledFRITest] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

/**
 * Cancel scheduled FRI Test
 */
const cancelScheduledFRITest = async (req, res) => {
  try {
    const institutionId = req.institution?.id;
    const institutionName = req.institution?.name;
    const { id } = req.params;

    console.log('[Institution.cancelScheduledFRITest] called for schedule:', id);

    const schedule = await FRITestSchedule.findOne({ _id: id, institutionId });
    if (!schedule) {
      return res.status(404).json({ error: 'Scheduled FRI Test not found' });
    }

    if (schedule.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed FRI Test' });
    }

    schedule.status = 'cancelled';
    await schedule.save();

    // Log action
    await createLog({
      actorId: institutionId,
      actorUsername: institutionName,
      role: 'institution',
      actionType: 'delete',
      message: `Cancelled FRI Test schedule`,
      refs: { entity: 'FRITestSchedule', id: schedule._id }
    });

    return res.json({ message: 'Scheduled FRI Test cancelled successfully' });

  } catch (err) {
    console.error('[Institution.cancelScheduledFRITest] error:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
};

module.exports = {
  listAvailableFRITests,
  getFRITestDetails,
  scheduleFRITest,
  listScheduledFRITests,
  getScheduledFRITest,
  updateScheduledFRITest,
  cancelScheduledFRITest
};
