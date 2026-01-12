const ChatMessage = require('../../models/ChatMessage');
const Institution = require('../../models/Institution');
const Faculty = require('../../models/Faculty');

// Institution sends a message to admin
const sendMessageByInstitution = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const { message } = req.body || {};
    console.log('[Chat.sendMessageByInstitution] called by institution:', instName);
    if (!instId) return res.status(401).json({ success: false, message: 'unauthorized' });
    if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'message required' });

    const msg = await ChatMessage.create({
      institution: instId,
      fromRole: 'institution',
      fromRef: instId,
      toRole: 'admin',
      toRef: null,
      message: message.trim(),
    });
    console.log('[Chat.sendMessageByInstitution] ✓ saved message id:', msg._id.toString());
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error('[Chat.sendMessageByInstitution] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Institution lists messages for itself
const listMessagesForInstitution = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    console.log('[Chat.listMessagesForInstitution] called by', instId);
    if (!instId) return res.status(401).json({ success: false, message: 'unauthorized' });
    const msgs = await ChatMessage.find({ institution: instId }).sort({ createdAt: 1 }).lean();
    return res.json({ success: true, data: msgs });
  } catch (err) {
    console.error('[Chat.listMessagesForInstitution] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Admin lists messages for a specific institution
const listMessagesForAdminByInstitution = async (req, res) => {
  try {
    const instId = req.params.id;
    console.log('[Chat.listMessagesForAdminByInstitution] called by admin for institution:', instId);
    const inst = await Institution.findById(instId).select('name');
    if (!inst) return res.status(404).json({ success: false, message: 'institution not found' });
    const msgs = await ChatMessage.find({ institution: instId }).sort({ createdAt: 1 }).lean();
    return res.json({ success: true, data: msgs, institution: inst });
  } catch (err) {
    console.error('[Chat.listMessagesForAdminByInstitution] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Admin sends a message to an institution
const sendMessageByAdmin = async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    const instId = req.params.id;
    const { message } = req.body || {};
    console.log('[Chat.sendMessageByAdmin] called by admin:', adminId, 'to institution:', instId);
    if (!adminId) return res.status(401).json({ success: false, message: 'unauthorized' });
    if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'message required' });
    const inst = await Institution.findById(instId).select('_id');
    if (!inst) return res.status(404).json({ success: false, message: 'institution not found' });

    const msg = await ChatMessage.create({
      institution: instId,
      fromRole: 'admin',
      fromRef: adminId,
      toRole: 'institution',
      toRef: instId,
      message: message.trim(),
    });
    console.log('[Chat.sendMessageByAdmin] ✓ saved message id:', msg._id.toString());
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error('[Chat.sendMessageByAdmin] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Faculty sends a message to institution (visible to institution/admin)
const sendMessageByFaculty = async (req, res) => {
  try {
    const facultyId = req.faculty && req.faculty.id;
    if (!facultyId) return res.status(401).json({ success: false, message: 'unauthorized' });
    const faculty = await Faculty.findById(facultyId).select('createdBy username');
    if (!faculty) return res.status(404).json({ success: false, message: 'faculty not found' });
    const instId = faculty.createdBy;
    const { message } = req.body || {};
    if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'message required' });

    const msg = await ChatMessage.create({
      institution: instId,
      fromRole: 'faculty',
      fromRef: facultyId,
      toRole: 'institution',
      toRef: instId,
      message: message.trim(),
    });
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error('[Chat.sendMessageByFaculty] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Faculty lists messages relevant to them and institution-level messages
const listMessagesForFaculty = async (req, res) => {
  try {
    const facultyId = req.faculty && req.faculty.id;
    if (!facultyId) return res.status(401).json({ success: false, message: 'unauthorized' });
    const faculty = await Faculty.findById(facultyId).select('createdBy');
    if (!faculty) return res.status(404).json({ success: false, message: 'faculty not found' });
    const instId = faculty.createdBy;

    // include: institution broadcasts and any messages to/from this faculty
    const msgs = await ChatMessage.find({
      institution: instId,
      $or: [
        { fromRole: 'institution' },
        { toRole: 'institution' },
        { fromRole: 'faculty', fromRef: facultyId },
        { toRole: 'faculty', toRef: facultyId },
      ],
    }).sort({ createdAt: 1 }).lean();

    return res.json({ success: true, data: msgs });
  } catch (err) {
    console.error('[Chat.listMessagesForFaculty] ✗ error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendMessageByInstitution, listMessagesForInstitution, listMessagesForAdminByInstitution, sendMessageByAdmin, sendMessageByFaculty, listMessagesForFaculty };

