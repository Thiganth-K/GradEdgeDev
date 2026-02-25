const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Institution = require('../../models/Institution');
const Faculty = require('../../models/Faculty');
const Student = require('../../models/Student');
const Batch = require('../../models/Batch');
const Test = require('../../models/Test');
const Question = require('../../models/Question');
const Library = require('../../models/Library');
const TestAttempt = require('../../models/TestAttempt');
const Announcement = require('../../models/Announcement');
const InstitutionAnnouncement = require('../../models/InstitutionAnnouncement');
const AdminLog = require('../Admin/AdminLogController');

// =====================
// AUTH
// =====================

const login = async (req, res) => {
  const { institutionId, password } = req.body || {};
  console.log('[Institution.login] called', { institutionId });
  if (!institutionId || !password) return res.status(400).json({ success: false, message: 'institutionId and password required' });

  try {
    const inst = await Institution.findOne({ institutionId });
    if (!inst) {
      console.log('[Institution.login] not found', institutionId);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    const ok = await bcrypt.compare(password, inst.passwordHash);
    if (!ok) {
      console.log('[Institution.login] invalid password for', institutionId);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    const secret = process.env.INSTITUTION_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      console.error('[Institution.login] INSTITUTION_JWT_SECRET not configured');
      return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
    }

    const token = jwt.sign({ id: inst._id, institutionId: inst.institutionId, name: inst.name, role: 'institution' }, secret, { expiresIn: '7d' });
    console.log('[Institution.login] authenticated', institutionId, '- generated token');
    try { await AdminLog.createLog({ actorId: inst._id, actorUsername: inst.institutionId, role: 'institution', actionType: 'login', message: `${inst.institutionId} logged in` }); } catch (e) {}
    return res.json({ success: true, role: 'institution', token, data: { id: inst._id, institutionId: inst.institutionId, name: inst.name, facultyLimit: inst.facultyLimit ?? null, studentLimit: inst.studentLimit ?? null, batchLimit: inst.batchLimit ?? null, testLimit: inst.testLimit ?? null } });
  } catch (err) {
    console.error('[Institution.login] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const facultyLogin = async (req, res) => {
  const { username, password } = req.body || {};
  console.log('[Institution.facultyLogin] called with username:', username);
  
  if (!username || !password) {
    console.log('[Institution.facultyLogin] ✗ missing credentials');
    return res.status(400).json({ success: false, message: 'username and password required' });
  }
  
  try {
    const f = await Faculty.findOne({ username });
    if (!f) {
      console.log('[Institution.facultyLogin] ✗ faculty not found:', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, f.passwordHash);
    if (!ok) {
      console.log('[Institution.facultyLogin] ✗ invalid password for:', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }
    
    const secret = process.env.INSTITUTION_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      console.error('[Institution.facultyLogin] ✗ jwt secret not configured');
      return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
    }

    const token = jwt.sign({ id: f._id, username: f.username, role: 'faculty' }, secret, { expiresIn: '7d' });
    console.log('[Institution.facultyLogin] ✓ authenticated faculty:', username, 'role:', f.role, '- generated token');
    try { await AdminLog.createLog({ actorId: f._id, actorUsername: f.username, role: 'faculty', actionType: 'login', message: `${f.username} logged in` }); } catch (e) {}
    return res.json({ success: true, role: 'faculty', token, data: { id: f._id, username: f.username, role: f.role } });
  } catch (err) {
    console.error('[Institution.facultyLogin] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const studentLogin = async (req, res) => {
  const { username, password } = req.body || {};
  console.log('[Institution.studentLogin] called with username:', username);
  
  if (!username || !password) {
    console.log('[Institution.studentLogin] ✗ missing credentials');
    return res.status(400).json({ success: false, message: 'username and password required' });
  }
  
  try {
    const s = await Student.findOne({ username });
    if (!s) {
      console.log('[Institution.studentLogin] ✗ student not found:', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, s.passwordHash);
    if (!ok) {
      console.log('[Institution.studentLogin] ✗ invalid password for:', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }
    
    const secret = process.env.INSTITUTION_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      console.error('[Institution.studentLogin] ✗ jwt secret not configured');
      return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
    }

    const token = jwt.sign({ id: s._id, username: s.username, role: 'student' }, secret, { expiresIn: '7d' });
    console.log('[Institution.studentLogin] ✓ authenticated student:', username, '- generated token');
    try { await AdminLog.createLog({ actorId: s._id, actorUsername: s.username, role: 'student', actionType: 'login', message: `${s.username} logged in` }); } catch (e) {}
    return res.json({ success: true, role: 'student', token, data: { id: s._id, username: s.username, name: s.name } });
  } catch (err) {
    console.error('[Institution.studentLogin] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================
// FACULTY CRUD
// =====================

const listFaculties = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    console.log('[Institution.listFaculties] called by institution:', instName);
    
    const docs = await Faculty.find({ createdBy: instId }).select('-passwordHash');
    console.log('[Institution.listFaculties] ✓ found', docs.length, 'faculties');
    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error('[Institution.listFaculties] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const { username, password, role } = req.body || {};
    console.log('[Institution.createFaculty] called by institution:', instName);
    console.log('[Institution.createFaculty] payload: { username:', username, ', role:', role, '}');
    
    if (!username || !password || !role) {
      console.log('[Institution.createFaculty] ✗ missing required fields');
      return res.status(400).json({ success: false, message: 'username, password and role required' });
    }
    
    const existing = await Faculty.findOne({ username });
    if (existing) {
      console.log('[Institution.createFaculty] ✗ username already taken:', username);
      return res.status(400).json({ success: false, message: 'username taken' });
    }
    // enforce faculty limit if configured
    const instDoc = await Institution.findById(instId).select('facultyLimit');
    if (instDoc && typeof instDoc.facultyLimit === 'number' && instDoc.facultyLimit >= 0) {
      const current = await Faculty.countDocuments({ createdBy: instId });
      if (current >= instDoc.facultyLimit) {
        console.log('[Institution.createFaculty] ✗ faculty limit reached -', current, '/', instDoc.facultyLimit);
        return res.status(403).json({ success: false, message: 'faculty create limit reached' });
      }
    }
    
    const hash = await bcrypt.hash(password, 10);
    const f = await Faculty.create({ username, passwordHash: hash, role, createdBy: instId });
    console.log('[Institution.createFaculty] ✓ created - id:', f._id.toString(), 'username:', f.username, 'role:', f.role);
    try { await AdminLog.createLog({ actorId: instId, actorUsername: instName, role: 'institution', actionType: 'create', message: `${instName} created faculty ${f.username}`, refs: { entity: 'Faculty', id: f._id } }); } catch (e) {}
    return res.json({ success: true, data: { id: f._id, username: f.username, role: f.role } });
  } catch (err) {
    console.error('[Institution.createFaculty] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const id = req.params.id;
    console.log('[Institution.updateFaculty] called by institution:', instName);
    console.log('[Institution.updateFaculty] target id:', id);
    
    const updates = {};
    if (req.body.username) updates.username = req.body.username;
    if (req.body.role) updates.role = req.body.role;
    if (req.body.password) updates.passwordHash = await bcrypt.hash(req.body.password, 10);
    
    const f = await Faculty.findOneAndUpdate({ _id: id, createdBy: instId }, updates, { new: true }).select('-passwordHash');
    if (!f) {
      console.log('[Institution.updateFaculty] ✗ faculty not found:', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    
    console.log('[Institution.updateFaculty] ✓ updated - id:', f._id.toString(), 'username:', f.username);
    try { await AdminLog.createLog({ actorId: instId, actorUsername: instName, role: 'institution', actionType: 'edit', message: `${instName} updated faculty ${f.username}`, refs: { entity: 'Faculty', id: f._id } }); } catch (e) {}
    return res.json({ success: true, data: f });
  } catch (err) {
    console.error('[Institution.updateFaculty] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const id = req.params.id;
    console.log('[Institution.deleteFaculty] called by institution:', instName);
    console.log('[Institution.deleteFaculty] target id:', id);
    
    const f = await Faculty.findOneAndDelete({ _id: id, createdBy: instId });
    if (!f) {
      console.log('[Institution.deleteFaculty] ✗ faculty not found:', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    
    console.log('[Institution.deleteFaculty] ✓ deleted - id:', f._id.toString(), 'username:', f.username);
    try { await AdminLog.createLog({ actorId: instId, actorUsername: instName, role: 'institution', actionType: 'delete', message: `${instName} deleted faculty ${f.username}`, refs: { entity: 'Faculty', id: f._id } }); } catch (e) {}
    return res.json({ success: true, message: 'deleted' });
  } catch (err) {
    console.error('[Institution.deleteFaculty] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================
// STUDENT CRUD
// =====================

const listStudents = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    console.log('[Institution.listStudents] called by institution:', instName);
    
    const docs = await Student.find({ createdBy: instId }).select('-passwordHash');
    console.log('[Institution.listStudents] ✓ found', docs.length, 'students');
    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error('[Institution.listStudents] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const { username, password, name, email, dept, regno } = req.body || {};
    console.log('[Institution.createStudent] called by institution:', instName);
    console.log('[Institution.createStudent] payload: { username:', username, ', name:', name, ', dept:', dept, ', regno:', regno, '}');
    
    if (!username || !password) {
      console.log('[Institution.createStudent] ✗ missing required fields');
      return res.status(400).json({ success: false, message: 'username and password required' });
    }
    
    const existing = await Student.findOne({ username });
    if (existing) {
      console.log('[Institution.createStudent] ✗ username already taken:', username);
      return res.status(400).json({ success: false, message: 'username taken' });
    }
    // enforce student limit if configured
    const instDoc = await Institution.findById(instId).select('studentLimit');
    if (instDoc && typeof instDoc.studentLimit === 'number' && instDoc.studentLimit >= 0) {
      const current = await Student.countDocuments({ createdBy: instId });
      if (current >= instDoc.studentLimit) {
        console.log('[Institution.createStudent] ✗ student limit reached -', current, '/', instDoc.studentLimit);
        return res.status(403).json({ success: false, message: 'student create limit reached' });
      }
    }
    
    const hash = await bcrypt.hash(password, 10);
    const s = await Student.create({ username, passwordHash: hash, name, email, dept, regno, createdBy: instId });
    console.log('[Institution.createStudent] ✓ created - id:', s._id.toString(), 'username:', s.username, 'name:', s.name);
    try { await AdminLog.createLog({ actorId: instId, actorUsername: instName, role: 'institution', actionType: 'create', message: `${instName} created student ${s.username}`, refs: { entity: 'Student', id: s._id } }); } catch (e) {}
    return res.json({ success: true, data: { id: s._id, username: s.username, name: s.name } });
  } catch (err) {
    console.error('[Institution.createStudent] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const id = req.params.id;
    console.log('[Institution.updateStudent] called by institution:', instName);
    console.log('[Institution.updateStudent] target id:', id);
    
    const updates = {};
    ['username', 'name', 'email', 'dept', 'regno'].forEach((k) => { if (req.body[k]) updates[k] = req.body[k]; });
    if (req.body.password) updates.passwordHash = await bcrypt.hash(req.body.password, 10);
    
    const s = await Student.findOneAndUpdate({ _id: id, createdBy: instId }, updates, { new: true }).select('-passwordHash');
    if (!s) {
      console.log('[Institution.updateStudent] ✗ student not found:', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    
    console.log('[Institution.updateStudent] ✓ updated - id:', s._id.toString(), 'username:', s.username);
    try { await AdminLog.createLog({ actorId: instId, actorUsername: instName, role: 'institution', actionType: 'edit', message: `${instName} updated student ${s.username}`, refs: { entity: 'Student', id: s._id } }); } catch (e) {}
    return res.json({ success: true, data: s });
  } catch (err) {
    console.error('[Institution.updateStudent] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const id = req.params.id;
    console.log('[Institution.deleteStudent] called by institution:', instName);
    console.log('[Institution.deleteStudent] target id:', id);
    
    const s = await Student.findOneAndDelete({ _id: id, createdBy: instId });
    if (!s) {
      console.log('[Institution.deleteStudent] ✗ student not found:', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    
    console.log('[Institution.deleteStudent] ✓ deleted - id:', s._id.toString(), 'username:', s.username);
    try { await AdminLog.createLog({ actorId: instId, actorUsername: instName, role: 'institution', actionType: 'delete', message: `${instName} deleted student ${s.username}`, refs: { entity: 'Student', id: s._id } }); } catch (e) {}
    return res.json({ success: true, message: 'deleted' });
  } catch (err) {
    console.error('[Institution.deleteStudent] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================
// BATCH CRUD
// =====================

const listBatches = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    console.log('[Institution.listBatches] called by institution:', instName);
    
    const docs = await Batch.find({ createdBy: instId }).populate('faculty', 'username role').populate('students', 'username name regno');
    console.log('[Institution.listBatches] ✓ found', docs.length, 'batches');
    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error('[Institution.listBatches] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createBatch = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const { name, facultyId, studentIds } = req.body || {};
    console.log('[Institution.createBatch] called by institution:', instName);
    console.log('[Institution.createBatch] payload: { name:', name, ', facultyId:', facultyId, ', studentCount:', Array.isArray(studentIds) ? studentIds.length : 0, '}');
    
    if (!name) {
      console.log('[Institution.createBatch] ✗ missing name');
      return res.status(400).json({ success: false, message: 'name required' });
    }
    // enforce batch limit if configured
    const instDoc = await Institution.findById(instId).select('batchLimit');
    if (instDoc && typeof instDoc.batchLimit === 'number' && instDoc.batchLimit >= 0) {
      const current = await Batch.countDocuments({ createdBy: instId });
      if (current >= instDoc.batchLimit) {
        console.log('[Institution.createBatch] ✗ batch limit reached -', current, '/', instDoc.batchLimit);
        return res.status(403).json({ success: false, message: 'batch create limit reached' });
      }
    }
    
    const b = await Batch.create({ name, faculty: facultyId || null, students: Array.isArray(studentIds) ? studentIds : [], createdBy: instId });
    console.log('[Institution.createBatch] ✓ created - id:', b._id.toString(), 'name:', b.name, 'students:', b.students.length);
    try { await AdminLog.createLog({ actorId: instId, actorUsername: instName, role: 'institution', actionType: 'create', message: `${instName} created batch ${b.name}`, refs: { entity: 'Batch', id: b._id } }); } catch (e) {}
    return res.json({ success: true, data: b });
  } catch (err) {
    console.error('[Institution.createBatch] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateBatch = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const id = req.params.id;
    console.log('[Institution.updateBatch] called by institution:', instName);
    console.log('[Institution.updateBatch] target id:', id);
    
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.facultyId) updates.faculty = req.body.facultyId;
    if (Array.isArray(req.body.studentIds)) updates.students = req.body.studentIds;
    
    const b = await Batch.findOneAndUpdate({ _id: id, createdBy: instId }, updates, { new: true }).populate('faculty', 'username role').populate('students', 'username name regno');
    if (!b) {
      console.log('[Institution.updateBatch] ✗ batch not found:', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    
    console.log('[Institution.updateBatch] ✓ updated - id:', b._id.toString(), 'name:', b.name);
    try { await AdminLog.createLog({ actorId: instId, actorUsername: instName, role: 'institution', actionType: 'edit', message: `${instName} updated batch ${b.name}`, refs: { entity: 'Batch', id: b._id } }); } catch (e) {}
    return res.json({ success: true, data: b });
  } catch (err) {
    console.error('[Institution.updateBatch] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteBatch = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const id = req.params.id;
    console.log('[Institution.deleteBatch] called by institution:', instName);
    console.log('[Institution.deleteBatch] target id:', id);
    
    const b = await Batch.findOneAndDelete({ _id: id, createdBy: instId });
    if (!b) {
      console.log('[Institution.deleteBatch] ✗ batch not found:', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    
    console.log('[Institution.deleteBatch] ✓ deleted - id:', b._id.toString(), 'name:', b.name);
    try { await AdminLog.createLog({ actorId: instId, actorUsername: instName, role: 'institution', actionType: 'delete', message: `${instName} deleted batch ${b.name}`, refs: { entity: 'Batch', id: b._id } }); } catch (e) {}
    return res.json({ success: true, message: 'deleted' });
  } catch (err) {
    console.error('[Institution.deleteBatch] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================
// QUESTION LIBRARY
// =====================

// Map frontend category value (lowercase) to Library topic (Title case)
const CATEGORY_TO_TOPIC = {
  aptitude: 'Aptitude',
  technical: 'Technical',
  psychometric: 'Psychometric',
};

const listQuestions = async (req, res) => {
  try {
    const { category } = req.query || {};
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.listQuestions] called by institution:', instName);
    if (category) console.log('[Institution.listQuestions] category filter:', category);

    // Build query for Library
    const query = {};
    
    // Filter by category/topic
    if (category) {
      const lowerCategory = category.toLowerCase();
      
      // Handle coding category - fetch CODING questions from Library
      if (lowerCategory === 'coding') {
        query.questionCategory = 'CODING';
      } else {
        // For MCQ categories (aptitude, technical, psychometric)
        const topicValue = CATEGORY_TO_TOPIC[lowerCategory];
        if (topicValue) {
          query.$or = [
            { topic: topicValue },
            { topic: { $exists: false } },
            { topic: null },
            { topic: '' },
          ];
        }
        // Only fetch MCQ questions for non-coding categories
        query.questionCategory = { $in: ['MCQ', null] }; // null for legacy entries
      }
    }

    const libraryEntries = await Library.find(query)
      .populate('codingQuestionId') // Populate coding question details
      .sort({ createdAt: -1 })
      .lean();
    console.log('[Institution.listQuestions] found', libraryEntries.length, 'library entries');

    // Normalise each entry to the shape the frontend expects
    const items = libraryEntries.map(entry => {
      const isCoding = entry.questionCategory === 'CODING';
      
      // Base structure
      const item = {
        _id: entry._id,
        topic: entry.topic,
        subtopic: entry.subtopic || entry.subTopic,
        difficulty: entry.difficulty,
        contributorId: entry.contributorId,
        questionType: entry.questionType || 'mcq',
        questionCategory: entry.questionCategory || 'MCQ',
        createdAt: entry.createdAt,
        isCoding: isCoding,
      };

      if (isCoding && entry.codingQuestionId) {
        // Coding question format
        const codingQ = entry.codingQuestionId;
        item.text = codingQ.problemName || '';
        item.question = codingQ.problemStatement || '';
        item.problemName = codingQ.problemName;
        item.problemStatement = codingQ.problemStatement;
        item.images = codingQ.images || [];
        item.supportedLanguages = codingQ.supportedLanguages || [];
        item.constraints = codingQ.constraints || [];
        item.sampleInput = codingQ.sampleInput;
        item.sampleOutput = codingQ.sampleOutput;
        item.industrialTestCases = codingQ.industrialTestCases || [];
        item.hiddenTestCases = codingQ.hiddenTestCases || [];
        item.solutionApproach = codingQ.solutionApproach;
      } else {
        // MCQ question format
        item.text = entry.question || entry.text || '';
        item.question = entry.question || entry.text || '';
        item.options = (entry.options || []).map(o => ({
          text: o.text || '',
          isCorrect: !!o.isCorrect,
          imageUrl: o.imageUrl || null,
          imageUrls: o.imageUrls || [],
        }));
        item.solutions = entry.solutions || [];
        item.questionImageUrl = entry.questionImageUrl || null;
        item.questionImageUrls = entry.questionImageUrls || [];
      }

      return item;
    });

    console.log('[Institution.listQuestions] ✓ returning', items.length, 'approved library questions (MCQ + CODING)');
    res.json({ success: true, data: items });
  } catch (err) {
    console.error('[Institution.listQuestions] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to list questions' });
  }
};

const createQuestion = async (req, res) => {
  try {
    const { text, options, correctIndex, category, difficulty, tags } = req.body || {};
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.createQuestion] called by institution:', instName);
    console.log('[Institution.createQuestion] payload: { category:', category, ', difficulty:', difficulty, ', options:', options?.length || 0, '}');
    
    if (!text || !Array.isArray(options) || options.length < 2 || typeof correctIndex !== 'number') {
      console.log('[Institution.createQuestion] ✗ invalid payload');
      return res.status(400).json({ success: false, message: 'invalid question payload' });
    }
    if (!['aptitude', 'technical', 'psychometric', 'coding'].includes(category)) {
      console.log('[Institution.createQuestion] ✗ invalid category:', category);
      return res.status(400).json({ success: false, message: 'invalid category' });
    }
    
    const q = await Question.create({
      text,
      options: options.map((t) => ({ text: t })),
      correctIndex,
      category,
      difficulty,
      tags,
      createdBy: req.institution?.id,
    });
    console.log('[Institution.createQuestion] ✓ created - id:', q._id.toString(), 'category:', q.category);
    res.status(201).json({ success: true, data: q });
  } catch (err) {
    console.error('[Institution.createQuestion] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to create question' });
  }
};

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.updateQuestion] called by institution:', instName);
    console.log('[Institution.updateQuestion] target id:', id);
    
    const q = await Question.findOne({ _id: id, createdBy: req.institution?.id });
    if (!q) {
      console.log('[Institution.updateQuestion] ✗ question not found:', id);
      return res.status(404).json({ success: false, message: 'question not found' });
    }
    
    const { text, options, correctIndex, correctIndices, category, difficulty, tags } = req.body || {};
    if (text !== undefined) q.text = text;
    if (Array.isArray(options) && options.length >= 2) q.options = options.map((t) => ({ text: t }));
    
    // Handle both single and multiple correct answers
    if (typeof correctIndex === 'number') {
      q.correctIndex = correctIndex;
      // Clear correctIndices if setting single answer
      q.correctIndices = undefined;
    }
    if (Array.isArray(correctIndices) && correctIndices.length > 0) {
      q.correctIndices = correctIndices;
      // Clear correctIndex if setting multiple answers
      q.correctIndex = undefined;
    }
    
    if (category && ['aptitude', 'technical', 'psychometric', 'coding'].includes(category)) q.category = category;
    if (difficulty) q.difficulty = difficulty;
    if (tags) q.tags = tags;
    await q.save();
    
    console.log('[Institution.updateQuestion] ✓ updated - id:', q._id.toString());
    res.json({ success: true, data: q });
  } catch (err) {
    console.error('[Institution.updateQuestion] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to update question' });
  }
};

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.deleteQuestion] called by institution:', instName);
    console.log('[Institution.deleteQuestion] target id:', id);
    
    const q = await Question.findOneAndDelete({ _id: id, createdBy: req.institution?.id });
    if (!q) {
      console.log('[Institution.deleteQuestion] ✗ question not found:', id);
      return res.status(404).json({ success: false, message: 'question not found' });
    }
    
    console.log('[Institution.deleteQuestion] ✓ deleted - id:', q._id.toString());
    res.json({ success: true });
  } catch (err) {
    console.error('[Institution.deleteQuestion] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to delete question' });
  }
};

// =====================
// TESTS
// =====================

const listTests = async (req, res) => {
  try {
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.listTests] called by institution:', instName);
    
    const tests = await Test.find({ createdBy: req.institution?.id }).populate('assignedFaculty', 'username role').sort({ createdAt: -1 });
    console.log('[Institution.listTests] ✓ found', tests.length, 'tests');
    res.json({ success: true, data: tests });
  } catch (err) {
    console.error('[Institution.listTests] ✗ error:', err);
    res.status(500).json({ success: false, message: err.message || 'failed to list tests' });
  }
};

const getTest = async (req, res) => {
  try {
    const { id } = req.params;
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.getTest] called by institution:', instName);
    console.log('[Institution.getTest] target id:', id);
    
    const t = await Test.findOne({ _id: id, createdBy: req.institution?.id }).populate('assignedFaculty', 'username role');
    if (!t) {
      console.log('[Institution.getTest] ✗ test not found:', id);
      return res.status(404).json({ success: false, message: 'test not found' });
    }
    
    console.log('[Institution.getTest] ✓ found - id:', t._id.toString(), 'name:', t.name);
    res.json({ success: true, data: t });
  } catch (err) {
    console.error('[Institution.getTest] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to get test' });
  }
};

const createTest = async (req, res) => {
  try {
    const { name, type, durationMinutes, startTime, endTime, assignedFacultyId, batchIds, questionIds, customQuestions } = req.body || {};
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.createTest] called by institution:', instName);
    console.log('[Institution.createTest] payload: { name:', name, ', type:', type, ', duration:', durationMinutes, ', batchCount:', batchIds?.length || 0, '}');
    
    if (!name || !['aptitude', 'technical', 'psychometric', 'coding'].includes(type)) {
      console.log('[Institution.createTest] ✗ invalid payload');
      return res.status(400).json({ success: false, message: 'invalid test payload' });
    }
    
    // NEW: Separate handling for library questions and custom questions
    const libraryQuestionIds = [];
    const customQs = [];
    const legacyQuestions = []; // For backward compatibility
    
    // Process Library Questions — look up by Library _id and embed as customQuestions
    if (Array.isArray(questionIds) && questionIds.length) {
      const libraryEntries = await Library.find({ _id: { $in: questionIds } }).lean();
      console.log('[Institution.createTest] found', libraryEntries.length, 'library entries for provided IDs');
      
      for (const entry of libraryEntries) {
        // Map Library options (isCorrect bool) → correctIndices
        const opts = entry.options || [];
        const correctIndices = opts.reduce((acc, o, i) => { if (o.isCorrect) acc.push(i); return acc; }, []);

        const qText = entry.question || entry.text || '';
        if (!qText) {
          console.log('[Institution.createTest] ⚠ skipping library entry with empty question text, id:', entry._id);
          continue;
        }

        customQs.push({
          text: qText,
          options: opts.map(o => o.text || ''),
          correctIndices,
          correctIndex: correctIndices[0] ?? 0,
          difficulty: entry.difficulty || 'medium',
          isCoding: false,
          starterCode: '',
          testCases: [],
        });

        legacyQuestions.push({
          text: entry.question || entry.text || '',
          options: opts.map(o => ({ text: o.text || '' })),
          correctIndices,
          correctIndex: correctIndices[0] ?? 0,
        });

        console.log(`[Test Creation] Library Q: "${entry.question}" - correct indices: [${correctIndices.join(', ')}]`);
      }

      if (libraryEntries.length < questionIds.length) {
        console.log('[Institution.createTest] ⚠ some question IDs were not found in Library');
      }
    }
    
    // Process Custom Questions (embedded, test-specific)
    if (Array.isArray(customQuestions) && customQuestions.length) {
      for (const cq of customQuestions) {
        const { text, options, correctIndex, correctIndices, difficulty, isCoding, starterCode, testCases } = cq;
        if (!text || (!isCoding && (!Array.isArray(options) || options.length < 2))) {
          console.log('[Institution.createTest] ⚠ skipping invalid custom question - missing text, options, or invalid coding config');
          continue;
        }
        
        // Support both single (correctIndex) and multiple (correctIndices) answers
        let finalCorrectIndices = [];
        if (!isCoding) {
          if (Array.isArray(correctIndices) && correctIndices.length > 0) {
            finalCorrectIndices = correctIndices;
          } else if (typeof correctIndex === 'number') {
            finalCorrectIndices = [correctIndex];
          } else {
            console.log('[Institution.createTest] ⚠ skipping invalid custom question - no correct answer specified for non-coding question');
            continue;
          }
        }
        
        customQs.push({ 
          text, 
          options: isCoding ? [] : options, 
          correctIndices: finalCorrectIndices,
          correctIndex: finalCorrectIndices[0], 
          difficulty: difficulty || 'medium',
          isCoding: !!isCoding,
          starterCode: starterCode || '',
          testCases: Array.isArray(testCases) ? testCases : []
        });
        
        console.log(`[Test Creation] Custom Q: "${text}" - coding: ${!!isCoding}`);
        
        // Also populate legacy format (only if valid)
        legacyQuestions.push({ 
          text, 
          options: Array.isArray(options) ? options.map(o => ({ text: String(o) })) : [], 
          correctIndices: finalCorrectIndices,
          correctIndex: finalCorrectIndices[0]
        });
      }
    }
    
    if (libraryQuestionIds.length === 0 && customQs.length === 0) {
      console.log('[Institution.createTest] ⚠ no questions provided - creating test without questions');
    }
    
    // Enforce test limit if configured (0 or null = unlimited)
    const instId = req.institution?.id;
    const instDoc = instId ? await Institution.findById(instId).select('testLimit') : null;
    if (instDoc && typeof instDoc.testLimit === 'number' && instDoc.testLimit > 0) {
      const current = await Test.countDocuments({ createdBy: instId });
      if (current >= instDoc.testLimit) {
        console.log('[Institution.createTest] ✗ test limit reached -', current, '/', instDoc.testLimit);
        return res.status(403).json({ success: false, message: `Test limit reached (${current}/${instDoc.testLimit}). Contact your administrator to increase the limit.` });
      }
    }
    
    const t = await Test.create({
      name,
      type,
      durationMinutes: durationMinutes || 30,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
      assignedFaculty: assignedFacultyId || undefined,
      assignedBatches: Array.isArray(batchIds) ? batchIds : [],
      createdBy: req.institution?.id,
      libraryQuestionIds,  // NEW: Store library question references
      customQuestions: customQs,  // NEW: Store custom questions
      questions: legacyQuestions,  // LEGACY: Keep for backward compatibility
      creatorRole: 'institution',
    });
    
    console.log('[Institution.createTest] ✓ created - id:', t._id.toString(), 'name:', t.name, 'libraryQs:', libraryQuestionIds.length, 'customQs:', customQs.length);
    try { await AdminLog.createLog({ actorId: req.institution?.id, actorUsername: req.institution?.name, role: 'institution', actionType: 'create', message: `${req.institution?.name} created test ${t.name}`, refs: { entity: 'Test', id: t._id } }); } catch (e) {}
    res.status(201).json({ success: true, data: t });
  } catch (err) {
    console.error('[Institution.createTest] ✗ error:', err);
    res.status(500).json({ success: false, message: err.message || 'failed to create test' });
  }
};

const updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.updateTest] called by institution:', instName);
    console.log('[Institution.updateTest] target id:', id);
    
    const t = await Test.findOne({ _id: id, createdBy: req.institution?.id });
    if (!t) {
      console.log('[Institution.updateTest] ✗ test not found:', id);
      return res.status(404).json({ success: false, message: 'test not found' });
    }
    
    const { name, type, durationMinutes, startTime, endTime, assignedFacultyId, batchIds, 
            questionIds, customQuestions, removeQuestionIndices, 
            libraryQuestionIds: newLibraryIds, customQuestions: newCustomQs } = req.body || {};
    
    // Update basic fields
    if (name !== undefined) t.name = name;
    if (type !== undefined && ['aptitude', 'technical', 'psychometric', 'coding'].includes(type)) t.type = type;
    if (durationMinutes !== undefined) t.durationMinutes = durationMinutes;
    if (startTime !== undefined) t.startTime = startTime ? new Date(startTime) : undefined;
    if (endTime !== undefined) t.endTime = endTime ? new Date(endTime) : undefined;
    if (assignedFacultyId !== undefined) t.assignedFaculty = assignedFacultyId || undefined;
    if (Array.isArray(batchIds)) t.assignedBatches = batchIds;

    // NEW: Handle explicit libraryQuestionIds and customQuestions updates
    if (Array.isArray(newLibraryIds)) {
      t.libraryQuestionIds = newLibraryIds;
      console.log('[Institution.updateTest] updated libraryQuestionIds:', newLibraryIds.length);
    }
    
    if (Array.isArray(newCustomQs)) {
      t.customQuestions = newCustomQs.filter(cq => {
        const hasText = cq.text;
        const isCoding = cq.isCoding;
        const hasOptions = Array.isArray(cq.options) && cq.options.length >= 2;
        const hasSingleAnswer = typeof cq.correctIndex === 'number';
        const hasMultipleAnswers = Array.isArray(cq.correctIndices) && cq.correctIndices.length > 0;
        return hasText && (isCoding || (hasOptions && (hasSingleAnswer || hasMultipleAnswers)));
      }).map(cq => ({
        text: cq.text,
        options: cq.isCoding ? [] : cq.options,
        correctIndex: cq.correctIndex,
        correctIndices: cq.correctIndices,
        difficulty: cq.difficulty,
        isCoding: !!cq.isCoding,
        starterCode: cq.starterCode,
        testCases: cq.testCases
      }));
      console.log('[Institution.updateTest] updated customQuestions:', t.customQuestions.length);
    }

    // LEGACY: Handle old questions array removal
    if (removeQuestionIndices && Array.isArray(removeQuestionIndices)) {
      const sorted = [...removeQuestionIndices].sort((a, b) => b - a);
      for (const idx of sorted) {
        if (idx >= 0 && idx < t.questions.length) {
          t.questions.splice(idx, 1);
        }
      }
      console.log('[Institution.updateTest] removed', removeQuestionIndices.length, 'legacy questions');
    }

    // LEGACY: Handle old-style questionIds addition
    if (Array.isArray(questionIds) && questionIds.length) {
      const qs = await Question.find({ _id: { $in: questionIds }, category: t.type });
      for (const q of qs) {
        // Add to new libraryQuestionIds if not already present
        if (!t.libraryQuestionIds.some(id => String(id) === String(q._id))) {
          t.libraryQuestionIds.push(q._id);
        }
        // Also add to legacy questions for backward compatibility
        const exists = t.questions.some((tq) => String(tq.questionId) === String(q._id));
        if (!exists) {
          t.questions.push({
            questionId: q._id,
            text: q.text,
            options: (q.options || []).map((o) => o.text),
            correctIndex: q.correctIndex,
          });
        }
      }
      console.log('[Institution.updateTest] added', qs.length, 'library questions');
    }

    // LEGACY: Handle old-style customQuestions addition
    if (Array.isArray(customQuestions) && customQuestions.length) {
      for (const cq of customQuestions) {
        const { text, options, correctIndex, correctIndices, difficulty } = cq;
        if (!text || !Array.isArray(options) || options.length < 2) continue;
        
        const hasSingleAnswer = typeof correctIndex === 'number';
        const hasMultipleAnswers = Array.isArray(correctIndices) && correctIndices.length > 0;
        
        if (!hasSingleAnswer && !hasMultipleAnswers) continue;
        
        // Add to new customQuestions
        const newCq = { 
          text, 
          options, 
          difficulty: difficulty || 'medium' 
        };
        if (hasSingleAnswer) newCq.correctIndex = correctIndex;
        if (hasMultipleAnswers) newCq.correctIndices = correctIndices;
        t.customQuestions.push(newCq);
        
        // Also add to legacy questions
        const legacyQ = { questionId: undefined, text, options };
        if (hasSingleAnswer) legacyQ.correctIndex = correctIndex;
        if (hasMultipleAnswers) legacyQ.correctIndices = correctIndices;
        t.questions.push(legacyQ);
      }
      console.log('[Institution.updateTest] added', customQuestions.length, 'custom questions');
    }

    await t.save();
    console.log('[Institution.updateTest] ✓ updated - id:', t._id.toString());
    try { await AdminLog.createLog({ actorId: req.institution?.id, actorUsername: req.institution?.name, role: 'institution', actionType: 'edit', message: `${req.institution?.name} updated test ${t.name}`, refs: { entity: 'Test', id: t._id } }); } catch (e) {}
    res.json({ success: true, data: t });
  } catch (err) {
    console.error('[Institution.updateTest] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to update test' });
  }
};

const assignTestBatches = async (req, res) => {
  try {
    const { id } = req.params;
    const { batchIds } = req.body || {};
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.assignTestBatches] called by institution:', instName);
    console.log('[Institution.assignTestBatches] test id:', id, '| batchCount:', batchIds?.length || 0);
    
    const t = await Test.findOne({ _id: id, createdBy: req.institution?.id });
    if (!t) {
      console.log('[Institution.assignTestBatches] ✗ test not found:', id);
      return res.status(404).json({ success: false, message: 'test not found' });
    }
    
    t.assignedBatches = Array.isArray(batchIds) ? batchIds : [];
    await t.save();
    console.log('[Institution.assignTestBatches] ✓ assigned', t.assignedBatches.length, 'batches to test');
    res.json({ success: true, data: t });
  } catch (err) {
    console.error('[Institution.assignTestBatches] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to assign batches' });
  }
};

const deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const instName = req.institution?.name || 'unknown';
    console.log('[Institution.deleteTest] called by institution:', instName);
    console.log('[Institution.deleteTest] target id:', id);
    
    const t = await Test.findOneAndDelete({ _id: id, createdBy: req.institution?.id });
    if (!t) {
      console.log('[Institution.deleteTest] ✗ test not found:', id);
      return res.status(404).json({ success: false, message: 'test not found' });
    }
    
    const deletedAttempts = await TestAttempt.deleteMany({ testId: id });
    console.log('[Institution.deleteTest] ✓ deleted test - id:', t._id.toString(), 'name:', t.name);
    console.log('[Institution.deleteTest] also deleted', deletedAttempts.deletedCount, 'test attempts');
    try { await AdminLog.createLog({ actorId: req.institution?.id, actorUsername: req.institution?.name, role: 'institution', actionType: 'delete', message: `${req.institution?.name} deleted test ${t.name}`, refs: { entity: 'Test', id: t._id } }); } catch (e) {}
    res.json({ success: true });
  } catch (err) {
    console.error('[Institution.deleteTest] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to delete test' });
  }
};

// GET /institution/tests/:id/preview — full preview with correct answers for institution admin
const getTestPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const instId = req.institution?.id;
    console.log('[Institution.getTestPreview] called for test:', id, 'by institution:', req.institution?.name);

    const t = await Test.findOne({ _id: id, createdBy: instId });
    if (!t) return res.status(404).json({ success: false, message: 'test not found' });

    // Gather all questions with correct answers
    let allQuestions = [];
    if (typeof t.getAllQuestions === 'function') {
      try { allQuestions = await t.getAllQuestions(); } catch (e) { allQuestions = t.customQuestions || t.questions || []; }
    } else {
      allQuestions = t.customQuestions || t.questions || [];
    }

    const questionsWithAnswers = allQuestions.map((q, idx) => {
      const options = Array.isArray(q.options)
        ? q.options.map(o => (typeof o === 'string' ? o : (o && o.text) || String(o)))
        : [];

      let correctIndices = [];
      if (Array.isArray(q.correctIndices) && q.correctIndices.length > 0) correctIndices = q.correctIndices;
      else if (typeof q.correctIndex === 'number') correctIndices = [q.correctIndex];

      const correctAnswers = correctIndices.map(i => options[i]).filter(Boolean);

      return {
        number: idx + 1,
        _id: q._id,
        text: q.text,
        options,
        correctIndices,
        correctAnswers,
        isMultipleAnswer: correctIndices.length > 1,
        difficulty: q.difficulty || 'medium',
        isCoding: !!q.isCoding,
        starterCode: q.starterCode,
        testCases: q.testCases,
        source: q.source || 'custom',
      };
    });

    const preview = {
      _id: t._id,
      name: t.name,
      type: t.type,
      durationMinutes: t.durationMinutes,
      startTime: t.startTime,
      endTime: t.endTime,
      creatorRole: t.creatorRole || 'institution',
      totalQuestions: questionsWithAnswers.length,
      questions: questionsWithAnswers,
      // Answer sheet: ordered list of Q number -> correct option labels
      answerSheet: questionsWithAnswers.map(q => ({
        number: q.number,
        questionText: q.text,
        correctAnswers: q.isCoding
          ? ['[Coding — evaluated by test cases]']
          : q.correctAnswers.length > 0
            ? q.correctAnswers
            : ['(not set)'],
        correctOptionLabels: q.isCoding
          ? []
          : q.correctIndices.map(i => String.fromCharCode(65 + i)),
      })),
    };

    console.log('[Institution.getTestPreview] ✓ returning preview - questions:', questionsWithAnswers.length);
    res.json({ success: true, data: preview });
  } catch (err) {
    console.error('[Institution.getTestPreview] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to get test preview' });
  }
};

// =====================
// STUDENT TEST PARTICIPATION
// =====================

const listStudentTests = async (req, res) => {
  try {
    const studentId = req.student?.id;
    if (!studentId) return res.status(401).json({ success: false, message: 'unauthorized' });
    const batches = await Batch.find({ students: studentId }).select('_id');
    const batchIds = batches.map((b) => b._id);
    const now = new Date();
    const tests = await Test.find({
      $or: [
        { assignedStudents: studentId },
        { assignedBatches: { $in: batchIds } },
      ],
      $and: [
        { $or: [{ startTime: { $exists: false } }, { startTime: { $lte: now } }] },
        { $or: [{ endTime: { $exists: false } }, { endTime: { $gte: now } }] },
      ],
    }).sort({ startTime: 1 });

    // Compute real question count from whichever field has data
    const data = tests.map(t => {
      const customCount = Array.isArray(t.customQuestions) ? t.customQuestions.length : 0;
      const libraryCount = Array.isArray(t.libraryQuestionIds) ? t.libraryQuestionIds.length : 0;
      const legacyCount = Array.isArray(t.questions) ? t.questions.length : 0;
      const questionCount = customCount + libraryCount || legacyCount;
      const obj = t.toObject();
      obj.questionCount = questionCount;
      return obj;
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: 'failed to list student tests' });
  }
};

const getStudentTest = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student?.id;
    const batches = await Batch.find({ students: studentId }).select('_id');
    const batchIds = batches.map((b) => b._id);
    const t = await Test.findOne({
      _id: id,
      $or: [{ assignedStudents: studentId }, { assignedBatches: { $in: batchIds } }],
    });
    if (!t) return res.status(404).json({ success: false, message: 'test not found' });
    // Use model helper to gather library + custom questions if available
    let allQuestions = [];
    if (typeof t.getAllQuestions === 'function') {
      try {
        allQuestions = await t.getAllQuestions();
      } catch (e) {
        allQuestions = t.questions || [];
      }
    } else {
      allQuestions = t.questions || [];
    }
    // Safety fallback: if getAllQuestions returned empty but legacy questions exist, use them
    if (allQuestions.length === 0 && Array.isArray(t.questions) && t.questions.length > 0) {
      allQuestions = t.questions;
    }

    const sanitized = {
      _id: t._id,
      name: t.name,
      type: t.type,
      durationMinutes: t.durationMinutes,
      startTime: t.startTime,
      endTime: t.endTime,
      questions: allQuestions.map((q) => {
        // normalize options: may be strings or objects
        const options = Array.isArray(q.options) ? q.options.map(o => (typeof o === 'string' ? o : (o && o.text) || String(o))) : [];

        // Determine correct answers from available fields
        let correctIndices = [];
        if (Array.isArray(q.correctIndices) && q.correctIndices.length > 0) correctIndices = q.correctIndices;
        else if (typeof q.correctIndex === 'number') correctIndices = [q.correctIndex];

        return {
          _id: q._id,
          text: q.text,
          options,
          isMultipleAnswer: correctIndices.length > 1,
          isCoding: q.isCoding,
          starterCode: q.starterCode,
          testCases: q.testCases
        };
      }),
    };

    // If options are missing for many questions, attempt to load original Question docs by libraryQuestionIds
    try {
      const missingCount = (sanitized.questions || []).filter(q => !Array.isArray(q.options) || q.options.length === 0).length;
      if (missingCount > 0 && Array.isArray(t.libraryQuestionIds) && t.libraryQuestionIds.length > 0) {
        const libs = await Question.find({ _id: { $in: t.libraryQuestionIds } }).lean();
        const libMap = {};
        libs.forEach((l) => { libMap[String(l._id)] = l; });
        sanitized.questions = sanitized.questions.map((q, idx) => {
          // try match by questionId (from getAllQuestions) or by index if lengths match
          const qId = q.questionId || (t.libraryQuestionIds && t.libraryQuestionIds[idx] ? String(t.libraryQuestionIds[idx]) : null);
          if (qId && libMap[qId]) {
            const opts = Array.isArray(libMap[qId].options) ? libMap[qId].options.map(o => (o && o.text) || String(o)) : [];
            return { ...q, options: opts };
          }
          return q;
        });
      }
    } catch (e) {
      console.log('[Institution.getStudentTest] fallback lib load failed:', e && e.message);
    }

    // Debug: log question/options counts to help diagnose prod vs dev differences
    try {
      const counts = (sanitized.questions || []).map((q) => ({ text: q.text, options: Array.isArray(q.options) ? q.options.length : 0 }));
      console.log('[Institution.getStudentTest] sending sanitized test:', { testId: t._id.toString(), questionCount: (sanitized.questions || []).length, optionCounts: counts });
    } catch (e) {
      console.log('[Institution.getStudentTest] debug log failed:', e && e.message);
    }

    res.json({ success: true, data: sanitized });
    try { await AdminLog.createLog({ actorId: studentId, actorUsername: req.student?.username, role: 'student', actionType: 'view', message: `${req.student?.username} viewed test ${t.name}`, refs: { entity: 'Test', id: t._id } }); } catch (e) {}
  } catch (err) {
    res.status(500).json({ success: false, message: 'failed to get test' });
  }
};

const startTestAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student?.id;
    const studentUsername = req.student?.username;
    console.log('[Institution.startTestAttempt] called by student:', studentUsername);
    console.log('[Institution.startTestAttempt] test id:', id);
    
    const t = await Test.findById(id);
    if (!t) {
      console.log('[Institution.startTestAttempt] ✗ test not found:', id);
      return res.status(404).json({ success: false, message: 'test not found' });
    }
    
    const batches = await Batch.find({ students: studentId }).select('_id');
    const batchIds = batches.map((b) => b._id.toString());
    const eligible = t.assignedStudents?.map(String).includes(String(studentId)) || t.assignedBatches?.map(String).some((b) => batchIds.includes(b));
    if (!eligible) {
      console.log('[Institution.startTestAttempt] ✗ student not eligible for test:', id);
      return res.status(403).json({ success: false, message: 'not eligible for this test' });
    }
    
    let attempt = await TestAttempt.findOne({ testId: id, studentId });
    if (!attempt) {
      attempt = await TestAttempt.create({ testId: id, studentId, total: t.questions.length });
      console.log('[Institution.startTestAttempt] ✓ new attempt created - id:', attempt._id.toString());
    } else {
      console.log('[Institution.startTestAttempt] ✓ existing attempt found - id:', attempt._id.toString());
    }
    
    res.json({ success: true, data: { attemptId: attempt._id, startedAt: attempt.startedAt } });
  } catch (err) {
    console.error('[Institution.startTestAttempt] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to start attempt' });
  }
};

const submitTestAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.student?.id;
    const studentUsername = req.student?.username;
    const { responses, startedAt } = req.body || {};
    console.log('[Institution.submitTestAttempt] called by student:', studentUsername);
    console.log('[Institution.submitTestAttempt] test id:', id, '| responseCount:', responses?.length || 0);
    
    const t = await Test.findById(id);
    if (!t) {
      console.log('[Institution.submitTestAttempt] ✗ test not found:', id);
      return res.status(404).json({ success: false, message: 'test not found' });
    }
    
    // Use unified question list (library + custom) for grading so counts match frontend
    let questionsForGrading = [];
    if (typeof t.getAllQuestions === 'function') {
      try { questionsForGrading = await t.getAllQuestions(); } catch (e) { questionsForGrading = t.questions || []; }
    } else {
      questionsForGrading = t.questions || [];
    }

    if (!Array.isArray(responses) || responses.length !== questionsForGrading.length) {
      console.log('[Institution.submitTestAttempt] ✗ invalid response count', { expected: questionsForGrading.length, received: Array.isArray(responses) ? responses.length : 0 });
      return res.status(400).json({ success: false, message: 'invalid responses payload' });
    }

    const now = new Date();
    const start = startedAt ? new Date(startedAt) : now;
    const secs = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 1000));
    let correctCount = 0;
    const respRecords = [];

    for (let i = 0; i < questionsForGrading.length; i++) {
      const q = questionsForGrading[i];
      const sel = responses[i];
      
      // Support both single answer (number) and multiple answers (array)
      let isCorrect = false;
      let selectedIndices = [];
      
      if (Array.isArray(sel)) {
        // Multiple answers selected
        selectedIndices = sel.map(Number);
      } else if (typeof sel === 'number' || !isNaN(Number(sel))) {
        // Single answer selected (backward compatibility)
        selectedIndices = [Number(sel)];
      }
      
      // Handle Coding Questions
      if (q.isCoding) {
        let submittedCode = '';
        let submittedLanguage = 'javascript';
        
        if (typeof sel === 'object' && sel !== null) {
          submittedCode = sel.code || '';
          submittedLanguage = sel.language || 'javascript';
        } else {
          submittedCode = sel || '';
        }
        
        console.log(`[Grading] Q${i + 1} (Coding): Executing submitted code with language: ${submittedLanguage}...`);
        
        try {
          // Re-use logic for Piston execution
          const PISTON_API = 'https://emkc.org/api/v2/piston/execute';
          const runtimes = {
            'javascript': { language: 'javascript', version: '18.15.0' },
            'python': { language: 'python', version: '3.10.0' },
            'java': { language: 'java', version: '15.0.2' },
            'cpp': { language: 'c++', version: '10.2.0' },
            'c': { language: 'c', version: '10.2.0' }
          };
          const runtime = runtimes[submittedLanguage] || runtimes['javascript'];
          
          let passedCases = 0;
          const testCases = q.testCases || [];
          
          if (testCases.length > 0) {
            for (const tc of testCases) {
              const payload = {
                language: runtime.language,
                version: runtime.version,
                files: [{ content: submittedCode }],
                stdin: tc.input || '',
              };
              
              const pistonRes = await axios.post(PISTON_API, payload);
              const { run } = pistonRes.data;
              const actual = (run.output || '').trim();
              const expected = (tc.output || '').trim();
              if (actual === expected) passedCases++;
            }
            
            // Score is strict LeetCode style: only 100% if all pass
            if (passedCases === testCases.length) {
              isCorrect = true;
              correctCount += 1;
              console.log(`[Grading] Q${i + 1} (Coding) Result: ${passedCases}/${testCases.length} passed. ALL PASSED. Full credit.`);
            } else {
              isCorrect = false;
              console.log(`[Grading] Q${i + 1} (Coding) Result: ${passedCases}/${testCases.length} passed. FAILED. 0 credit.`);
            }
          } else {
            // No test cases? Mark as correct if any code submitted?
            isCorrect = true;
            correctCount += 1;
          }
        } catch (err) {
          console.error(`[Grading] Q${i + 1} (Coding) execution failed:`, err.message);
          isCorrect = false;
        }
      } else {
        // Handle MCQ Questions
        // Get correct indices from unified question object; support both formats
        const correctIndices = Array.isArray(q.correctIndices) && q.correctIndices.length > 0
          ? q.correctIndices
          : (typeof q.correctIndex === 'number' ? [q.correctIndex] : []);
        
        console.log(`[Grading] Q${i + 1}: "${q.text}" - Student selected: [${selectedIndices.join(', ')}], Correct: [${correctIndices.join(', ')}]`);
        
        // Check if selected answers match correct answers exactly
        if (selectedIndices.length === correctIndices.length) {
          const sortedSelected = [...selectedIndices].sort((a, b) => a - b);
          const sortedCorrect = [...correctIndices].sort((a, b) => a - b);
          isCorrect = sortedSelected.every((val, idx) => val === sortedCorrect[idx]);
        }
        
        console.log(`[Grading] Q${i + 1} Result: ${isCorrect ? 'CORRECT ✓' : 'WRONG ✗'}`);
        if (isCorrect) correctCount++;
      }
      
      // Build response objects that match TestAttempt ResponseSchema
      respRecords.push({
        questionId: q.questionId || undefined,
        selectedIndex: selectedIndices[0] || -1,
        selectedIndices: selectedIndices,
        correct: isCorrect,
      });
    }
    const score = Math.round((correctCount / questionsForGrading.length) * 100);

    let attempt = await TestAttempt.findOne({ testId: id, studentId });
    if (!attempt) {
      attempt = await TestAttempt.create({ testId: id, studentId, total: questionsForGrading.length, correctCount, score, responses: respRecords, timeTakenSeconds: secs, completedAt: now });
      console.log('[Institution.submitTestAttempt] ✓ new attempt submitted - score:', score);
    } else {
      attempt.correctCount = correctCount;
      attempt.score = score;
      attempt.responses = respRecords;
      attempt.timeTakenSeconds = secs;
      attempt.completedAt = now;
      await attempt.save();
      console.log('[Institution.submitTestAttempt] ✓ attempt updated - score:', score);
    }
    
    res.json({ success: true, data: { score, correctCount, total: t.questions.length } });
  } catch (err) {
    console.error('[Institution.submitTestAttempt] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to submit attempt' });
  }
};

