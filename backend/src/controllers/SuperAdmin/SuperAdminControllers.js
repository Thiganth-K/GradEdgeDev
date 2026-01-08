const trim = (v) => (typeof v === 'string' ? v.trim() : v);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');

const login = (req, res) => {
  const { username, password } = req.body || {};
  console.log('[SuperAdmin.login] called', { username });
  const envUser = trim(process.env.SUPERADMIN_USERNAME || '');
  const envPass = trim(process.env.SUPERADMIN_PASSWORD || '');

  if (!username || !password) {
    console.log('[SuperAdmin.login] missing credentials');
    return res.status(400).json({ success: false, message: 'username and password required' });
  }

  if (username === envUser && password === envPass) {
    const secret = process.env.SUPERADMIN_JWT_SECRET;
    if (!secret) {
      console.error('[SuperAdmin.login] SUPERADMIN_JWT_SECRET not configured');
      return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
    }
    const token = jwt.sign({ role: 'SuperAdmin', username }, secret, { expiresIn: '4h' });
    console.log('[SuperAdmin.login] superadmin authenticated, issuing token');
    return res.json({ success: true, role: 'SuperAdmin', token });
  }

  console.log('[SuperAdmin.login] invalid credentials');
  return res.status(401).json({ success: false, message: 'invalid credentials' });
};

const getInstitutions = (req, res) => {
  const user = req.superadmin?.username || 'anonymous';
  console.log('[SuperAdmin.getInstitutions] called by', user);
  const sample = [
    { id: 1, name: 'City University', status: 'Active' },
    { id: 2, name: 'Greenfield College', status: 'Pending' },
  ];
  console.log('[SuperAdmin.getInstitutions] ✓ returning', sample.length, 'institutions');
  res.json({ success: true, data: sample });
};

const getLogs = (req, res) => {
  const user = req.superadmin?.username || 'anonymous';
  console.log('[SuperAdmin.getLogs] called by', user);
  const sample = [
    { id: 1, time: new Date().toISOString(), message: 'SuperAdmin logged in' },
    { id: 2, time: new Date().toISOString(), message: 'Institution created' },
  ];
  console.log('[SuperAdmin.getLogs] ✓ returning', sample.length, 'log entries');
  res.json({ success: true, data: sample });
};

// Admin management handlers
const listAdmins = async (req, res) => {
  try {
    console.log('[SuperAdmin.listAdmins] called by', req.superadmin && req.superadmin.username);
    const list = await Admin.find({}, { passwordHash: 0 }).lean();
    console.log('[SuperAdmin.listAdmins] found', list.length, 'admins');
    res.json({ success: true, data: list });
  } catch (err) {
    console.error('[SuperAdmin.listAdmins] error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAdmin = async (req, res) => {
  try {
    const { username, password, institutionLimit } = req.body || {};
    const superAdminUser = req.superadmin && req.superadmin.username;
    console.log('[SuperAdmin.createAdmin] called by', superAdminUser);
    console.log('[SuperAdmin.createAdmin] payload: { username:', username, ', institutionLimit:', institutionLimit, '}');
    
    if (!username || !password) {
      console.log('[SuperAdmin.createAdmin] ✗ missing username or password');
      return res.status(400).json({ success: false, message: 'username and password required' });
    }

    const exists = await Admin.findOne({ username });
    if (exists) {
      console.log('[SuperAdmin.createAdmin] ✗ username already exists:', username);
      return res.status(409).json({ success: false, message: 'username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const created = await Admin.create({ username, passwordHash: hash, institutionLimit: typeof institutionLimit === 'number' ? institutionLimit : 10 });
    console.log('[SuperAdmin.createAdmin] ✓ created admin - id:', created._id.toString(), 'username:', created.username, 'limit:', created.institutionLimit);
    res.json({ success: true, data: { id: created._id, username: created.username, institutionLimit: created.institutionLimit } });
  } catch (err) {
    console.error('[SuperAdmin.createAdmin] ✗ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, institutionLimit } = req.body || {};
    const update = {};
    const superAdminUser = req.superadmin && req.superadmin.username;
    console.log('[SuperAdmin.updateAdmin] called by', superAdminUser);
    console.log('[SuperAdmin.updateAdmin] id:', id, '| payload: { username:', username, ', institutionLimit:', institutionLimit, '}');
    
    if (username) update.username = username;
    if (typeof institutionLimit === 'number') update.institutionLimit = institutionLimit;
    if (password) update.passwordHash = await bcrypt.hash(password, 10);

    const updated = await Admin.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      console.log('[SuperAdmin.updateAdmin] ✗ admin not found:', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    console.log('[SuperAdmin.updateAdmin] ✓ updated - id:', updated._id.toString(), 'username:', updated.username, 'limit:', updated.institutionLimit);
    res.json({ success: true, data: { id: updated._id, username: updated.username, institutionLimit: updated.institutionLimit } });
  } catch (err) {
    console.error('[SuperAdmin.updateAdmin] ✗ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const superAdminUser = req.superadmin && req.superadmin.username;
    console.log('[SuperAdmin.deleteAdmin] called by', superAdminUser);
    console.log('[SuperAdmin.deleteAdmin] target id:', id);
    
    const removed = await Admin.findByIdAndDelete(id);
    if (!removed) {
      console.log('[SuperAdmin.deleteAdmin] ✗ admin not found:', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    console.log('[SuperAdmin.deleteAdmin] ✓ deleted admin - id:', id, 'username:', removed.username);
    res.json({ success: true });
  } catch (err) {
    console.error('[SuperAdmin.deleteAdmin] ✗ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, getInstitutions, getLogs, listAdmins, createAdmin, updateAdmin, deleteAdmin };
