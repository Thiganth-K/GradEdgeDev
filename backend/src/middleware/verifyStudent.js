const jwt = require('jsonwebtoken');

const verifyStudent = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ success: false, message: 'missing or invalid authorization header' });
  const token = parts[1];
  const secret = process.env.INSTITUTION_JWT_SECRET || process.env.ADMIN_JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET;
  if (!secret) return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || decoded.role !== 'student') return res.status(403).json({ success: false, message: 'forbidden' });
    req.student = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'invalid token' });
  }
};

module.exports = verifyStudent;