// =====================
// FACULTY VIEWS
// =====================

const listAssignedTestsForFaculty = async (req, res) => {
  try {
    const facultyId = req.faculty?.id;
    const facultyUsername = req.faculty?.username;
    console.log('[Institution.listAssignedTestsForFaculty] called by faculty:', facultyUsername);
    
    const tests = await Test.find({ assignedFaculty: facultyId }).sort({ startTime: 1 });
    
    // Sanitize tests - remove correct answers from questions for faculty
    const sanitizedTests = tests.map(t => ({
      _id: t._id,
      name: t.name,
      type: t.type,
      durationMinutes: t.durationMinutes,
      startTime: t.startTime,
      endTime: t.endTime,
      questions: t.questions.map(q => {
        // Normalize options - handle both string arrays and object arrays
        const normalizedOptions = Array.isArray(q.options) 
          ? q.options.map(opt => typeof opt === 'string' ? opt : (opt.text || String(opt)))
          : [];
        
        return {
          text: q.text,
          options: normalizedOptions,
          // DO NOT include correctIndex or correctIndices for faculty
        };
      })
    }));
    
    console.log('[Institution.listAssignedTestsForFaculty] ✓ found', tests.length, 'assigned tests');
    res.json({ success: true, data: sanitizedTests });
  } catch (err) {
    console.error('[Institution.listAssignedTestsForFaculty] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to list assigned tests' });
  }
};

const getTestResultsForFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const facultyId = req.faculty?.id;
    const facultyUsername = req.faculty?.username;
    console.log('[Institution.getTestResultsForFaculty] called by faculty:', facultyUsername);
    console.log('[Institution.getTestResultsForFaculty] test id:', id);
    
    const t = await Test.findById(id);
    if (!t) {
      console.log('[Institution.getTestResultsForFaculty] ✗ test not found:', id);
      return res.status(404).json({ success: false, message: 'test not found' });
    }
    
    if (String(t.assignedFaculty) !== String(facultyId)) {
      console.log('[Institution.getTestResultsForFaculty] ✗ forbidden - test not assigned to faculty');
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
    
    // Sanitize test data - remove correct answers from questions for faculty
    const sanitizedTest = {
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
        
        console.log(`[Faculty Results] Q${idx + 1}: "${q.text}" has ${normalizedOptions.length} options`);
        
        return {
          text: q.text,
          options: normalizedOptions,
          // DO NOT include correctIndex or correctIndices for faculty
        };
      })
    };
    
    console.log('[Institution.getTestResultsForFaculty] ✓ found results - total students:', studentIds.length, ', completed:', attempts.filter(a => a.completedAt).length, ', questions:', sanitizedTest.questions.length);
    res.json({ success: true, data: { test: sanitizedTest, status } });
  } catch (err) {
    console.error('[Institution.getTestResultsForFaculty] ✗ error:', err.message);
    res.status(500).json({ success: false, message: 'failed to get results' });
  }
};

