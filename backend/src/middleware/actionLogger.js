const fs = require('fs');
const path = require('path');

/**
 * Request/response action logger
 * Writes JSON Lines to src/logs/actions.log
 * Captures: time, method, url, base, status, duration, roleGroup, actor
 */
function actionLogger(defaultGroup = 'Unknown') {
  const logDir = path.resolve(__dirname, '../logs');
  const logFile = path.join(logDir, 'actions.log');
  if (!fs.existsSync(logDir)) {
    try { fs.mkdirSync(logDir, { recursive: true }); } catch (_) {}
  }

  return (req, res, next) => {
    const start = Date.now();
    // Determine group by path if not explicitly provided
    let roleGroup = defaultGroup;
    const url = (req.originalUrl || req.url || '').toLowerCase();
    if (roleGroup === 'Institution') {
      if (url.includes('/faculty/')) roleGroup = 'Faculty';
      else if (url.includes('/student/')) roleGroup = 'Student';
    }

    const actor = (req.superadmin && req.superadmin.username)
      || (req.admin && req.admin.username)
      || (req.institution && (req.institution.name || req.institution.institutionId))
      || (req.faculty && req.faculty.name)
      || (req.student && req.student.name)
      || null;

    res.on('finish', () => {
      const entry = {
        time: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl || req.url,
        base: req.baseUrl || defaultGroup,
        status: res.statusCode,
        durationMs: Date.now() - start,
        roleGroup,
        actor,
      };
      try {
        fs.appendFile(logFile, JSON.stringify(entry) + '\n', () => {});
      } catch (_) {
        // swallow logging errors
      }
    });

    next();
  };
}

module.exports = actionLogger;
