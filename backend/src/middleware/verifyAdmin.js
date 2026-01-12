const jwt = require('jsonwebtoken');

const verifyAdmin = (req, res, next) => {
  // log authorization header for debugging (remove in production)
  console.log('[verifyAdmin] authorization header:', req.headers.authorization);
  // Support multiple token sources: Authorization header, x-access-token header, or ?token= query param
  let token = null;
  const authHeader = req.headers.authorization || '';
  if (authHeader && authHeader.split(' ')[0] === 'Bearer') {
    token = authHeader.split(' ')[1];
    console.log('[verifyAdmin] token source: Authorization header');
  } else if (req.headers['x-access-token']) {
    token = req.headers['x-access-token'];
    console.log('[verifyAdmin] token source: x-access-token header');
  } else if (req.query && req.query.token) {
    token = req.query.token;
    console.log('[verifyAdmin] token source: query param');
  }

  // fallback: check cookie header for admin_token (simple parse)
  if (!token && req.headers && req.headers.cookie) {
    try {
      const cookies = req.headers.cookie.split(';').map(c => c.trim());
      for (const c of cookies) {
        if (c.startsWith('admin_token=')) {
          token = decodeURIComponent(c.split('=').slice(1).join('='));
          console.log('[verifyAdmin] token source: cookie admin_token');
          break;
        }
      }
    } catch (e) {
      // ignore cookie parse errors
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'missing or invalid authorization header' });
  }
  const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPERADMIN_JWT_SECRET;
  if (!secret) return res.status(500).json({ success: false, message: 'server admin jwt secret not configured' });

  try {
    const decoded = jwt.verify(token, secret);
    if (!decoded || decoded.role !== 'admin') return res.status(403).json({ success: false, message: 'forbidden' });
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'invalid token' });
  }
};

module.exports = verifyAdmin;
