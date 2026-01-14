const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Log important env presence at startup for debugging
const _saSecret = (process.env.SUPERADMIN_JWT_SECRET || '').toString().trim();
const _adminSecret = (process.env.ADMIN_JWT_SECRET || '').toString().trim();
const _instSecret = (process.env.INSTITUTION_JWT_SECRET || '').toString().trim();
const _mongoUri = (process.env.MONGO_URI || '').toString().trim();
console.log('[ENV] SUPERADMIN_JWT_SECRET set:', _saSecret ? 'yes' : 'no');
console.log('[ENV] ADMIN_JWT_SECRET set:', _adminSecret ? 'yes' : 'no');
console.log('[ENV] INSTITUTION_JWT_SECRET set:', _instSecret ? 'yes' : 'no');
console.log('[ENV] MONGO_URI set:', _mongoUri ? 'yes' : 'no');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body || {}).length) console.log('[REQ BODY]', req.body);
  // DEBUG: log relevant headers to help trace missing Authorization
  console.log('[REQ HEADERS]', { authorization: req.headers.authorization, cookie: req.headers.cookie, origin: req.headers.origin, host: req.headers.host });
  next();
});

// Connect to MongoDB if provided
const mongoose = require('mongoose');
const mongoUri = (process.env.MONGO_URI || '').trim();
if (mongoUri) {
  mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err.message));
} else {
  console.warn('MONGO_URI not set; MongoDB features will be disabled');
}

// Serve static files first
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  console.log('[SERVER] Found frontend build at', frontendDist, '- serving static files');
  app.use(express.static(frontendDist));
}

// SPA routing middleware - intercept requests that prefer HTML and serve SPA
app.use((req, res, next) => {
  // Skip if not a GET request
  if (req.method !== 'GET') {
    return next();
  }
  
  // Skip if this is an XHR/fetch request (has these headers)
  if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
    return next();
  }
  
  // Check Accept header - only serve HTML if client explicitly lists text/html
  const acceptHeader = req.headers.accept || '';
  const wantsHtml = acceptHeader.includes('text/html');
  const wantsJson = acceptHeader.includes('application/json');
  
  // If client wants HTML but NOT JSON, it's browser navigation
  // (Browsers send: Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8)
  // (Fetch sends: Accept: */* or Accept: application/json)
  if (wantsHtml && !wantsJson && fs.existsSync(frontendDist)) {
    console.log('[SPA] Serving index.html for browser navigation:', req.path);
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  
  // Otherwise, continue to API routes
  next();
});

// API Routes registered AFTER SPA middleware
// SuperAdmin routes
const superAdminRoutes = require('./routes/SuperAdmin/SuperAdminRoutes');
app.use('/superadmin', superAdminRoutes);

// Admin routes (persistent admins stored in MongoDB)
const adminRoutes = require('./routes/Admin/AdminRoutes');
app.use('/admin', adminRoutes);

// Institution public routes
const institutionRoutes = require('./routes/Institution/InstitutionRoutes');
app.use('/institution', institutionRoutes);

// Contributor routes
try {
  const contributorRoutes = require('./routes/Contributor/ContributorRoutes');
  app.use('/contributor', contributorRoutes);
  console.log('[SERVER] Contributor routes registered at /contributor');
} catch (e) {
  console.log('[SERVER] No contributor routes registered:', e && e.message);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
