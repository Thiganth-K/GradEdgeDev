const bcrypt = require('bcrypt');
const Admin = require('../../models/Admin');

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

    console.log('[Admin.login] authenticated', username);
    return res.json({ success: true, role: 'admin', data: { id: admin._id, username: admin.username } });
  } catch (err) {
    console.error('[Admin.login] error', err);
    return res.status(500).json({ success: false, message: err.message });
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

module.exports = { login, getInstitutions, getLogs };
