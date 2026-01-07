const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');
const Institution = require('../../models/Institution');

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

    const token = jwt.sign({ role: 'admin', id: admin._id, username: admin.username }, secret, { expiresIn: '4h' });
    console.log('[Admin.login] authenticated', username);
    return res.json({ success: true, role: 'admin', token, data: { id: admin._id, username: admin.username } });
  } catch (err) {
    console.error('[Admin.login] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// Institution management (admin-protected)
const listInstitutions = async (req, res) => {
  try {
    console.log('[Admin.listInstitutions] called by', req.admin && req.admin.username);
    // Only return institutions created by this admin
    const adminId = req.admin && req.admin.id;
    const query = adminId ? { createdBy: adminId } : {};
    const list = await Institution.find(query, { passwordHash: 0 }).lean();
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('[Admin.listInstitutions] error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const createInstitution = async (req, res) => {
  try {
    console.log('[Admin.createInstitution] called by', req.admin && req.admin.username);
    const { name, institutionId, password, location, contactNo, email } = req.body || {};
    if (!name || !institutionId || !password) return res.status(400).json({ success: false, message: 'name, institutionId and password required' });

    const exists = await Institution.findOne({ institutionId });
    if (exists) return res.status(409).json({ success: false, message: 'institutionId already exists' });

    // enforce per-admin creation limit
    const adminId = req.admin && req.admin.id;
    const adminDoc = adminId ? await Admin.findById(adminId) : null;
    const limit = (adminDoc && typeof adminDoc.institutionLimit === 'number') ? adminDoc.institutionLimit : 10;
    const currentCount = adminId ? await Institution.countDocuments({ createdBy: adminId }) : 0;
    if (currentCount >= limit) {
      console.log('[Admin.createInstitution] limit reached for admin', adminId, 'limit', limit);
      return res.status(403).json({ success: false, message: `institution create limit reached (${limit})` });
    }

    const hash = await bcrypt.hash(password, 10);
    const created = await Institution.create({ name, institutionId, passwordHash: hash, location, contactNo, email, createdBy: adminId });
    console.log('[Admin.createInstitution] created', created.institutionId, 'by', adminId);
    res.json({ success: true, data: { id: created._id, name: created.name, institutionId: created.institutionId } });
  } catch (err) {
    console.error('[Admin.createInstitution] error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateInstitution = async (req, res) => {
  try {
    console.log('[Admin.updateInstitution] called by', req.admin && req.admin.username);
    const id = req.params.id;
    const { name, password, location, contactNo, email } = req.body || {};
    const update = {};
    if (name) update.name = name;
    if (location) update.location = location;
    if (contactNo) update.contactNo = contactNo;
    if (email) update.email = email;
    if (password) update.passwordHash = await bcrypt.hash(password, 10);

    const updated = await Institution.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) return res.status(404).json({ success: false, message: 'institution not found' });
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('[Admin.updateInstitution] error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteInstitution = async (req, res) => {
  try {
    console.log('[Admin.deleteInstitution] called by', req.admin && req.admin.username);
    const id = req.params.id;
    const del = await Institution.findByIdAndDelete(id).lean();
    if (!del) return res.status(404).json({ success: false, message: 'institution not found' });
    res.json({ success: true, data: { id: del._id } });
  } catch (err) {
    console.error('[Admin.deleteInstitution] error', err);
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
  const sample = [
    { id: 1, time: new Date().toISOString(), message: 'Admin logged in' },
    { id: 2, time: new Date().toISOString(), message: 'Institution created' },
  ];
  res.json({ success: true, data: sample });
};

module.exports = { login, listInstitutions, createInstitution, updateInstitution, deleteInstitution, getInstitutions, getLogs };
