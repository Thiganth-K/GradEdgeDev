// Batch controller inspired by backend/src/controllers/batch_controller.py.
// Handles batches per institution and assignment of students to batches.

const { getDb } = require('../config/db');

const COLLECTION = 'batches';

async function createBatch(institutionalId, payload) {
	// eslint-disable-next-line no-console
	console.log('[BATCH] createBatch called', { institutionalId, batch_code: payload && payload.batch_code, time: new Date().toISOString() });
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}
	const batchCode = payload.batch_code && String(payload.batch_code).trim();
	if (!batchCode) {
		throw new Error('batch_code required');
	}

	const db = getDb();
	const coll = db.collection(COLLECTION);
	const existing = await coll.findOne({ batch_code: batchCode, institutional_id: institutionalId });
	if (existing) {
		throw new Error('batch_code already exists for this institution');
	}

	// If a faculty_id is provided, ensure that faculty belongs to this institution
	// Note: faculty validation is handled below after `doc` is built.

	// Validate faculty assignment if provided
	if (payload && payload.faculty_id) {
		const facultyColl = db.collection('faculty');
		const f = await facultyColl.findOne({ faculty_id: payload.faculty_id, institutional_id: institutionalId });
		if (!f) {
			throw new Error('assigned faculty not found for this institution');
		}
	}

	const doc = {
		batch_code: batchCode,
		institutional_id: institutionalId,
		name: payload.name && String(payload.name).trim(),
		department: payload.department && String(payload.department).trim(),
		year: payload.year && String(payload.year).trim(),
		section: payload.section && String(payload.section).trim(),
		faculty_id: payload.faculty_id && String(payload.faculty_id).trim(),
		students: [], // list of enrollment_ids
	};

	await coll.insertOne(doc);
	return doc;
}

async function listBatches(institutionalId) {
	// eslint-disable-next-line no-console
	console.log('[BATCH] listBatches called', { institutionalId, time: new Date().toISOString() });
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}
	const db = getDb();
	const coll = db.collection(COLLECTION);
	const docs = await coll
		.find({ institutional_id: institutionalId }, { projection: { _id: 0 } })
		.toArray();
	return docs;
}

async function listBatchesForFaculty(facultyId) {
	// eslint-disable-next-line no-console
	console.log('[BATCH] listBatchesForFaculty called', { facultyId, time: new Date().toISOString() });
	if (!facultyId) {
		// No faculty id supplied — return empty list rather than throwing.
		return [];
	}

	const db = getDb();
	const coll = db.collection(COLLECTION);

	// Try to resolve the faculty's institutional_id so faculty can see all batches
	// belonging to their institution as well as batches explicitly assigned to them.
	const facultyColl = db.collection('faculty');
	const facultyDoc = await facultyColl.findOne({ faculty_id: facultyId });

	let matchStage = { faculty_id: facultyId };
	
	if (facultyDoc && facultyDoc.institutional_id) {
		matchStage = {
			$or: [
				{ faculty_id: facultyId },
				{ institutional_id: facultyDoc.institutional_id }
			]
		};
	}

	const pipeline = [
		{ $match: matchStage },
		{
			$lookup: {
				from: 'faculty',
				localField: 'faculty_id',
				foreignField: 'faculty_id',
				as: 'faculty_info'
			}
		},
		{
			$addFields: {
				faculty_name: {
					$ifNull: [
						{ $arrayElemAt: ["$faculty_info.full_name", 0] },
						"Unknown Faculty"
					]
				}
			}
		},
		{
			$project: {
				_id: 0,
				faculty_info: 0
			}
		}
	];

	const docs = await coll.aggregate(pipeline).toArray();
	return docs;
}

