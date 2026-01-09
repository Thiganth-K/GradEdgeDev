const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Contributor = require('../../models/Contributor');

const login = async (req, res) => {
  const { username, password } = req.body || {};
  console.log('[Contributor.login] called', { username });
  if (!username || !password) {
    console.log('[Contributor.login] missing credentials');
    return res.status(400).json({ success: false, message: 'username and password required' });
  }

  try {
    const user = await Contributor.findOne({ username });
    if (!user) {
      console.log('[Contributor.login] user not found', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log('[Contributor.login] invalid password for', username);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    const secret = process.env.CONTRIBUTOR_JWT_SECRET || process.env.ADMIN_JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET;
    if (!secret) {
      console.error('[Contributor.login] jwt secret not configured');
      return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
    }

    const token = jwt.sign({ role: 'contributor', id: user._id, username: user.username }, secret, { expiresIn: '6h' });
    console.log('[Contributor.login] authenticated', username);
    return res.json({ success: true, role: 'contributor', token, data: { id: user._id, username: user.username, fname: user.fname, lname: user.lname } });
  } catch (err) {
    console.error('[Contributor.login] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// simple protected endpoint to verify contributor token and return a welcome message
const dashboard = async (req, res) => {
  try {
    const contributor = req.contributor || {};
    console.log('[Contributor.dashboard] called by', contributor.username || contributor.id);
    return res.json({ success: true, message: `Welcome, ${contributor.username || 'contributor'}` });
  } catch (err) {
    console.error('[Contributor.dashboard] error', err && err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { login, dashboard };
