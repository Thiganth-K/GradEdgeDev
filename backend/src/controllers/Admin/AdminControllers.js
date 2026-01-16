const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');
const Institution = require('../../models/Institution');
const Announcement = require('../../models/Announcement');
const Contributor = require('../../models/Contributor');
const ContributorRequest = require('../../models/ContributorRequest');
const AdminContributorChat = require('../../models/AdminContributorChat');
const Question = require('../../models/Question');
const Library = require('../../models/Library');
const Batch = require('../../models/Batch');

const login = async (req, res) => {
  const { username, password } = req.body || {};
  console.log('[Admin.login] called', { username });
  if (!username || !password) {
    console.log('[Admin.login] missing credentials');
    return res.status(400).json({ success: false, message: 'username and password required' });
  }

  try {
    const admin = await Admin.findOne({ username });
    if (!admin) {
      console.log('[Admin.login] user not found', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) {
      console.log('[Admin.login] invalid password for', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    // Sign admin JWT
    const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET;
    if (!secret) {
      console.error('[Admin.login] ADMIN_JWT_SECRET not configured');
      return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
    }

    const token = jwt.sign({ id: admin._id, username: admin.username, role: 'admin' }, secret, { expiresIn: '7d' });
    console.log('[Admin.login] authenticated', username, '- generated token');
    // Log admin login
    try { await AdminLog.createLog({ actorId: admin._id, actorUsername: admin.username, role: 'admin', actionType: 'login', message: `${admin.username} logged in` }); } catch (e) { }
    return res.json({ success: true, role: 'admin', token, data: { id: admin._id, username: admin.username } });
  } catch (err) {
    console.error('[Admin.login] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Institution management (admin-protected)
const listInstitutions = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    console.log('[Admin.listInstitutions] called by', adminUser);
    
    // Only return institutions created by this admin
    const adminId = req.admin && req.admin.id;
    const query = adminId ? { createdBy: adminId } : {};
    const list = await Institution.find(query, { passwordHash: 0 }).lean();
    
    console.log('[Admin.listInstitutions] ✓ found', list.length, 'institutions');
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('[Admin.listInstitutions] ✗ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const createInstitution = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    console.log('[Admin.createInstitution] called by', adminUser);
    
    const { name, institutionId, password, location, contactNo, email, facultyLimit, studentLimit, batchLimit, testLimit } = req.body || {};
    console.log('[Admin.createInstitution] payload: { name:', name, ', institutionId:', institutionId, ', location:', location, ', limits:', { facultyLimit, studentLimit, batchLimit, testLimit }, '}');
    
    if (!name || !institutionId || !password) {
      console.log('[Admin.createInstitution] ✗ missing required fields');
      return res.status(400).json({ success: false, message: 'name, institutionId and password required' });
    }

    const exists = await Institution.findOne({ institutionId });
    if (exists) {
      console.log('[Admin.createInstitution] ✗ institutionId already exists:', institutionId);
      return res.status(409).json({ success: false, message: 'institutionId already exists' });
    }

    // enforce per-admin creation limit
    const adminId = req.admin && req.admin.id;
    const adminDoc = adminId ? await Admin.findById(adminId) : null;
    const limit = (adminDoc && typeof adminDoc.institutionLimit === 'number') ? adminDoc.institutionLimit : 10;
    const currentCount = adminId ? await Institution.countDocuments({ createdBy: adminId }) : 0;
    if (currentCount >= limit) {
      console.log('[Admin.createInstitution] ✗ limit reached for admin', adminId, '- current:', currentCount, 'limit:', limit);
      return res.status(403).json({ success: false, message: `institution create limit reached (${limit})` });
    }

    const hash = await bcrypt.hash(password, 10);
    const parsed = (v) => (v === undefined || v === null || v === '') ? null : Number(v);
    const created = await Institution.create({
      name,
      institutionId,
      passwordHash: hash,
      location,
      contactNo,
      email,
      createdBy: adminId,
      facultyLimit: parsed(facultyLimit),
      studentLimit: parsed(studentLimit),
      batchLimit: parsed(batchLimit),
      testLimit: parsed(testLimit),
    });
    console.log('[Admin.createInstitution] ✓ created - id:', created._id.toString(), 'name:', created.name, 'institutionId:', created.institutionId);
    try { await AdminLog.createLog({ actorId: adminId, actorUsername: adminUser, role: 'admin', actionType: 'create', message: `${adminUser} created institution ${created.name} (${created.institutionId})`, refs: { entity: 'Institution', id: created._id } }); } catch (e) {}
    res.json({ success: true, data: { id: created._id, name: created.name, institutionId: created.institutionId, facultyLimit: created.facultyLimit ?? null, studentLimit: created.studentLimit ?? null, batchLimit: created.batchLimit ?? null, testLimit: created.testLimit ?? null } });
  } catch (err) {
    console.error('[Admin.createInstitution] ✗ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateInstitution = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const id = req.params.id;
    console.log('[Admin.updateInstitution] called by', adminUser);
    console.log('[Admin.updateInstitution] target id:', id);
    
    const adminId = req.admin && req.admin.id;
    if (!adminId) {
      console.log('[Admin.updateInstitution] ✗ unauthorized access');
      return res.status(401).json({ success: false, message: 'unauthorized' });
    }
    
    const { name, password, location, contactNo, email, facultyLimit, studentLimit, batchLimit, testLimit } = req.body || {};
    console.log('[Admin.updateInstitution] payload: { name:', name, ', location:', location, ', contactNo:', contactNo, '}');
    
    const update = {};
    if (name) update.name = name;
    if (location) update.location = location;
    if (contactNo) update.contactNo = contactNo;
    if (email) update.email = email;
    if (password) update.passwordHash = await bcrypt.hash(password, 10);
    const parsed = (v) => (v === undefined || v === null || v === '') ? null : Number(v);
    if (facultyLimit !== undefined) update.facultyLimit = parsed(facultyLimit);
    if (studentLimit !== undefined) update.studentLimit = parsed(studentLimit);
    if (batchLimit !== undefined) update.batchLimit = parsed(batchLimit);
    if (testLimit !== undefined) update.testLimit = parsed(testLimit);

    const updated = await Institution.findOneAndUpdate({ _id: id, createdBy: adminId }, update, { new: true }).lean();
    if (!updated) {
      console.log('[Admin.updateInstitution] ✗ institution not found:', id);
      return res.status(404).json({ success: false, message: 'institution not found' });
    }
    
    console.log('[Admin.updateInstitution] ✓ updated institution - id:', updated._id, 'name:', updated.name);
    try { await AdminLog.createLog({ actorId: adminId, actorUsername: adminUser, role: 'admin', actionType: 'edit', message: `${adminUser} updated institution ${updated.name}`, refs: { entity: 'Institution', id: updated._id } }); } catch (e) {}
    res.json({ success: true, data: { id: updated._id, name: updated.name, facultyLimit: updated.facultyLimit ?? null, studentLimit: updated.studentLimit ?? null, batchLimit: updated.batchLimit ?? null, testLimit: updated.testLimit ?? null } });
  } catch (err) {
    console.error('[Admin.updateInstitution] ✗ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteInstitution = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const id = req.params.id;
    console.log('[Admin.deleteInstitution] called by', adminUser);
    console.log('[Admin.deleteInstitution] target id:', id);
    
    const adminId = req.admin && req.admin.id;
    if (!adminId) {
      console.log('[Admin.deleteInstitution] ✗ unauthorized access');
      return res.status(401).json({ success: false, message: 'unauthorized' });
    }
    
    const del = await Institution.findOneAndDelete({ _id: id, createdBy: adminId }).lean();
    if (!del) {
      console.log('[Admin.deleteInstitution] ✗ institution not found:', id);
      return res.status(404).json({ success: false, message: 'institution not found' });
    }
    
    console.log('[Admin.deleteInstitution] ✓ deleted institution - id:', del._id, 'name:', del.name);
    try { await AdminLog.createLog({ actorId: adminId, actorUsername: adminUser, role: 'admin', actionType: 'delete', message: `${adminUser} deleted institution ${del.name}`, refs: { entity: 'Institution', id: del._id } }); } catch (e) {}
    res.json({ success: true, data: { id: del._id } });
  } catch (err) {
    console.error('[Admin.deleteInstitution] ✗ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getInstitutions = (req, res) => {
  const sample = [
    { id: 1, name: 'City University', status: 'Active' },
    { id: 2, name: 'Greenfield College', status: 'Pending' },
  ];
  res.json({ success: true, data: sample });
};

const getLogs = (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const logFile = path.resolve(__dirname, '../../logs/actions.log');
  
  try {
    if (!fs.existsSync(logFile)) {
      console.log('[Admin.getLogs] ✗ log file not found');
      return res.json({ success: true, data: [] });
    }
    
    const content = fs.readFileSync(logFile, 'utf-8');
    const lines = content.trim().split('\n').filter(l => l.trim());
    const logs = lines
      .map((line, idx) => {
        try {
          const parsed = JSON.parse(line);
          return { id: idx + 1, ...parsed };
        } catch (e) {
          return null;
        }
      })
      .filter(l => l !== null)
      .reverse(); // Most recent first
    
    // Limit to last 500 logs to avoid huge payloads
    const limited = logs.slice(0, 500);
    console.log('[Admin.getLogs] ✓ returning', limited.length, 'log entries');
    res.json({ success: true, data: limited });
  } catch (err) {
    console.error('[Admin.getLogs] ✗ error reading logs:', err.message);
    res.status(500).json({ success: false, message: 'failed to read logs' });
  }
};

// =====================
// ANNOUNCEMENTS
// =====================

const createAnnouncement = async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    const adminUsername = req.admin && req.admin.username;
    const { message, targetInstitutionIds } = req.body || {};
    console.log('[Admin.createAnnouncement] called by admin:', adminUsername);
    console.log('[Admin.createAnnouncement] target institutions:', targetInstitutionIds?.length || 0);
    
    if (!message || !message.trim()) {
      console.log('[Admin.createAnnouncement] ✗ empty message');
      return res.status(400).json({ success: false, message: 'message required' });
    }
    
    // If targetInstitutionIds not provided or empty, send to all institutions created by this admin
    let targets = [];
    if (Array.isArray(targetInstitutionIds) && targetInstitutionIds.length > 0) {
      targets = targetInstitutionIds;
    } else {
      const institutions = await Institution.find({ createdBy: adminId }).select('_id');
      targets = institutions.map((i) => i._id);
    }
    
    if (targets.length === 0) {
      console.log('[Admin.createAnnouncement] ✗ no target institutions found');
      return res.status(400).json({ success: false, message: 'no institutions to send announcement to' });
    }
    
    const announcement = await Announcement.create({
      message: message.trim(),
      createdByRef: adminId,
      createdByRole: 'admin',
      targetInstitutions: targets,
      readBy: [],
    });
    
    console.log('[Admin.createAnnouncement] ✓ created announcement - id:', announcement._id.toString(), 'targets:', targets.length);
    try { await AdminLog.createLog({ actorId: adminId, actorUsername: adminUsername, role: 'admin', actionType: 'create', message: `${adminUsername} created announcement ${announcement._id}`, refs: { entity: 'Announcement', id: announcement._id } }); } catch (e) {}
    return res.status(201).json({ success: true, data: announcement });
  } catch (err) {
    console.error('[Admin.createAnnouncement] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const listAnnouncements = async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    const adminUsername = req.admin && req.admin.username;
    console.log('[Admin.listAnnouncements] called by admin:', adminUsername);
    
    const announcements = await Announcement.find({ createdByRef: adminId, createdByRole: 'admin' })
      .populate('targetInstitutions', 'name institutionId')
      .populate('readBy', 'name institutionId')
      .sort({ createdAt: -1 });
    
    console.log('[Admin.listAnnouncements] ✓ found', announcements.length, 'announcements');
    return res.json({ success: true, data: announcements });
  } catch (err) {
    console.error('[Admin.listAnnouncements] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =====================
// CONTRIBUTORS (admin-protected)
// =====================

const createContributor = async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    const adminUsername = req.admin && req.admin.username;
    console.log('[Admin.createContributor] called by admin:', adminUsername);

    const { username, password, fname, lname, contact, email } = req.body || {};
    console.log('[Admin.createContributor] payload:', { username, fname, lname, contact, email: !!email });

    if (!username || !password || !fname || !lname) {
      console.log('[Admin.createContributor] ✗ missing required fields');
      return res.status(400).json({ success: false, message: 'username, password, fname and lname are required' });
    }

    const exists = await Contributor.findOne({ username });
    if (exists) {
      console.log('[Admin.createContributor] ✗ username already exists:', username);
      return res.status(409).json({ success: false, message: 'username already exists' });
    }

    const hash = await require('bcrypt').hash(password, 10);
    const created = await Contributor.create({ username, passwordHash: hash, fname, lname, contact, email, createdBy: adminId });
    console.log('[Admin.createContributor] ✓ created contributor - id:', created._id.toString(), 'username:', created.username);
    try { await AdminLog.createLog({ actorId: adminId, actorUsername: adminUsername, role: 'admin', actionType: 'create', message: `${adminUsername} created contributor ${created.username}`, refs: { entity: 'Contributor', id: created._id } }); } catch (e) {}
    return res.status(201).json({ success: true, data: { id: created._id, username: created.username, fname: created.fname, lname: created.lname } });
  } catch (err) {
    console.error('[Admin.createContributor] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const listContributors = async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    console.log('[Admin.listContributors] called by admin:', req.admin && req.admin.username);
    const query = adminId ? { createdBy: adminId } : {};
    const list = await Contributor.find(query, { passwordHash: 0 }).lean();
    console.log('[Admin.listContributors] ✓ found', list.length, 'contributors');
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error('[Admin.listContributors] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getContributor = async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    const id = req.params.id;
    console.log('[Admin.getContributor] called by', req.admin && req.admin.username, 'target:', id);
    const found = await Contributor.findOne({ _id: id, createdBy: adminId }, { passwordHash: 0 }).lean();
    if (!found) {
      console.log('[Admin.getContributor] ✗ not found or unauthorized:', id);
      return res.status(404).json({ success: false, message: 'contributor not found' });
    }
    console.log('[Admin.getContributor] ✓ found contributor', found.username);
    return res.json({ success: true, data: found });
  } catch (err) {
    console.error('[Admin.getContributor] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateContributor = async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    const id = req.params.id;
    console.log('[Admin.updateContributor] called by', req.admin && req.admin.username, 'target:', id);

    const { username, fname, lname, contact, email, password } = req.body || {};
    const update = {};
    
    // Check if username is being changed and if it already exists
    if (username !== undefined) {
      const existing = await Contributor.findOne({ username, _id: { $ne: id } });
      if (existing) {
        console.log('[Admin.updateContributor] ✗ username already exists:', username);
        return res.status(409).json({ success: false, message: 'username already exists' });
      }
      update.username = username;
    }
    
    if (fname !== undefined) update.fname = fname;
    if (lname !== undefined) update.lname = lname;
    if (contact !== undefined) update.contact = contact;
    if (email !== undefined) update.email = email;
    if (password) update.passwordHash = await require('bcrypt').hash(password, 10);

    const updated = await Contributor.findOneAndUpdate({ _id: id, createdBy: adminId }, update, { new: true }).lean();
    if (!updated) {
      console.log('[Admin.updateContributor] ✗ not found or unauthorized:', id);
      return res.status(404).json({ success: false, message: 'contributor not found' });
    }
    console.log('[Admin.updateContributor] ✓ updated contributor', updated.username);
    try { await AdminLog.createLog({ actorId: adminId, actorUsername: req.admin && req.admin.username, role: 'admin', actionType: 'edit', message: `${req.admin && req.admin.username} updated contributor ${updated.username}`, refs: { entity: 'Contributor', id: updated._id } }); } catch (e) {}
    updated.passwordHash = undefined;
    return res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Admin.updateContributor] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteContributor = async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    const id = req.params.id;
    console.log('[Admin.deleteContributor] called by', req.admin && req.admin.username, 'target:', id);
    const del = await Contributor.findOneAndDelete({ _id: id, createdBy: adminId }).lean();
    if (!del) {
      console.log('[Admin.deleteContributor] ✗ not found or unauthorized:', id);
      return res.status(404).json({ success: false, message: 'contributor not found' });
    }
    console.log('[Admin.deleteContributor] ✓ deleted contributor', del.username);
    try { await AdminLog.createLog({ actorId: adminId, actorUsername: req.admin && req.admin.username, role: 'admin', actionType: 'delete', message: `${req.admin && req.admin.username} deleted contributor ${del.username}`, refs: { entity: 'Contributor', id: del._id } }); } catch (e) {}
    return res.json({ success: true, data: { id: del._id } });
  } catch (err) {
    console.error('[Admin.deleteContributor] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all contributor requests
const listContributorRequests = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    console.log('[Admin.listContributorRequests] called by', adminUser);

    const requests = await ContributorRequest.find({})
      .sort({ submittedAt: -1 })
      .lean();

    console.log('[Admin.listContributorRequests] ✓ found', requests.length, 'requests');
    return res.json({ success: true, data: requests });
  } catch (err) {
    console.error('[Admin.listContributorRequests] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get a specific contributor request
const getContributorRequest = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const { id } = req.params;
    console.log('[Admin.getContributorRequest] called by', adminUser, 'for request', id);

    const request = await ContributorRequest.findById(id).lean();

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    console.log('[Admin.getContributorRequest] ✓ found request');
    return res.json({ success: true, data: request });
  } catch (err) {
    console.error('[Admin.getContributorRequest] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Update contributor request status
const updateContributorRequestStatus = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const adminId = req.admin && req.admin.id;
    const { id } = req.params;
    const { status, notes } = req.body;

    console.log('[Admin.updateContributorRequestStatus] called by', adminUser, 'for request', id);

    if (!status || !['pending', 'in-progress', 'completed', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status. Must be pending, in-progress, completed, or rejected' 
      });
    }

    const request = await ContributorRequest.findById(id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const previousStatus = request.status;
    request.status = status;
    if (notes !== undefined) {
      // Save general notes; if rejecting, treat this as a rejection reason
      request.notes = notes;
    }
    // Handle rejection reason separately for clarity
    if (status === 'rejected') {
      request.rejectionReason = notes || '';
    } else if (request.rejectionReason) {
      // Clear previous rejection reason if status moved away from rejected
      request.rejectionReason = undefined;
    }
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();

    await request.save();

    // If status changed to 'completed', save drafted questions to Question collection
    if (status === 'completed' && previousStatus !== 'completed' && request.draftedQuestions && request.draftedQuestions.length > 0) {
      console.log('[Admin.updateContributorRequestStatus] saving', request.draftedQuestions.length, 'drafted questions to database');
      // Map each drafted question to include category from the parent questionRequest (matched by topic)
      const questionsToSave = request.draftedQuestions.map(dq => {
        // find matching questionRequest by topic
        const match = Array.isArray(request.questionRequests) ? request.questionRequests.find(qr => qr.topic === dq.topic) : null;
        const category = match ? match.category : (request.questionRequests && request.questionRequests[0] ? request.questionRequests[0].category : 'aptitude');
        return {
          text: dq.text,
          options: dq.options,
          correctIndex: dq.correctIndex,
          category,
          difficulty: dq.difficulty,
          subtopic: dq.subtopic, // Include subtopic for library organization
          tags: dq.tags || [],
          details: dq.details,
          createdByContributor: request.contributorId,
          inLibrary: true, // Mark as in library by default when accepted
          createdAt: new Date()
        };
      });

      try {
        const savedQuestions = await Question.insertMany(questionsToSave);
        console.log('[Admin.updateContributorRequestStatus] ✓ saved', savedQuestions.length, 'questions to database');
        
        // Add each question to Library collection
        for (const question of savedQuestions) {
          try {
            const mainTopic = question.category === 'aptitude' ? 'Aptitude' : 
                             question.category === 'technical' ? 'Technical' : 'Psychometric';
            await Library.addQuestionToLibrary(question._id, mainTopic, question.subtopic);
            console.log('[Admin.updateContributorRequestStatus] ✓ added question', question._id, 'to library');
          } catch (libErr) {
            console.error('[Admin.updateContributorRequestStatus] ✗ error adding to library:', libErr.message);
          }
        }
      } catch (qErr) {
        console.error('[Admin.updateContributorRequestStatus] ✗ error saving questions:', qErr.message);
        // Continue with request update even if question save fails
      }
    }

    console.log('[Admin.updateContributorRequestStatus] ✓ updated request to', status);
    try {
      const actor = req.admin && req.admin.username;
      const verb = status === 'completed' ? 'approved' : (status === 'rejected' ? 'rejected' : `set status ${status}`);
      await AdminLog.createLog({ actorId: adminId, actorUsername: actor, role: 'admin', actionType: status === 'rejected' ? 'reject' : (status === 'completed' ? 'approve' : 'edit'), message: `${actor} ${verb} contributor request ${request._id}`, refs: { entity: 'ContributorRequest', id: request._id } });
    } catch (e) {}
    return res.json({ success: true, data: request });
  } catch (err) {
    console.error('[Admin.updateContributorRequestStatus] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get all admin-contributor chats
const listContributorChats = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    console.log('[Admin.listContributorChats] called by', adminUser);

    const chats = await AdminContributorChat.find({})
      .sort({ lastMessageAt: -1 })
      .lean();

    console.log('[Admin.listContributorChats] ✓ found', chats.length, 'chats');
    return res.json({ success: true, data: chats });
  } catch (err) {
    console.error('[Admin.listContributorChats] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get a specific contributor chat
const getContributorChat = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const { contributorId } = req.params;
    console.log('[Admin.getContributorChat] called by', adminUser, 'for contributor', contributorId);

    const chat = await AdminContributorChat.findOne({ contributorId }).lean();

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    console.log('[Admin.getContributorChat] ✓ found chat');
    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[Admin.getContributorChat] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Send message to contributor
const sendMessageToContributor = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const adminId = req.admin && req.admin.id;
    const { contributorId } = req.params;
    const { message } = req.body;

    console.log('[Admin.sendMessageToContributor] called by', adminUser, 'to contributor', contributorId);

    if (!message || message.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        message: 'Message cannot be empty' 
      });
    }

    let chat = await AdminContributorChat.findOne({ contributorId });

    if (!chat) {
      const contributor = await Contributor.findById(contributorId);
      if (!contributor) {
        return res.status(404).json({ success: false, message: 'Contributor not found' });
      }

      chat = new AdminContributorChat({
        contributorId: contributorId,
        contributorName: contributor.username,
        adminId: adminId,
        adminName: adminUser,
        messages: []
      });
    }

    if (!chat.adminId) {
      chat.adminId = adminId;
      chat.adminName = adminUser;
    }

    chat.messages.push({
      senderRole: 'admin',
      senderId: adminId,
      senderModel: 'Admin',
      senderName: adminUser,
      message: message.trim(),
      timestamp: new Date(),
      read: false
    });

    chat.unreadCountContributor += 1;
    chat.lastMessageAt = new Date();

    await chat.save();

    console.log('[Admin.sendMessageToContributor] ✓ message sent');
    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[Admin.sendMessageToContributor] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Mark messages as read by admin
const markContributorMessagesAsRead = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const { contributorId } = req.params;
    console.log('[Admin.markContributorMessagesAsRead] called by', adminUser, 'for contributor', contributorId);

    const chat = await AdminContributorChat.findOne({ contributorId });

    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Mark all contributor messages as read
    let updated = false;
    chat.messages.forEach(msg => {
      if (msg.senderRole === 'contributor' && !msg.read) {
        msg.read = true;
        updated = true;
      }
    });

    if (updated) {
      chat.unreadCountAdmin = 0;
      await chat.save();
    }

    console.log('[Admin.markContributorMessagesAsRead] ✓ messages marked as read');
    return res.json({ success: true, data: chat });
  } catch (err) {
    console.error('[Admin.markContributorMessagesAsRead] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get total unread messages count across all chats
const getUnreadMessagesCount = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    console.log('[Admin.getUnreadMessagesCount] called by', adminUser);

    const chats = await AdminContributorChat.find({});
    const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCountAdmin || 0), 0);

    console.log('[Admin.getUnreadMessagesCount] ✓ total unread:', totalUnread);
    return res.json({ success: true, data: { unreadCount: totalUnread } });
  } catch (err) {
    console.error('[Admin.getUnreadMessagesCount] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get library questions grouped by contributor
const getLibraryQuestionsByContributor = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    console.log('[Admin.getLibraryQuestionsByContributor] called by', adminUser);

    // Get all library questions
    const questions = await Question.find({ inLibrary: true })
      .populate('createdByContributor', 'username fname lname')
      .sort({ createdAt: -1 });

    // Group by contributor
    const grouped = {};
    
    questions.forEach(q => {
      const contributor = q.createdByContributor;
      if (!contributor) return; // Skip questions without contributor
      
      const contributorId = contributor._id.toString();
      if (!grouped[contributorId]) {
        grouped[contributorId] = {
          contributor: {
            id: contributor._id,
            username: contributor.username,
            fname: contributor.fname,
            lname: contributor.lname
          },
          questions: []
        };
      }
      grouped[contributorId].questions.push(q);
    });

    // Convert to array
    const result = Object.values(grouped);

    console.log('[Admin.getLibraryQuestionsByContributor] ✓ found', result.length, 'contributors with questions');
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('[Admin.getLibraryQuestionsByContributor] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get library questions for a specific contributor
const getLibraryQuestionsByContributorId = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const { contributorId } = req.params;
    console.log('[Admin.getLibraryQuestionsByContributorId] called by', adminUser, 'for contributor', contributorId);

    // Get contributor info
    const contributor = await Contributor.findById(contributorId);
    if (!contributor) {
      return res.status(404).json({ success: false, message: 'Contributor not found' });
    }

    // Use Library helper method to get organized questions
    const organized = await Library.getAllQuestionsByContributor(contributorId);

    console.log('[Admin.getLibraryQuestionsByContributorId] ✓ fetched library questions');
    return res.json({ 
      success: true, 
      data: {
        contributor: {
          id: contributor._id,
          username: contributor.username,
          fname: contributor.fname,
          lname: contributor.lname
        },
        questions: organized
      }
    });
  } catch (err) {
    console.error('[Admin.getLibraryQuestionsByContributorId] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Add question to library
const addQuestionToLibrary = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const { questionId } = req.params;
    console.log('[Admin.addQuestionToLibrary] called by', adminUser, 'for question', questionId);

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    if (!question.subtopic) {
      return res.status(400).json({ success: false, message: 'Question must have a subtopic to be added to library' });
    }

    // Update question
    question.inLibrary = true;
    await question.save();

    // Add to library structure
    const mainTopic = question.getMainTopic();
    await Library.addQuestionToLibrary(questionId, mainTopic, question.subtopic);

    console.log('[Admin.addQuestionToLibrary] ✓ added question to library');
    return res.json({ success: true, message: 'Question added to library' });
  } catch (err) {
    console.error('[Admin.addQuestionToLibrary] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Remove question from library
const removeQuestionFromLibrary = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const { questionId } = req.params;
    console.log('[Admin.removeQuestionFromLibrary] called by', adminUser, 'for question', questionId);

    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Update question
    question.inLibrary = false;
    await question.save();

    // Remove from library structure
    await Library.removeQuestionFromLibrary(questionId);

    console.log('[Admin.removeQuestionFromLibrary] ✓ removed question from library');
    return res.json({ success: true, message: 'Question removed from library' });
  } catch (err) {
    console.error('[Admin.removeQuestionFromLibrary] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get library structure
const getLibraryStructure = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    console.log('[Admin.getLibraryStructure] called by', adminUser);

    const library = await Library.getLibraryStructure();

    console.log('[Admin.getLibraryStructure] ✓');
    return res.json({ success: true, data: library });
  } catch (err) {
    console.error('[Admin.getLibraryStructure] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Get batches for a specific institution
const getInstitutionBatches = async (req, res) => {
  try {
    const adminUser = req.admin && req.admin.username;
    const { id } = req.params; // institution ID
    console.log('[Admin.getInstitutionBatches] called by', adminUser, 'for institution', id);

    // Verify admin has access to this institution
    const institution = await Institution.findOne({ _id: id, createdBy: req.admin.id });
    if (!institution) {
      console.log('[Admin.getInstitutionBatches] ✗ institution not found or unauthorized:', id);
      return res.status(404).json({ success: false, message: 'Institution not found or unauthorized' });
    }

    const batches = await Batch.find({ createdBy: id })
      .select('name createdAt students faculty')
      .populate('faculty', 'name')
      .sort({ createdAt: -1 })
      .lean();

    console.log('[Admin.getInstitutionBatches] ✓ found', batches.length, 'batches');
    return res.json({ success: true, data: batches });
  } catch (err) {
    console.error('[Admin.getInstitutionBatches] ✗ error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { 
  login, 
  listInstitutions, 
  createInstitution, 
  updateInstitution, 
  deleteInstitution, 
  getInstitutions, 
  getLogs, 
  createAnnouncement, 
  listAnnouncements, 
  createContributor, 
  listContributors, 
  getContributor, 
  updateContributor, 
  deleteContributor,
  listContributorRequests,
  getContributorRequest,
  updateContributorRequestStatus,
  listContributorChats,
  getContributorChat,
  sendMessageToContributor,
  markContributorMessagesAsRead,
  getUnreadMessagesCount,
  getLibraryQuestionsByContributor,
  getLibraryQuestionsByContributorId,
  addQuestionToLibrary,
  removeQuestionFromLibrary,
  getLibraryStructure,
  getInstitutionBatches
};

