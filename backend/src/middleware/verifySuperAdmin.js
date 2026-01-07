const jwt = require('jsonwebtoken');

const verifySuperAdmin = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ success: false, message: 'missing or invalid authorization header' });
  }

  const token = parts[1];
  const secret = process.env.SUPERADMIN_JWT_SECRET;
  if (!secret) return res.status(500).json({ success: false, message: 'server jwt secret not configured' });

  try {
    const decoded = jwt.verify(token, secret);
    // ensure role
    if (!decoded || decoded.role !== 'SuperAdmin') return res.status(403).json({ success: false, message: 'forbidden' });
    req.superadmin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'invalid token' });
  }
};

module.exports = verifySuperAdmin;
