const jwt = require('jsonwebtoken');

const verifyContributor = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('[verifyContributor] missing or invalid authorization header');
    return res.status(401).json({ success: false, message: 'missing or invalid authorization header' });
  }

  const token = parts[1];
  const secret = process.env.CONTRIBUTOR_JWT_SECRET || process.env.ADMIN_JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET;
  if (!secret) {
    console.error('[verifyContributor] jwt secret not configured');
    return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || decoded.role !== 'contributor') {
      console.log('[verifyContributor] token decoded but role mismatch or missing', decoded && decoded.role);
      return res.status(403).json({ success: false, message: 'forbidden' });
    }
    req.contributor = decoded;
    next();
  } catch (err) {
    console.log('[verifyContributor] invalid token:', err && err.message);
    return res.status(401).json({ success: false, message: 'invalid token' });
  }
};

module.exports = verifyContributor;
