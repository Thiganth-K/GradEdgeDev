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
    
    const { name, institutionId, password, location, contactNo, email } = req.body || {};
    console.log('[Admin.createInstitution] payload: { name:', name, ', institutionId:', institutionId, ', location:', location, '}');
    
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
    const created = await Institution.create({ name, institutionId, passwordHash: hash, location, contactNo, email, createdBy: adminId });
    console.log('[Admin.createInstitution] ✓ created - id:', created._id.toString(), 'name:', created.name, 'institutionId:', created.institutionId);
    res.json({ success: true, data: { id: created._id, name: created.name, institutionId: created.institutionId } });
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
    
    const { name, password, location, contactNo, email } = req.body || {};
    console.log('[Admin.updateInstitution] payload: { name:', name, ', location:', location, ', contactNo:', contactNo, '}');
    
    const update = {};
    if (name) update.name = name;
    if (location) update.location = location;
    if (contactNo) update.contactNo = contactNo;
    if (email) update.email = email;
    if (password) update.passwordHash = await bcrypt.hash(password, 10);

    const updated = await Institution.findOneAndUpdate({ _id: id, createdBy: adminId }, update, { new: true }).lean();
    if (!updated) {
      console.log('[Admin.updateInstitution] ✗ institution not found:', id);
      return res.status(404).json({ success: false, message: 'institution not found' });
    }
    
    console.log('[Admin.updateInstitution] ✓ updated institution - id:', updated._id, 'name:', updated.name);
    res.json({ success: true, data: { id: updated._id, name: updated.name } });
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
  const sample = [
    { id: 1, time: new Date().toISOString(), message: 'Admin logged in' },
    { id: 2, time: new Date().toISOString(), message: 'Institution created' },
  ];
  res.json({ success: true, data: sample });
};

module.exports = { login, listInstitutions, createInstitution, updateInstitution, deleteInstitution, getInstitutions, getLogs };
