const Test = require('../../models/Test');
const TestAttempt = require('../../models/TestAttempt');
const Batch = require('../../models/Batch');
const FRITestSchedule = require('../../models/FRITestSchedule');
const FRITest = require('../../models/FRITest');
const Student = require('../../models/Student');
const AdminLog = require('../../controllers/Admin/AdminLogController');

// Get FRI test schedules assigned to this faculty
const getAssignedFRITests = async (req, res) => {
  try {
    const facultyId = req.faculty?.id;
    const facultyUsername = req.faculty?.username;
    console.log('[Faculty.getAssignedFRITests] called by faculty:', facultyUsername);

    // Find all FRI test schedules assigned to this faculty
    const schedules = await FRITestSchedule.find({ 
      assignedFaculty: facultyId 
    })
    .populate('friTestId', 'name description totalQuestions testDurationMinutes aptitudePercentage technicalPercentage psychometricPercentage')
    .sort({ scheduledDate: -1 });

    console.log('[Faculty.getAssignedFRITests] found', schedules.length, 'FRI test schedules');

    // For each schedule, get student status
    const schedulesWithStatus = await Promise.all(schedules.map(async (schedule) => {
      // Collect all assigned student IDs
      let allStudentIds = [...schedule.assignedStudents];
      
      if (schedule.assignedBatches && schedule.assignedBatches.length > 0) {
        const batches = await Batch.find({ 
          _id: { $in: schedule.assignedBatches }
        });
        
        for (const batch of batches) {
          allStudentIds.push(...batch.students);
        }
      }

      // Remove duplicates
      allStudentIds = [...new Set(allStudentIds.map(id => id.toString()))];

      // Get student details
      const students = await Student.find({ 
        _id: { $in: allStudentIds } 
      }).select('username name email');

      // Check for test attempts (FRI test schedules use their own _id as the test identifier)
      const attempts = await TestAttempt.find({ 
        testId: schedule._id,  // FRI test schedules use schedule._id as testId
        studentId: { $in: allStudentIds }
      });

      const studentsWithStatus = students.map(student => {
        const attempt = attempts.find(a => a.studentId.toString() === student._id.toString());
        return {
          _id: student._id,
          username: student.username,
          name: student.name,
          email: student.email,
          status: attempt 
            ? (attempt.completedAt ? 'completed' : 'started')
            : 'pending',
          score: attempt?.score,
          correctCount: attempt?.correctCount,
          total: attempt?.total,
          completedAt: attempt?.completedAt,
          startedAt: attempt?.startedAt
        };
      });

      // Calculate statistics
      const totalStudents = studentsWithStatus.length;
      const completedCount = studentsWithStatus.filter(s => s.status === 'completed').length;
      const startedCount = studentsWithStatus.filter(s => s.status === 'started').length;
      const pendingCount = studentsWithStatus.filter(s => s.status === 'pending').length;

      return {
        _id: schedule._id,
        friTestId: schedule.friTestId,
        friTestName: schedule.friTestId?.name || 'Unknown FRI Test',
        description: schedule.friTestId?.description,
        totalQuestions: schedule.friTestId?.totalQuestions,
        testDurationMinutes: schedule.friTestId?.testDurationMinutes,
        scheduledDate: schedule.scheduledDate,
        scheduledEndDate: schedule.scheduledEndDate,
        status: schedule.status,
        instructions: schedule.instructions,
        students: studentsWithStatus,
        statistics: {
          total: totalStudents,
          completed: completedCount,
          started: startedCount,
          pending: pendingCount
        },
        aptitudePercentage: schedule.friTestId?.aptitudePercentage,
        technicalPercentage: schedule.friTestId?.technicalPercentage,
        psychometricPercentage: schedule.friTestId?.psychometricPercentage
      };
    }));

    console.log('[Faculty.getAssignedFRITests] ✓ returning', schedulesWithStatus.length, 'FRI tests with student status');
    
    try { 
      await AdminLog.createLog({ 
        actorId: facultyId, 
        actorUsername: facultyUsername, 
        role: 'faculty', 
        actionType: 'view', 
        message: `${facultyUsername} viewed assigned FRI tests`, 
        refs: { entity: 'FRITestSchedule', count: schedulesWithStatus.length } 
      }); 
    } catch (e) {}

    res.json({ success: true, data: schedulesWithStatus });
  } catch (err) {
    console.error('[Faculty.getAssignedFRITests] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to get assigned FRI tests' });
  }
};

