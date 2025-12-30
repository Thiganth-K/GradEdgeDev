// Faculty controller inspired by backend/src/controllers/faculty_controller.py.
// Provides helpers scoped by institutional_id and faculty_id.

const { getDb } = require('../config/db');
const { hashPassword } = require('../utils/password');

const COLLECTION = 'faculty';

async function listFacultyByInstitution(institutionalId) {
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}
	const db = getDb();
	const coll = db.collection(COLLECTION);
	const docs = await coll
		.find({ institutional_id: institutionalId }, { projection: { password: 0 } })
		.toArray();
	return docs;
}

async function createFacultyForInstitution(institutionalId, payload) {
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}
	const username = payload.username && String(payload.username).trim();
	const password = payload.password && String(payload.password);
	if (!username || !password) {
		throw new Error('username and password required');
	}

	const db = getDb();
	const coll = db.collection(COLLECTION);

	const existingUser = await coll.findOne({ username });
	if (existingUser) {
		throw new Error('username already exists');
	}

	// Auto-generate faculty_id with institutional prefix if not provided
	let facultyId = payload.faculty_id && String(payload.faculty_id).trim();
	const prefix = `${institutionalId}-`;
	if (facultyId && !facultyId.startsWith(prefix)) {
		throw new Error('faculty_id must start with institutional_id prefix');
	}
	if (!facultyId) {
		// Generate next sequence
		const existingIds = await coll
			.find({ faculty_id: { $regex: `^${prefix}` } }, { projection: { faculty_id: 1 } })
			.toArray();
		let maxSuffix = 0;
		for (const doc of existingIds) {
			const fid = String(doc.faculty_id || '');
			if (fid.startsWith(prefix)) {
				const parts = fid.split('-');
				const n = parseInt(parts[parts.length - 1], 10);
				if (!Number.isNaN(n) && n > maxSuffix) maxSuffix = n;
			}
		}
		facultyId = `${prefix}${maxSuffix + 1}`;
	}

	const hashed = await hashPassword(password);

	const doc = {
		username,
		password: hashed,
		faculty_id: facultyId,
		institutional_id: institutionalId,
		full_name: payload.full_name && String(payload.full_name).trim(),
		department: payload.department && String(payload.department).trim(),
	};

	const res = await coll.insertOne(doc);
	const result = { ...doc, _id: res.insertedId.toString() };
	delete result.password;
	return result;
}

async function updateFacultyForInstitution(institutionalId, username, payload) {
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}
	if (!username) {
		throw new Error('username required');
	}

	const update = {};
	if (payload.full_name !== undefined) {
		update.full_name =
			payload.full_name === null ? null : String(payload.full_name).trim();
	}
	if (payload.department !== undefined) {
		update.department =
			payload.department === null ? null : String(payload.department).trim();
	}
	if (payload.password) {
		update.password = await hashPassword(String(payload.password));
	}

	if (Object.keys(update).length === 0) {
		throw new Error('no fields to update');
	}

	const db = getDb();
	const coll = db.collection(COLLECTION);

	// Ensure faculty belongs to this institution
	const existing = await coll.findOne({ username, institutional_id: institutionalId });
	if (!existing) {
		throw new Error('faculty not found for this institution');
	}

	await coll.updateOne({ username }, { $set: update });
	const doc = await coll.findOne(
		{ username },
		{ projection: { password: 0 } }
	);
	return doc;
}

async function deleteFacultyForInstitution(institutionalId, username) {
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}
	if (!username) {
		throw new Error('username required');
	}
	const db = getDb();
	const coll = db.collection(COLLECTION);
	const res = await coll.deleteOne({ username, institutional_id: institutionalId });
	return res.deletedCount > 0;
}

async function getFacultyByUsername(username) {
	if (!username) return null;
	const db = getDb();
	const coll = db.collection(COLLECTION);
	const doc = await coll.findOne(
		{ username },
		{ projection: { password: 0 } }
	);
	return doc;
}

async function getFacultyByFacultyId(facultyId) {
	if (!facultyId) return null;
	const db = getDb();
	const coll = db.collection(COLLECTION);
	const doc = await coll.findOne(
		{ faculty_id: facultyId },
		{ projection: { password: 0 } }
	);
	return doc;
}

module.exports = {
	listFacultyByInstitution,
	createFacultyForInstitution,
	updateFacultyForInstitution,
	deleteFacultyForInstitution,
	getFacultyByUsername,
	getFacultyByFacultyId,
};
