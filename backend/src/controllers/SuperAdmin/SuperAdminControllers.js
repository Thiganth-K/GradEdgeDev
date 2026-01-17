const trim = (v) => (typeof v === 'string' ? v.trim() : v);
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Admin = require('../../models/Admin');

const Institution = require('../../models/Institution');

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
    const secret = process.env.SUPERADMIN_JWT_SECRET || process.env.ADMIN_JWT_SECRET;
    if (!secret) {
      console.error('[SuperAdmin.login] SUPERADMIN_JWT_SECRET not configured');
      return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
    }

    const token = jwt.sign({ username, role: 'SuperAdmin' }, secret, { expiresIn: '7d' });
    console.log('[SuperAdmin.login] superadmin authenticated - generated token');
    return res.json({ success: true, role: 'SuperAdmin', token, username });
  }

  console.log('[SuperAdmin.login] invalid credentials');
  return res.status(401).json({ success: false, message: 'invalid credentials' });
};

const getInstitutions = async (req, res) => {
  const user = req.superadmin?.username || 'anonymous';
  console.log('[SuperAdmin.getInstitutions] called by', user);
  try {
    const list = await Institution.find({}).lean();
    const mapped = (list || []).map((it) => ({
      id: it._id,
      _id: it._id,
      name: it.name,
      institutionId: it.institutionId,
      location: it.location,
      contactNo: it.contactNo,
      email: it.email,
      facultyLimit: it.facultyLimit,
      studentLimit: it.studentLimit,
      batchLimit: it.batchLimit,
      testLimit: it.testLimit,
      createdAt: it.createdAt,
      createdBy: it.createdBy,
    }));
    console.log('[SuperAdmin.getInstitutions] ✓ returning', mapped.length, 'institutions from DB');
    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('[SuperAdmin.getInstitutions] error querying DB', err.message);
    res.status(500).json({ success: false, message: 'failed to fetch institutions' });
  }
};

const fs = require('fs');
const path = require('path');

const getLogs = (req, res) => {
  const user = req.superadmin?.username || 'anonymous';
  console.log('[SuperAdmin.getLogs] called by', user);

  const roleFilter = (req.query.role || '').toString(); // Admin | Institution | Faculty | Student | Contributor | SuperAdmin
  const logFile = path.resolve(__dirname, '../../logs/actions.log');

  if (!fs.existsSync(logFile)) {
    console.log('[SuperAdmin.getLogs] actions.log not found, returning empty');
    return res.json({ success: true, data: [] });
  }

  try {
    const content = fs.readFileSync(logFile, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    // Parse last 500 lines to keep payload small
    const start = Math.max(0, lines.length - 500);
    const entries = [];
    for (let i = start; i < lines.length; i++) {
      try {
        const obj = JSON.parse(lines[i]);
        entries.push(obj);
      } catch (_) {}
    }

    let filtered = entries;
    if (roleFilter) {
      filtered = entries.filter((e) => (e.roleGroup || '').toLowerCase() === roleFilter.toLowerCase());
    }

    // Return newest first
    filtered.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    console.log('[SuperAdmin.getLogs] ✓ returning', filtered.length, 'entries');
    res.json({ success: true, data: filtered });
  } catch (err) {
    console.error('[SuperAdmin.getLogs] error reading logs:', err.message);
    res.status(500).json({ success: false, message: 'failed to read logs' });
  }
};

const getDashboardStats = async (req, res) => {
  const user = req.superadmin?.username || 'anonymous';
  console.log('[SuperAdmin.getDashboardStats] called by', user);
  try {
    const adminCount = await Admin.countDocuments({});
    const institutionCount = await Institution.countDocuments({});
    
    // Count log lines efficiently
    let logCount = 0;
    const logFile = path.resolve(__dirname, '../../logs/actions.log');
    if (fs.existsSync(logFile)) {
        // Simple line count for now, stream for large files later if needed
        const buffer = fs.readFileSync(logFile);
        let i = 0;
        while (i < buffer.length) {
            if (buffer[i] === 10) logCount++;
            i++;
        }
    }

    console.log('[SuperAdmin.getDashboardStats] stats:', { adminCount, institutionCount, logCount });
    res.json({ 
        success: true, 
        data: {
            admins: adminCount,
            institutions: institutionCount,
            logs: logCount
        }
    });

  } catch (err) {
    console.error('[SuperAdmin.getDashboardStats] error:', err.message);
    res.status(500).json({ success: false, message: 'failed to fetch stats' });
  }
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

const os = require('os');
const mongoose = require('mongoose');

const getSystemVitals = async (req, res) => {
  try {
    const user = req.superadmin?.username || 'anonymous';
    console.log('[SuperAdmin.getSystemVitals] called by', user);

    const mongoStatus = {
      state: mongoose.connection.readyState, // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };

    const system = {
      uptime: os.uptime(),
      totalMem: os.totalmem(),
      freeMem: os.freemem(),
      loadAvg: os.loadavg(), // [1, 5, 15] min
      platform: os.platform(),
      cpus: os.cpus().length,
    };

    console.log('[SuperAdmin.getSystemVitals] ✓ returning vitals');
    res.json({ success: true, data: { mongoStatus, system } });
  } catch (err) {
    console.error('[SuperAdmin.getSystemVitals] ✗ error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, getInstitutions, getLogs, getDashboardStats, listAdmins, createAdmin, updateAdmin, deleteAdmin, getSystemVitals };

// Return basic superadmin profile (from token and env)
const getProfile = (req, res) => {
  try {
    const username = req.superadmin?.username || process.env.SUPERADMIN_USERNAME || 'superadmin';
    const name = process.env.SUPERADMIN_NAME || username;
    res.json({ success: true, data: { username, name } });
  } catch (err) {
    console.error('[SuperAdmin.getProfile] error:', err.message);
    res.status(500).json({ success: false, message: 'failed to get profile' });
  }
};

// add getProfile to exports
module.exports.getProfile = getProfile;