// Get test results with correct answers for faculty evaluation
const getTestResultsWithAnswers = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.faculty?.id;
    const facultyUsername = req.faculty?.username;
    console.log('[Faculty.getTestResultsWithAnswers] called by faculty:', facultyUsername);
    console.log('[Faculty.getTestResultsWithAnswers] test id:', id);
    
    const t = await Test.findById(id);
    if (!t) {
      console.log('[Faculty.getTestResultsWithAnswers] ✗ test not found:', id);
      return res.status(404).json({ success: false, message: 'test not found' });
    }
    
    if (String(t.assignedFaculty) !== String(facultyId)) {
      console.log('[Faculty.getTestResultsWithAnswers] ✗ forbidden - test not assigned to faculty');
      return res.status(403).json({ success: false, message: 'forbidden' });
    }
    
    let studentIds = [];
    if (Array.isArray(t.assignedBatches) && t.assignedBatches.length) {
      const batches = await Batch.find({ _id: { $in: t.assignedBatches } });
      for (const b of batches) {
        for (const s of b.students || []) studentIds.push(String(s));
      }
    }
    for (const s of t.assignedStudents || []) studentIds.push(String(s));
    studentIds = Array.from(new Set(studentIds));
    
    const attempts = await TestAttempt.find({ testId: id, studentId: { $in: studentIds } }).populate('studentId', 'username name email');
    const status = studentIds.map((sid) => {
      const attempt = attempts.find((a) => String(a.studentId?._id || a.studentId) === String(sid));
      if (!attempt) return { studentId: sid, status: 'pending' };
      return {
        studentId: String(attempt.studentId?._id || attempt.studentId),
        student: attempt.studentId?.username || undefined,
        name: attempt.studentId?.name || undefined,
        email: attempt.studentId?.email || undefined,
        status: attempt.completedAt ? 'completed' : 'started',
        timeTakenSeconds: attempt.timeTakenSeconds,
        score: attempt.score,
        correctCount: attempt.correctCount,
        total: attempt.total,
        responses: attempt.responses || [],
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
      };
    });
    
    // Build test data WITH correct answers for faculty evaluation
    const testWithAnswers = {
      _id: t._id,
      name: t.name,
      type: t.type,
      durationMinutes: t.durationMinutes,
      startTime: t.startTime,
      endTime: t.endTime,
      questions: t.questions.map((q, idx) => {
        // Normalize options - handle both string arrays and object arrays
        const normalizedOptions = Array.isArray(q.options) 
          ? q.options.map(opt => typeof opt === 'string' ? opt : (opt.text || String(opt)))
          : [];
        
        // Get correct answers - support both single and multiple
        const correctIndices = Array.isArray(q.correctIndices) && q.correctIndices.length > 0
          ? q.correctIndices
          : (typeof q.correctIndex === 'number' ? [q.correctIndex] : []);
        
        console.log(`[Faculty Eval] Q${idx + 1}: "${q.text}" - Correct answers: [${correctIndices.join(', ')}], Options: ${normalizedOptions.length}`);
        
        return {
          text: q.text,
          options: normalizedOptions,
          correctIndex: correctIndices[0], // For backward compatibility
          correctIndices: correctIndices, // For multiple answer support
          isMultipleAnswer: correctIndices.length > 1
        };
      })
    };
    
    console.log('[Faculty.getTestResultsWithAnswers] ✓ found results - students:', studentIds.length, ', completed:', attempts.filter(a => a.completedAt).length, ', questions:', testWithAnswers.questions.length);
    try { await AdminLog.createLog({ actorId: facultyId, actorUsername: facultyUsername, role: 'faculty', actionType: 'view', message: `${facultyUsername} viewed results of ${t.name}`, refs: { entity: 'Test', id: t._id } }); } catch (e) {}
    res.json({ success: true, data: { test: testWithAnswers, status } });
  } catch (err) {
    console.error('[Faculty.getTestResultsWithAnswers] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to get results' });
  }
};

module.exports = {
  getTestResultsWithAnswers,
  getAssignedFRITests,
};
