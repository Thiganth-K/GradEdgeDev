const FacultyTest = require('../../models/FacultyTest');
const AdminLog = require('../Admin/AdminLogController');
const Test = require('../../models/Test');

// Create a faculty-owned test (faculty can pick library questions + custom questions)
const createFacultyTest = async (req, res) => {
  try {
    const facultyId = req.faculty?.id;
    const facultyUsername = req.faculty?.username;
    const payload = req.body || {};
    // normalize incoming fields
    const libraryQuestionIds = payload.libraryQuestionIds || payload.questionIds || [];
    const assignedBatches = payload.assignedBatches || payload.batchIds || [];

    const t = new FacultyTest({
      name: payload.name,
      type: payload.type,
      assignedFaculty: facultyId,
      createdBy: facultyId,
      libraryQuestionIds,
      customQuestions: payload.customQuestions || [],
      questions: payload.questions || [],
      durationMinutes: payload.durationMinutes || 30,
      startTime: payload.startTime || null,
      endTime: payload.endTime || null,
      assignedBatches,
      assignedStudents: payload.assignedStudents || [],
    });
    await t.save();

    // Also create a canonical Test document so students can attempt it using existing flows
    try {
      const testDoc = new Test({
        name: t.name,
        type: t.type,
        assignedFaculty: facultyId,
        createdBy: req.faculty?.institutionId || null,
        libraryQuestionIds: libraryQuestionIds,
        customQuestions: t.customQuestions || [],
        questions: t.questions || [],
        durationMinutes: t.durationMinutes || 30,
        startTime: t.startTime || null,
        endTime: t.endTime || null,
        assignedBatches: assignedBatches,
        assignedStudents: t.assignedStudents || [],
      });
      await testDoc.save();
      t.linkedTestId = testDoc._id;
      await t.save();
    } catch (err) {
      console.error('[FacultyTest.createFacultyTest] failed to create linked Test doc', err.message);
    }
    try { await AdminLog.createLog({ actorId: facultyId, actorUsername: facultyUsername, role: 'faculty', actionType: 'create', message: `${facultyUsername} created a faculty test ${t.name}`, refs: { entity: 'FacultyTest', id: t._id } }); } catch (e) {}
    res.json({ success: true, data: t });
  } catch (err) {
    console.error('[FacultyTest.createFacultyTest] ✗', err.message);
    res.status(500).json({ success: false, message: 'failed to create test' });
  }
};

const listFacultyTests = async (req, res) => {
  try {
    const facultyId = req.faculty?.id;
    const q = { assignedFaculty: facultyId };
    const list = await FacultyTest.find(q).populate('linkedTestId').sort({ createdAt: -1 });
    // include helpful counts from linked test when available
    const transformed = list.map(ft => ({
      _id: ft._id,
      name: ft.name,
      type: ft.type,
      createdAt: ft.createdAt,
      libraryQuestionIds: ft.libraryQuestionIds || [],
      customQuestions: ft.customQuestions || [],
      linkedTestId: ft.linkedTestId?._id || null,
      questionsCount: ((ft.libraryQuestionIds||[]).length + (ft.customQuestions||[]).length) || (ft.linkedTestId?.questions?.length || 0),
    }));
    res.json({ success: true, data: transformed });
  } catch (err) {
    console.error('[FacultyTest.listFacultyTests] ✗', err.message);
    res.status(500).json({ success: false, message: 'failed to list tests' });
  }
};

const getFacultyTest = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.faculty?.id;
    const t = await FacultyTest.findById(id);
    if (!t) return res.status(404).json({ success: false, message: 'not found' });
    if (String(t.assignedFaculty) !== String(facultyId)) return res.status(403).json({ success: false, message: 'forbidden' });
    // populate linked test if present
    await t.populate('linkedTestId');
    res.json({ success: true, data: t });
  } catch (err) {
    console.error('[FacultyTest.getFacultyTest] ✗', err.message);
    res.status(500).json({ success: false, message: 'failed to get test' });
  }
};

