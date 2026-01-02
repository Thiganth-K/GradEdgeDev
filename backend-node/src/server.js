require('dotenv').config();

const express = require('express');
const cors = require('cors');
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

const PORT = process.env.PORT || 5000;

// Connect to MongoDB first, then start server
const uri = process.env.MONGO_URI;

connectDb(uri)
	.then(() => {
		console.log('Connected to MongoDB');
		app.listen(PORT, () => {
			console.log(`Node backend listening on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error('Failed to connect to MongoDB', err);
		process.exit(1);
	});

module.exports = app;

