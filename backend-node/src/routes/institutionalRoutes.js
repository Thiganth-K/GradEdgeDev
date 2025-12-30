const express = require('express');

const {
	createInstitutional,
	listInstitutional,
	getInstitutional,
	updateInstitutional,
	deleteInstitutional,
} = require('../controllers/institutionalController');
const {
	listFacultyByInstitution,
	createFacultyForInstitution,
	updateFacultyForInstitution,
	deleteFacultyForInstitution,
} = require('../controllers/facultyController');
const {
	listStudentsByInstitution,
	batchCreateStudents,
	updateStudentForInstitution,
	deleteStudentForInstitution,
} = require('../controllers/studentController');
const {
	createBatch,
	listBatches,
} = require('../controllers/batchController');

const router = express.Router();

// --- Admin-level institutional user management ---

router.get('/api/institutional', async (req, res) => {
	try {
		const docs = await listInstitutional();
		// eslint-disable-next-line no-console
		console.log('[ADMIN] Listed all institutional users', {
			count: Array.isArray(docs) ? docs.length : 0,
			timestamp: new Date().toISOString(),
		});
		res.status(200).json({ ok: true, data: docs });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Error listing institutional users', err);
		res.status(500).json({ ok: false, error: 'Failed to list institutional users' });
	}
});

router.post('/api/institutional', async (req, res) => {
	try {
		const created = await createInstitutional(req.body || {});
		// eslint-disable-next-line no-console
		console.log('[ADMIN] Created institutional user', {
			username: created && created.username,
			institutional_id: created && created.institutional_id,
			timestamp: new Date().toISOString(),
		});
		res.status(201).json({ ok: true, data: created });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message || 'Failed to create institutional user' });
	}
});

router.get('/api/institutional/:username', async (req, res) => {
	try {
		const doc = await getInstitutional(req.params.username);
		if (!doc) {
			// eslint-disable-next-line no-console
			console.log('[ADMIN] Institutional user not found', {
				username: req.params.username,
				timestamp: new Date().toISOString(),
			});
			return res.status(404).json({ ok: false, error: 'Not found' });
		}
		// eslint-disable-next-line no-console
		console.log('[ADMIN] Fetched institutional user', {
			username: doc.username,
			institutional_id: doc.institutional_id,
			timestamp: new Date().toISOString(),
		});
		return res.status(200).json({ ok: true, data: doc });
	} catch (err) {
		return res.status(500).json({ ok: false, error: 'Failed to fetch institutional user' });
	}
});

router.put('/api/institutional/:username', async (req, res) => {
	try {
		const updated = await updateInstitutional(req.params.username, req.body || {});
		// eslint-disable-next-line no-console
		console.log('[ADMIN] Updated institutional user', {
			username: updated && updated.username,
			institutional_id: updated && updated.institutional_id,
			timestamp: new Date().toISOString(),
		});
		res.status(200).json({ ok: true, data: updated });
	} catch (err) {
		const msg = err.message || 'Failed to update institutional user';
		const status = msg === 'not found' ? 404 : 400;
		res.status(status).json({ ok: false, error: msg });
	}
});

router.delete('/api/institutional/:username', async (req, res) => {
	try {
		const deleted = await deleteInstitutional(req.params.username);
		if (!deleted) {
			// eslint-disable-next-line no-console
			console.log('[ADMIN] Tried to delete missing institutional user', {
				username: req.params.username,
				timestamp: new Date().toISOString(),
			});
			return res.status(404).json({ ok: false, error: 'Not found' });
		}
		// eslint-disable-next-line no-console
		console.log('[ADMIN] Deleted institutional user', {
			username: req.params.username,
			timestamp: new Date().toISOString(),
		});
		return res.status(200).json({ ok: true });
	} catch (err) {
		return res.status(500).json({ ok: false, error: 'Failed to delete institutional user' });
	}
});

// --- Institutional-level faculty management ---

router.get('/api/institutional/:institutionId/faculty', async (req, res) => {
	try {
		const docs = await listFacultyByInstitution(req.params.institutionId);
		res.status(200).json({ ok: true, data: docs });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message || 'Failed to list faculty' });
	}
});

router.post('/api/institutional/:institutionId/faculty', async (req, res) => {
	try {
		const created = await createFacultyForInstitution(
			req.params.institutionId,
			req.body || {}
		);
		res.status(201).json({ ok: true, data: created });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message || 'Failed to create faculty' });
	}
});

router.put('/api/institutional/:institutionId/faculty/:username', async (req, res) => {
	try {
		const updated = await updateFacultyForInstitution(
			req.params.institutionId,
			req.params.username,
			req.body || {}
		);
		res.status(200).json({ ok: true, data: updated });
	} catch (err) {
		const msg = err.message || 'Failed to update faculty';
		res.status(400).json({ ok: false, error: msg });
	}
});

router.delete('/api/institutional/:institutionId/faculty/:username', async (req, res) => {
	try {
		const deleted = await deleteFacultyForInstitution(
			req.params.institutionId,
			req.params.username
		);
		if (!deleted) {
			return res.status(404).json({ ok: false, error: 'Not found' });
		}
		return res.status(200).json({ ok: true });
	} catch (err) {
		return res.status(400).json({ ok: false, error: err.message || 'Failed to delete faculty' });
	}
});

// --- Institutional-level student management ---

router.get('/api/institutional/:institutionId/students', async (req, res) => {
	try {
		const docs = await listStudentsByInstitution(req.params.institutionId);
		res.status(200).json({ ok: true, data: docs });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message || 'Failed to list students' });
	}
});

router.put('/api/institutional/:institutionId/students/:enrollmentId', async (req, res) => {
	try {
		const updated = await updateStudentForInstitution(
			req.params.institutionId,
			req.params.enrollmentId,
			req.body || {}
		);
		res.status(200).json({ ok: true, data: updated });
	} catch (err) {
		const msg = err.message || 'Failed to update student';
		res.status(400).json({ ok: false, error: msg });
	}
});

router.delete('/api/institutional/:institutionId/students/:enrollmentId', async (req, res) => {
	try {
		const deleted = await deleteStudentForInstitution(
			req.params.institutionId,
			req.params.enrollmentId
		);
		if (!deleted) {
			return res.status(404).json({ ok: false, error: 'Not found' });
		}
		return res.status(200).json({ ok: true });
	} catch (err) {
		return res.status(400).json({ ok: false, error: err.message || 'Failed to delete student' });
	}
});

router.post('/api/institutional/:institutionId/students/batch', async (req, res) => {
	try {
		const created = await batchCreateStudents(
			req.params.institutionId,
			req.body || {}
		);
		res.status(201).json({ ok: true, data: created });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message || 'Failed to create students' });
	}
});

// --- Institutional-level batch management ---

router.get('/api/institutional/:institutionId/batches', async (req, res) => {
	try {
		const docs = await listBatches(req.params.institutionId);
		res.status(200).json({ ok: true, data: docs });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message || 'Failed to list batches' });
	}
});

router.post('/api/institutional/:institutionId/batches', async (req, res) => {
	try {
		const created = await createBatch(
			req.params.institutionId,
			req.body || {}
		);
		res.status(201).json({ ok: true, data: created });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message || 'Failed to create batch' });
	}
});

module.exports = router;