const updateFacultyTest = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.faculty?.id;
    const t = await FacultyTest.findById(id);
    if (!t) return res.status(404).json({ success: false, message: 'not found' });
    if (String(t.assignedFaculty) !== String(facultyId)) return res.status(403).json({ success: false, message: 'forbidden' });
    const payload = req.body || {};
    // allow limited updates
    t.name = payload.name || t.name;
    t.type = payload.type || t.type;
    const libraryQuestionIds = payload.libraryQuestionIds || payload.questionIds || t.libraryQuestionIds;
    const assignedBatches = payload.assignedBatches || payload.batchIds || t.assignedBatches;
    t.libraryQuestionIds = libraryQuestionIds;
    t.customQuestions = payload.customQuestions || t.customQuestions;
    t.questions = payload.questions || t.questions;
    t.durationMinutes = payload.durationMinutes || t.durationMinutes;
    t.startTime = payload.startTime || t.startTime;
    t.endTime = payload.endTime || t.endTime;
    t.assignedBatches = assignedBatches;
    t.assignedStudents = payload.assignedStudents || t.assignedStudents;
    await t.save();

    // sync linked Test doc if present
    if (t.linkedTestId) {
      try {
        const testDoc = await Test.findById(t.linkedTestId);
        if (testDoc) {
          testDoc.name = t.name;
          testDoc.type = t.type;
          testDoc.libraryQuestionIds = t.libraryQuestionIds || [];
          testDoc.customQuestions = t.customQuestions || [];
          testDoc.questions = t.questions || [];
          testDoc.durationMinutes = t.durationMinutes || testDoc.durationMinutes;
          testDoc.startTime = t.startTime || testDoc.startTime;
          testDoc.endTime = t.endTime || testDoc.endTime;
          testDoc.assignedBatches = t.assignedBatches || testDoc.assignedBatches;
          testDoc.assignedStudents = t.assignedStudents || testDoc.assignedStudents;
          await testDoc.save();
        }
      } catch (e) { console.error('[FacultyTest.updateFacultyTest] sync linked test failed', e.message); }
    }
    try { await AdminLog.createLog({ actorId: facultyId, actorUsername: req.faculty?.username, role: 'faculty', actionType: 'update', message: `${req.faculty?.username} updated faculty test ${t.name}`, refs: { entity: 'FacultyTest', id: t._id } }); } catch (e) {}
    res.json({ success: true, data: t });
  } catch (err) {
    console.error('[FacultyTest.updateFacultyTest] ✗', err.message);
    res.status(500).json({ success: false, message: 'failed to update test' });
  }
};

const deleteFacultyTest = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.faculty?.id;
    const t = await FacultyTest.findById(id);
    if (!t) return res.status(404).json({ success: false, message: 'not found' });
    if (String(t.assignedFaculty) !== String(facultyId)) return res.status(403).json({ success: false, message: 'forbidden' });
    // delete linked test if exists
    try { if (t.linkedTestId) await Test.deleteOne({ _id: t.linkedTestId }); } catch (e) { console.error('[FacultyTest.deleteFacultyTest] failed to delete linked test', e.message); }
    await FacultyTest.deleteOne({ _id: id });
    try { await AdminLog.createLog({ actorId: facultyId, actorUsername: req.faculty?.username, role: 'faculty', actionType: 'delete', message: `${req.faculty?.username} deleted faculty test ${t.name}`, refs: { entity: 'FacultyTest', id: t._id } }); } catch (e) {}
    res.json({ success: true });
  } catch (err) {
    console.error('[FacultyTest.deleteFacultyTest] ✗', err.message);
    res.status(500).json({ success: false, message: 'failed to delete test' });
  }
};

module.exports = {
  createFacultyTest,
  listFacultyTests,
  getFacultyTest,
  updateFacultyTest,
  deleteFacultyTest,
};
