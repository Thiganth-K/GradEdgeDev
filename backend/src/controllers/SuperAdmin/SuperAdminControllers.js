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
  console.log('[SuperAdmin.getInstitutions] called');
  const sample = [
    { id: 1, name: 'City University', status: 'Active' },
    { id: 2, name: 'Greenfield College', status: 'Pending' },
  ];
  res.json({ success: true, data: sample });
};

const getLogs = (req, res) => {
  console.log('[SuperAdmin.getLogs] called');
  const sample = [
    { id: 1, time: new Date().toISOString(), message: 'SuperAdmin logged in' },
    { id: 2, time: new Date().toISOString(), message: 'Institution created' },
  ];
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
    console.log('[SuperAdmin.createAdmin] called by', req.superadmin && req.superadmin.username, 'payload', { username, institutionLimit });
    if (!username || !password) {
      console.log('[SuperAdmin.createAdmin] missing username or password');
      return res.status(400).json({ success: false, message: 'username and password required' });
    }

    const exists = await Admin.findOne({ username });
    if (exists) {
      console.log('[SuperAdmin.createAdmin] username exists', username);
      return res.status(409).json({ success: false, message: 'username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const created = await Admin.create({ username, passwordHash: hash, institutionLimit: typeof institutionLimit === 'number' ? institutionLimit : 10 });
    console.log('[SuperAdmin.createAdmin] created admin', created._id.toString(), 'limit', created.institutionLimit);
    res.json({ success: true, data: { id: created._id, username: created.username, institutionLimit: created.institutionLimit } });
  } catch (err) {
    console.error('[SuperAdmin.createAdmin] error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, institutionLimit } = req.body || {};
    const update = {};
    console.log('[SuperAdmin.updateAdmin] called by', req.superadmin && req.superadmin.username, 'id', id, 'payload', { username, institutionLimit });
    if (username) update.username = username;
    if (typeof institutionLimit === 'number') update.institutionLimit = institutionLimit;
    if (password) update.passwordHash = await bcrypt.hash(password, 10);

    const updated = await Admin.findByIdAndUpdate(id, update, { new: true });
    if (!updated) {
      console.log('[SuperAdmin.updateAdmin] not found', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    console.log('[SuperAdmin.updateAdmin] updated', updated._id.toString(), 'limit', updated.institutionLimit);
    res.json({ success: true, data: { id: updated._id, username: updated.username, institutionLimit: updated.institutionLimit } });
  } catch (err) {
    console.error('[SuperAdmin.updateAdmin] error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('[SuperAdmin.deleteAdmin] called by', req.superadmin && req.superadmin.username, 'id', id);
    const removed = await Admin.findByIdAndDelete(id);
    if (!removed) {
      console.log('[SuperAdmin.deleteAdmin] not found', id);
      return res.status(404).json({ success: false, message: 'not found' });
    }
    console.log('[SuperAdmin.deleteAdmin] removed', id);
    res.json({ success: true });
  } catch (err) {
    console.error('[SuperAdmin.deleteAdmin] error', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, getInstitutions, getLogs, listAdmins, createAdmin, updateAdmin, deleteAdmin };
