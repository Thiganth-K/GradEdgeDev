const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Institution = require('../../models/Institution');

const login = async (req, res) => {
  const { institutionId, password } = req.body || {};
  console.log('[Institution.login] called', { institutionId });
  if (!institutionId || !password) return res.status(400).json({ success: false, message: 'institutionId and password required' });

  try {
    const inst = await Institution.findOne({ institutionId });
    if (!inst) {
      console.log('[Institution.login] not found', institutionId);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    const ok = await bcrypt.compare(password, inst.passwordHash);
    if (!ok) {
      console.log('[Institution.login] invalid password for', institutionId);
      return res.status(401).json({ success: false, message: 'invalid credentials' });
    }

    const secret = process.env.INSTITUTION_JWT_SECRET || process.env.ADMIN_JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET;
    if (!secret) {
      console.error('[Institution.login] JWT secret not configured');
      return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
    }

    const token = jwt.sign({ role: 'institution', id: inst._id, institutionId: inst.institutionId, name: inst.name }, secret, { expiresIn: '4h' });
    console.log('[Institution.login] authenticated', institutionId);
    return res.json({ success: true, role: 'institution', token, data: { id: inst._id, institutionId: inst.institutionId, name: inst.name } });
  } catch (err) {
    console.error('[Institution.login] error', err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const welcome = (req, res) => {
  res.json({ success: true, message: `Welcome to the institution dashboard` });
};

module.exports = { login, welcome };
