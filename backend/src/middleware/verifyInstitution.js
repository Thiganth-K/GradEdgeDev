const jwt = require('jsonwebtoken');

const verifyInstitution = (req, res, next) => {
  const auth = req.headers.authorization || '';
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('[verifyInstitution] ✗ missing or invalid authorization header');
    return res.status(401).json({ success: false, message: 'missing or invalid authorization header' });
  }

  const token = parts[1];
  const secret = process.env.INSTITUTION_JWT_SECRET || process.env.ADMIN_JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET;
  if (!secret) {
    console.error('[verifyInstitution] ✗ server jwt secret not configured');
    return res.status(500).json({ success: false, message: 'server jwt secret not configured' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    console.log('[verifyInstitution] decoded token:', { role: decoded.role, id: decoded.id, institutionId: decoded.institutionId });
    if (!decoded || decoded.role !== 'institution') {
      console.log('[verifyInstitution] ✗ forbidden - role mismatch, expected: institution, got:', decoded.role);
      return res.status(403).json({ success: false, message: 'forbidden' });
    }
    req.institution = decoded;
    console.log('[verifyInstitution] ✓ authenticated institution:', decoded.institutionId || decoded.name);
    next();
  } catch (err) {
    console.error('[verifyInstitution] ✗ token verification error:', err.message);
    return res.status(401).json({ success: false, message: 'invalid token' });
  }
};

module.exports = verifyInstitution;
