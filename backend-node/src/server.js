require('dotenv').config();

// Ensure a sensible default for NODE_ENV when not explicitly set by the environment
if (!process.env.NODE_ENV) {
	process.env.NODE_ENV = 'production';
}

const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDb } = require('./config/db');

// Route modules
const adminRoutes = require('./routes/adminRoutes');
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const facultyFeaturesRoutes = require('./routes/facultyFeaturesRoutes');
const institutionalRoutes = require('./routes/institutionalRoutes');
const logsRoutes = require('./routes/logsRoutes');

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS: allow frontend (Vite dev) to talk to this backend
// In dev, Vite proxies /api to 5000, but enabling CORS is
// still useful if you hit the API directly from the browser.
app.use(
	cors({
		origin: '*',
	})
);

// Simple health check
app.get('/api/health', (req, res) => {
	res.status(200).json({ ok: true, status: 'up' });
});

// Mount role-based route groups
app.use(adminRoutes);
app.use(authRoutes);
app.use(studentRoutes);
app.use(facultyRoutes);
app.use(facultyFeaturesRoutes);
app.use(institutionalRoutes);
app.use(logsRoutes);

// Fallback for unknown API routes
app.use('/api', (req, res) => {
	res.status(404).json({ ok: false, error: 'Not found' });
});

// Serve frontend `dist` (if present) for production / static hosting.
// This allows the backend to serve the built frontend and handle client-side routing.
const distPath = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(distPath));

// For any non-API route, return the frontend index.html so the SPA can handle routing.
// Use `app.use` instead of a wildcard route string to avoid path-to-regexp parsing issues.
app.use((req, res, next) => {
	if (req.path.startsWith('/api')) return next()
	return res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 5005;

// Connect to MongoDB first, then start server
const uri = process.env.MONGO_URI;

// Try to connect to MongoDB, but don't block server startup if connection fails.
connectDb(uri)
	.then(() => {
		console.log('Connected to MongoDB');
	})
	.catch((err) => {
		console.error('Failed to connect to MongoDB', err);
		console.warn('Starting server without a database connection. Some features may not work.');
	})
	.finally(() => {
		app.listen(PORT, () => {
			console.log(`Node backend listening on port ${PORT}`);
		});
	});

module.exports = app;