async function addStudentsToBatch(batchCode, studentIds) {
	// eslint-disable-next-line no-console
	console.log('[BATCH] addStudentsToBatch called', { batchCode, studentCount: Array.isArray(studentIds) ? studentIds.length : 0, time: new Date().toISOString() });
	if (!batchCode) {
		throw new Error('batch_code required');
	}
	if (!Array.isArray(studentIds) || studentIds.length === 0) {
		throw new Error('student_ids required');
	}

	const db = getDb();
	const collBatches = db.collection(COLLECTION);
	const batch = await collBatches.findOne({ batch_code: batchCode });
	if (!batch) {
		throw new Error('Batch not found');
	}

	// Update batch membership
	await collBatches.updateOne(
		{ batch_code: batchCode },
		{ $addToSet: { students: { $each: studentIds } } }
	);

	// Also update students with batch assignment (best-effort)
	const collStudents = db.collection('students');
	const filter = {
		institutional_id: batch.institutional_id,
		enrollment_id: { $in: studentIds },
	};
	await collStudents.updateMany(filter, {
		$set: { batch_id: batchCode, faculty_id: batch.faculty_id },
	});

	const updated = await collBatches.findOne(
		{ batch_code: batchCode },
		{ projection: { _id: 0 } }
	);
	return updated || { batch_code: batchCode, students: studentIds };
}

async function updateBatch(institutionalId, batchCode, payload) {
	if (!institutionalId) throw new Error('institutional_id required');
	if (!batchCode) throw new Error('batch_code required');

	const db = getDb();
	const coll = db.collection(COLLECTION);

	// Ensure batch exists for this institution
	const existing = await coll.findOne({ batch_code: batchCode, institutional_id: institutionalId });
	if (!existing) throw new Error('batch not found for this institution');

	const update = {};
	if (payload.name !== undefined) update.name = payload.name === null ? null : String(payload.name).trim();
	if (payload.department !== undefined) update.department = payload.department === null ? null : String(payload.department).trim();
	if (payload.year !== undefined) update.year = payload.year === null ? null : String(payload.year).trim();
	if (payload.section !== undefined) update.section = payload.section === null ? null : String(payload.section).trim();
	if (payload.faculty_id !== undefined) update.faculty_id = payload.faculty_id ? String(payload.faculty_id).trim() : null;

	if (payload.faculty_id) {
		// Validate faculty belongs to institution
		const f = await db.collection('faculty').findOne({ faculty_id: payload.faculty_id, institutional_id: institutionalId });
		if (!f) throw new Error('assigned faculty not found for this institution');
	}

	if (Object.keys(update).length === 0) throw new Error('no fields to update');

	await coll.updateOne({ batch_code: batchCode, institutional_id: institutionalId }, { $set: update });
	const doc = await coll.findOne({ batch_code: batchCode, institutional_id: institutionalId }, { projection: { _id: 0 } });
	return doc;
}

async function deleteBatch(institutionalId, batchCode) {
	if (!institutionalId) throw new Error('institutional_id required');
	if (!batchCode) throw new Error('batch_code required');
	const db = getDb();
	const coll = db.collection(COLLECTION);
	// eslint-disable-next-line no-console
	console.log('[BATCH] deleteBatch called', { institutionalId, batchCode, time: new Date().toISOString() });
	try {
		const query = { batch_code: batchCode, institutional_id: institutionalId };
		// eslint-disable-next-line no-console
		console.log('[BATCH] deleteOne query', { query });
		const res = await coll.deleteOne(query);
		// eslint-disable-next-line no-console
		console.log('[BATCH] deleteOne result', { deletedCount: res.deletedCount });

		if (res.deletedCount > 0) {
			return true;
		}

		// If nothing was deleted, investigate why and log details for debugging
		// Check if a batch with this code exists at all
		const existing = await coll.findOne({ batch_code: batchCode });
		if (!existing) {
			// eslint-disable-next-line no-console
			console.log('[BATCH] delete failed: batch_code not found', { batch_code: batchCode });
			return false;
		}

		// If batch exists but institutional_id doesn't match, log that
		if (existing.institutional_id && String(existing.institutional_id) !== String(institutionalId)) {
			// eslint-disable-next-line no-console
			console.log('[BATCH] delete failed: batch belongs to different institution', {
				batch_code: batchCode,
				existing_institutional_id: existing.institutional_id,
				requested_institutional_id: institutionalId,
			});
			return false;
		}

		// Unknown reason — log the existing document for inspection
		// eslint-disable-next-line no-console
		console.log('[BATCH] delete failed: unknown reason, existing doc', { existing });
		return false;
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('[BATCH] deleteBatch error', err && err.stack ? err.stack : err);
		throw err;
	}
}

module.exports = {
	createBatch,
	listBatches,
	listBatchesForFaculty,
	addStudentsToBatch,
	updateBatch,
	deleteBatch,
};