// =====================
// FACULTY SELF-SERVICE
// =====================

const listFacultyAnnouncements = async (req, res) => {
  try {
    const facultyId = req.faculty?.id;
    const facultyUsername = req.faculty?.username;
    console.log('[Institution.listFacultyAnnouncements] called by faculty:', facultyUsername);
    
    if (!facultyId) {
      console.log('[Institution.listFacultyAnnouncements] ✗ unauthorized');
      return res.status(401).json({ success: false, message: 'unauthorized' });
    }

    const [batches, tests] = await Promise.all([
      Batch.find({ faculty: facultyId }).populate('createdBy', 'name institutionId').select('name createdAt createdBy'),
      Test.find({ assignedFaculty: facultyId }).populate('createdBy', 'name institutionId').select('name type createdAt createdBy'),
    ]);

    const announcements = [
      ...batches.map((b) => ({
        type: 'batch',
        title: b.name,
        createdAt: b.createdAt,
        institution: b.createdBy ? b.createdBy.name : undefined,
      })),
      ...tests.map((t) => ({
        type: 'test',
        title: t.name,
        testType: t.type,
        createdAt: t.createdAt,
        institution: t.createdBy ? t.createdBy.name : undefined,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log('[Institution.listFacultyAnnouncements] ✓ found', announcements.length, 'announcements (batches:', batches.length, ', tests:', tests.length, ')');
    return res.json({ success: true, data: announcements });
  } catch (err) {
    console.error('[Institution.listFacultyAnnouncements] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const listFacultyBatches = async (req, res) => {
  try {
    const facultyId = req.faculty?.id;
    const facultyUsername = req.faculty?.username;
    console.log('[Institution.listFacultyBatches] called by faculty:', facultyUsername);
    
    if (!facultyId) {
      console.log('[Institution.listFacultyBatches] ✗ unauthorized');
      return res.status(401).json({ success: false, message: 'unauthorized' });
    }

    const docs = await Batch.find({ faculty: facultyId })
      .populate('students', 'username name regno email')
      .populate('createdBy', 'name institutionId');

    console.log('[Institution.listFacultyBatches] ✓ found', docs.length, 'batches');
    return res.json({ success: true, data: docs });
  } catch (err) {
    console.error('[Institution.listFacultyBatches] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const welcome = (req, res) => {
  res.json({ success: true, message: `Welcome to the institution dashboard` });
};

// =====================
// ANNOUNCEMENTS
// =====================

const listInstitutionAnnouncements = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    console.log('[Institution.listAnnouncements] called by institution:', instName);
    
    if (!instId) {
      console.log('[Institution.listAnnouncements] ✗ unauthorized');
      return res.status(401).json({ success: false, message: 'unauthorized' });
    }
    
    const announcements = await Announcement.find({ targetInstitutions: instId })
      .populate({ path: 'createdByRef', select: 'username name' })
      .sort({ createdAt: -1 });
    
    // Add isRead flag for each announcement
    const data = announcements.map((a) => {
      const creator = a.createdByRef && (a.createdByRef.username || a.createdByRef.name || null);
      return {
        _id: a._id,
        message: a.message,
        createdBy: { role: a.createdByRole || null, id: a.createdByRef ? a.createdByRef._id : null, name: creator },
        createdAt: a.createdAt,
        isRead: Array.isArray(a.readBy) && a.readBy.some((id) => String(id) === String(instId)),
      };
    });
    
    console.log('[Institution.listAnnouncements] ✓ found', announcements.length, 'announcements');
    return res.json({ success: true, data });
  } catch (err) {
    console.error('[Institution.listAnnouncements] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const markAnnouncementAsRead = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const { id } = req.params;
    console.log('[Institution.markAnnouncementAsRead] called by institution:', instName);
    console.log('[Institution.markAnnouncementAsRead] announcement id:', id);
    
    if (!instId) {
      console.log('[Institution.markAnnouncementAsRead] ✗ unauthorized');
      return res.status(401).json({ success: false, message: 'unauthorized' });
    }
    
    const announcement = await Announcement.findOne({ _id: id, targetInstitutions: instId });
    if (!announcement) {
      console.log('[Institution.markAnnouncementAsRead] ✗ announcement not found or not targeted:', id);
      return res.status(404).json({ success: false, message: 'announcement not found' });
    }
    
    // Add institution to readBy if not already present
    if (!announcement.readBy.some((rid) => String(rid) === String(instId))) {
      announcement.readBy.push(instId);
      await announcement.save();
      console.log('[Institution.markAnnouncementAsRead] ✓ marked as read - id:', id);
    } else {
      console.log('[Institution.markAnnouncementAsRead] already read - id:', id);
    }
    
    return res.json({ success: true, message: 'marked as read' });
  } catch (err) {
    console.error('[Institution.markAnnouncementAsRead] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================
// STUDENT RESULTS
// =====================

const listStudentResults = async (req, res) => {
  try {
    const studentId = req.student && req.student.id;
    if (!studentId) return res.status(401).json({ success: false, message: 'unauthorized' });

    // Find attempts by this student, include related test summary
    const attempts = await TestAttempt.find({ studentId })
      .sort({ completedAt: -1, startedAt: -1 })
      .populate({ path: 'testId', select: 'name type durationMinutes startTime endTime' });

    const data = attempts.map((a) => ({
      _id: a._id,
      testId: a.testId?._id || a.testId,
      testName: a.testId?.name,
      testType: a.testId?.type,
      durationMinutes: a.testId?.durationMinutes,
      startedAt: a.startedAt,
      completedAt: a.completedAt || null,
      timeTakenSeconds: a.timeTakenSeconds || null,
      correctCount: a.correctCount,
      total: a.total,
      score: a.score,
      status: a.completedAt ? 'completed' : 'in-progress',
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('[Institution.listStudentResults] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const createInstitutionAnnouncement = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    console.log('[Institution.createAnnouncement] called by institution:', instName);

    if (!instId) return res.status(401).json({ success: false, message: 'unauthorized' });

    const { message, targetFacultyIds, targetStudentIds, targetBatchIds, sendToAllFaculty, sendToAllStudents, sendToAllBatches } = req.body || {};
    console.log('[Institution.createAnnouncement] payload: targets(faculty:', (targetFacultyIds||[]).length, ' students:', (targetStudentIds||[]).length, ' batches:', (targetBatchIds||[]).length, ')');

    if (!message || !message.trim()) {
      console.log('[Institution.createAnnouncement] ✗ empty message');
      return res.status(400).json({ success: false, message: 'message required' });
    }

    // Resolve send-to-all flags into explicit ids
    let facultyTargets = Array.isArray(targetFacultyIds) ? targetFacultyIds : [];
    let studentTargets = Array.isArray(targetStudentIds) ? targetStudentIds : [];
    let batchTargets = Array.isArray(targetBatchIds) ? targetBatchIds : [];

    if (sendToAllFaculty) {
      const faculty = await Faculty.find({ createdBy: instId }).select('_id');
      facultyTargets = faculty.map((f) => f._id);
    }
    if (sendToAllStudents) {
      const students = await Student.find({ createdBy: instId }).select('_id');
      studentTargets = students.map((s) => s._id);
    }
    if (sendToAllBatches) {
      const batches = await Batch.find({ createdBy: instId }).select('_id');
      batchTargets = batches.map((b) => b._id);
    }

    // Store institution-passed announcements for students/batches in dedicated collection
    const studentAnnouncement = await InstitutionAnnouncement.create({
      message: message.trim(),
      institution: instId,
      targetStudents: studentTargets,
      targetBatches: batchTargets,
    });

    console.log('[Institution.createAnnouncement] ✓ created student announcement - id:', studentAnnouncement._id.toString());
    return res.status(201).json({ success: true, data: studentAnnouncement });
  } catch (err) {
    console.error('[Institution.createAnnouncement] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// announcements visible to a faculty member (institution-scoped)
const listAnnouncementsForFaculty = async (req, res) => {
  try {
    const facultyId = req.faculty && req.faculty.id;
    console.log('[Institution.listAnnouncementsForFaculty] called by faculty:', facultyId);
    if (!facultyId) return res.status(401).json({ success: false, message: 'unauthorized' });

    const facultyDoc = await Faculty.findById(facultyId).select('createdBy');
    const instId = facultyDoc ? facultyDoc.createdBy : null;

    // batches taught by faculty
    const batches = await Batch.find({ faculty: facultyId }).select('_id');
    const batchIds = batches.map((b) => b._id);

    const anns = await Announcement.find({
      $or: [
        { targetInstitutions: instId },
        { targetFaculty: facultyId },
        { targetBatches: { $in: batchIds } },
      ],
    }).sort({ createdAt: -1 });

    return res.json({ success: true, data: anns });
  } catch (err) {
    console.error('[Institution.listAnnouncementsForFaculty] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// announcements visible to a student
const listAnnouncementsForStudent = async (req, res) => {
  try {
    const studentId = req.student && req.student.id;
    console.log('[Institution.listAnnouncementsForStudent] called by student:', studentId);
    if (!studentId) return res.status(401).json({ success: false, message: 'unauthorized' });

    const studentDoc = await Student.findById(studentId).select('createdBy');
    const instId = studentDoc ? studentDoc.createdBy : null;

    const batches = await Batch.find({ students: studentId }).select('_id');
    const batchIds = batches.map((b) => b._id);

    // Fetch from dedicated InstitutionAnnouncement collection
    const anns = await InstitutionAnnouncement.find({
      institution: instId,
      $or: [
        { targetStudents: studentId },
        { targetBatches: { $in: batchIds } },
        // If no explicit targets, treat as institution-wide to all students
        { $and: [ { targetStudents: { $size: 0 } }, { targetBatches: { $size: 0 } } ] },
      ],
    })
      .sort({ createdAt: -1 })
      .select('_id message createdAt');

    return res.json({ success: true, data: anns });
  } catch (err) {
    console.error('[Institution.listAnnouncementsForStudent] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  // Auth & basic
  login,
  facultyLogin,
  studentLogin,
  welcome,

  // Faculty CRUD
  listFaculties,
  createFaculty,
  updateFaculty,
  deleteFaculty,

  // Student CRUD
  listStudents,
  createStudent,
  updateStudent,
  deleteStudent,

  // Batch CRUD
  listBatches,
  createBatch,
  updateBatch,
  deleteBatch,

  // Question library
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,

  // Tests
  listTests,
  getTest,
  createTest,
  updateTest,
  deleteTest,
  assignTestBatches,
  getTestPreview,

  // Student participation
  listStudentTests,
  getStudentTest,
  startTestAttempt,
  submitTestAttempt,
  listStudentResults,

  // Faculty views
  listAssignedTestsForFaculty,
  getTestResultsForFaculty,

  // Faculty self-service
  listFacultyAnnouncements,
  listFacultyBatches,
  
  // Institution announcements
  listInstitutionAnnouncements,
  markAnnouncementAsRead,
  createInstitutionAnnouncement,
  listAnnouncementsForFaculty,
  listAnnouncementsForStudent,
};
