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
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Simple request logger for debugging
app.use((req, res, next) => {
  console.log(`[REQ] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  if (Object.keys(req.body || {}).length) console.log('[REQ BODY]', req.body);
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

// SuperAdmin routes
const superAdminRoutes = require('./routes/SuperAdmin/SuperAdminRoutes');
app.use('/superadmin', superAdminRoutes);

// Admin routes (persistent admins stored in MongoDB)
const adminRoutes = require('./routes/Admin/AdminRoutes');
app.use('/admin', adminRoutes);

// Institution public routes
const institutionRoutes = require('./routes/Institution/InstitutionRoutes');
app.use('/institution', institutionRoutes);

// default root handler will be registered below depending on whether a frontend build exists

// If a built frontend exists, serve it as static files (single-step deploy)
try {
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    console.log('[SERVER] Found frontend build at', frontendDist, '- serving static files');
    app.use(express.static(frontendDist));
    // Use a regex route to avoid path-to-regexp parameter parsing issues
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  } else {
    console.log('[SERVER] No frontend build found at', frontendDist);
    // expose a simple JSON root when frontend not present
    app.get('/', (req, res) => {
      res.json({ message: 'GradEdgeDev backend running' });
    });
  }
} catch (e) {
  console.warn('[SERVER] Error while checking frontend build:', e && e.message);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
