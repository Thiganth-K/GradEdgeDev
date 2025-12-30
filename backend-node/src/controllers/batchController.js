// Batch controller inspired by backend/src/controllers/batch_controller.py.
// Handles batches per institution and assignment of students to batches.

const { getDb } = require('../config/db');

const COLLECTION = 'batches';

async function createBatch(institutionalId, payload) {
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
	if (!facultyId) {
		throw new Error('faculty_id required');
	}
	const db = getDb();
	const coll = db.collection(COLLECTION);
	const docs = await coll
		.find({ faculty_id: facultyId }, { projection: { _id: 0 } })
		.toArray();
	return docs;
}

async function addStudentsToBatch(batchCode, studentIds) {
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

module.exports = {
	createBatch,
	listBatches,
	listBatchesForFaculty,
	addStudentsToBatch,
};
