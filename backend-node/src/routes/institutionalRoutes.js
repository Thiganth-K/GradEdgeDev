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
	updateBatch,
	deleteBatch,
	addStudentsToBatch,
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
	// Prevent non-institutional callers (e.g., admin frontend) from creating faculty.
	// This is a lightweight guard: institutional clients should set header
	// `x-requested-by: institutional` when calling these endpoints.
	const caller = req.headers['x-requested-by'] || '';
	if (String(caller).toLowerCase() !== 'institutional') {
		return res.status(403).json({ ok: false, error: 'Forbidden: only institutional clients may create faculty' });
	}
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
	const caller = req.headers['x-requested-by'] || '';
	if (String(caller).toLowerCase() !== 'institutional') {
		return res.status(403).json({ ok: false, error: 'Forbidden: only institutional clients may update faculty' });
	}
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
	const caller = req.headers['x-requested-by'] || '';
	if (String(caller).toLowerCase() !== 'institutional') {
		return res.status(403).json({ ok: false, error: 'Forbidden: only institutional clients may delete faculty' });
	}
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

// List batches for an institution
router.get('/api/institutional/:institutionId/batches', async (req, res) => {
	try {
		const docs = await listBatches(req.params.institutionId);
		return res.status(200).json({ ok: true, data: docs });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('[ROUTE] Failed to list batches', err && err.stack ? err.stack : err);
		return res.status(400).json({ ok: false, error: err.message || 'Failed to list batches' });
	}
});

// Create a batch (institutional clients only)
router.post('/api/institutional/:institutionId/batches', async (req, res) => {
	const caller = req.headers['x-requested-by'] || '';
	if (String(caller).toLowerCase() !== 'institutional') {
		return res.status(403).json({ ok: false, error: 'Forbidden: only institutional clients may create batches' });
	}
	try {
		const created = await createBatch(req.params.institutionId, req.body || {});
		return res.status(201).json({ ok: true, data: created });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('[ROUTE] Failed to create batch', err && err.stack ? err.stack : err);
		return res.status(400).json({ ok: false, error: err.message || 'Failed to create batch' });
	}
});

// Update a batch (institutional-scoped)
router.put('/api/institutional/:institutionId/batches/:batchCode', async (req, res) => {
	const caller = req.headers['x-requested-by'] || '';
	if (String(caller).toLowerCase() !== 'institutional') {
		return res.status(403).json({ ok: false, error: 'Forbidden: only institutional clients may update batches' });
	}
	try {
		const updated = await updateBatch(req.params.institutionId, req.params.batchCode, req.body || {});
		return res.status(200).json({ ok: true, data: updated });
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('[ROUTE] Failed to update batch', err && err.stack ? err.stack : err);
		const msg = err.message || 'Failed to update batch';
		const status = msg === 'batch not found for this institution' ? 404 : 400;
		return res.status(status).json({ ok: false, error: msg });
	}
});

// Delete a batch (institutional clients only) — returns diagnostic `reason` when not found
router.delete('/api/institutional/:institutionId/batches/:batchCode', async (req, res) => {
	const caller = req.headers['x-requested-by'] || '';
	if (String(caller).toLowerCase() !== 'institutional') {
		return res.status(403).json({ ok: false, error: 'Forbidden: only institutional clients may delete batches' });
	}
	try {
		// eslint-disable-next-line no-console
		console.log('[ROUTE] DELETE batch', { params: req.params, time: new Date().toISOString() });
		const deleted = await deleteBatch(req.params.institutionId, req.params.batchCode);
		if (deleted) return res.status(200).json({ ok: true });

		// Determine reason for failure and return it to client
		try {
			const db = require('../config/db').getDb();
			const coll = db.collection('batches');
			const found = await coll.findOne({ batch_code: req.params.batchCode });
			if (!found) {
				// eslint-disable-next-line no-console
				console.log('[ROUTE] Delete diagnostics: batch_code not found', { batch_code: req.params.batchCode });
				return res.status(404).json({ ok: false, error: 'Not found', reason: 'not_found' });
			}
			if (found.institutional_id && String(found.institutional_id) !== String(req.params.institutionId)) {
				// eslint-disable-next-line no-console
				console.log('[ROUTE] Delete diagnostics: belongs to different institution', { batch_code: req.params.batchCode, existing_institutional_id: found.institutional_id, requested_institutional_id: req.params.institutionId });
				return res.status(403).json({ ok: false, error: 'Batch belongs to another institution', reason: 'belongs_to_other' });
			}
			// fallback
			// eslint-disable-next-line no-console
			console.log('[ROUTE] Delete diagnostics: unknown reason', { found });
			return res.status(400).json({ ok: false, error: 'Unable to delete batch', reason: 'unknown' });
		} catch (diagErr) {
			// eslint-disable-next-line no-console
			console.error('[ROUTE] Delete diagnostics error', diagErr && diagErr.stack ? diagErr.stack : diagErr);
			return res.status(500).json({ ok: false, error: 'Internal diagnostics error', reason: 'diag_error' });
		}
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Error deleting batch', err && err.stack ? err.stack : err);
		return res.status(400).json({ ok: false, error: err.message || 'Failed to delete batch', reason: 'db_error' });
	}
});

// Assign students to a batch as institutional admin
router.post('/api/institutional/:institutionId/batches/:batchCode/assign', async (req, res) => {
	const { student_ids: studentIds } = req.body || {};
	try {
		// ensure batch belongs to institution before assigning
		const db = require('../config/db').getDb();
		const coll = db.collection('batches');
		const batch = await coll.findOne({ batch_code: req.params.batchCode, institutional_id: req.params.institutionId });
		if (!batch) return res.status(404).json({ ok: false, error: 'Batch not found for this institution' });

		const updated = await addStudentsToBatch(req.params.batchCode, studentIds || []);
		res.status(200).json({ ok: true, data: updated });
	} catch (err) {
		res.status(400).json({ ok: false, error: err.message || 'Failed to assign students to batch' });
	}
});

module.exports = router;
