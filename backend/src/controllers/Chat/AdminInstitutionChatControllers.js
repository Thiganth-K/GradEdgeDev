const AdminInstitutionChat = require('../../models/AdminInstitutionChat');
const Institution = require('../../models/Institution');

// Institution sends message to admin (stored in separate collection)
const sendByInstitution = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    const { message } = req.body || {};
    console.log('[AdminInstitutionChat.sendByInstitution] called by institution:', instName);
    if (!instId) return res.status(401).json({ success: false, message: 'unauthorized' });
    if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'message required' });
    const trimmed = message.trim();
    if (trimmed.length > 2000) return res.status(400).json({ success: false, message: 'message too long (max 2000 characters)' });

    const msg = await AdminInstitutionChat.create({
      institution: instId,
      fromRole: 'institution',
      fromRef: instId,
      toRole: 'admin',
      toRef: null,
      message: trimmed,
    });
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error('[AdminInstitutionChat.sendByInstitution] error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Institution lists its admin chat with pagination (page=1 is latest)
const listForInstitution = async (req, res) => {
  try {
    const instId = req.institution && req.institution.id;
    const instName = req.institution && req.institution.name;
    console.log('[AdminInstitutionChat.listForInstitution] called by institution:', instName);
    if (!instId) return res.status(401).json({ success: false, message: 'unauthorized' });
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));

    const total = await AdminInstitutionChat.countDocuments({ institution: instId });
    const msgs = await AdminInstitutionChat.find({ institution: instId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // return in chronological order (oldest -> newest)
    msgs.reverse();
    return res.json({ success: true, data: msgs, page, limit, total });
  } catch (err) {
    console.error('[AdminInstitutionChat.listForInstitution] error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Admin lists admin-chat for a specific institution (paged)
const listForAdminByInstitution = async (req, res) => {
  try {
    const instId = req.params.id;
    const inst = await Institution.findById(instId).select('name');
    if (!inst) return res.status(404).json({ success: false, message: 'institution not found' });
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));

    const total = await AdminInstitutionChat.countDocuments({ institution: instId });
    const msgs = await AdminInstitutionChat.find({ institution: instId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    msgs.reverse();
    return res.json({ success: true, data: msgs, institution: inst, page, limit, total });
  } catch (err) {
    console.error('[AdminInstitutionChat.listForAdminByInstitution] error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Admin sends message to institution (admin-chat collection)
const sendByAdmin = async (req, res) => {
  try {
    const adminId = req.admin && req.admin.id;
    const instId = req.params.id;
    const { message } = req.body || {};
    if (!adminId) return res.status(401).json({ success: false, message: 'unauthorized' });
    if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'message required' });
    const trimmed = message.trim();
    if (trimmed.length > 2000) return res.status(400).json({ success: false, message: 'message too long (max 2000 characters)' });
    const inst = await Institution.findById(instId).select('_id');
    if (!inst) return res.status(404).json({ success: false, message: 'institution not found' });

    const msg = await AdminInstitutionChat.create({
      institution: instId,
      fromRole: 'admin',
      fromRef: adminId,
      toRole: 'institution',
      toRef: instId,
      message: trimmed,
    });
    return res.status(201).json({ success: true, data: msg });
  } catch (err) {
    console.error('[AdminInstitutionChat.sendByAdmin] error:', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { sendByInstitution, listForInstitution, listForAdminByInstitution, sendByAdmin };
