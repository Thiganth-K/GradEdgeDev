// Institutional controller inspired by backend/src/controllers/institutional_controller.py.
// Uses the shared MongoDB connection from src/config/db.js.

const { getDb } = require('../config/db');
const { hashPassword } = require('../utils/password');

const COLLECTION = 'institutionals';

async function createInstitutional(payload) {
	// eslint-disable-next-line no-console
	console.log('[INSTITUTIONAL] createInstitutional called', { username: payload && payload.username, hasPassword: Boolean(payload && payload.password), time: new Date().toISOString() });
	const username = payload.username && String(payload.username).trim();
	const password = payload.password && String(payload.password);

	if (!username || !password) {
		throw new Error('username and password required');
	}

	const db = getDb();
	const coll = db.collection(COLLECTION);

	const existing = await coll.findOne({ username });
	if (existing) {
		throw new Error('username already exists');
	}

	const hashed = await hashPassword(password);

	const doc = {
		username,
		password: hashed,
		institutional_id:
			payload.institutional_id && String(payload.institutional_id).trim(),
		institution_name:
			payload.institution_name && String(payload.institution_name).trim(),
		email: payload.email && String(payload.email).trim(),
	};

	const res = await coll.insertOne(doc);
	const result = { ...doc, _id: res.insertedId.toString() };
	delete result.password;
	return result;
}

async function listInstitutional() {
	// eslint-disable-next-line no-console
	console.log('[INSTITUTIONAL] listInstitutional called', { time: new Date().toISOString() });
	const db = getDb();
	const coll = db.collection(COLLECTION);
	// Exclude password from results
	const docs = await coll
		.find({}, { projection: { password: 0 } })
		.toArray();
	return docs;
}

async function getInstitutional(username) {
	// eslint-disable-next-line no-console
	console.log('[INSTITUTIONAL] getInstitutional called', { username, time: new Date().toISOString() });
	const db = getDb();
	const coll = db.collection(COLLECTION);
	const doc = await coll.findOne(
		{ username },
		{ projection: { password: 0 } }
	);
	return doc;
}

async function updateInstitutional(username, payload) {
	// eslint-disable-next-line no-console
	console.log('[INSTITUTIONAL] updateInstitutional called', { username, fields: Object.keys(payload || {}).filter(k=>k!=='password'), hasPassword: Boolean(payload && payload.password), time: new Date().toISOString() });
	const update = {};

	if (payload.institutional_id !== undefined) {
		update.institutional_id =
			payload.institutional_id === null
				? null
				: String(payload.institutional_id).trim();
	}
	if (payload.institution_name !== undefined) {
		update.institution_name =
			payload.institution_name === null
				? null
				: String(payload.institution_name).trim();
	}
	if (payload.email !== undefined) {
		update.email =
			payload.email === null ? null : String(payload.email).trim();
	}
	if (payload.password) {
		update.password = await hashPassword(String(payload.password));
	}

	if (Object.keys(update).length === 0) {
		throw new Error('no fields to update');
	}

	const db = getDb();
	const coll = db.collection(COLLECTION);

	const res = await coll.updateOne({ username }, { $set: update });
	if (!res.matchedCount) {
		throw new Error('not found');
	}

	const doc = await coll.findOne(
		{ username },
		{ projection: { password: 0 } }
	);
	return doc;
}

async function deleteInstitutional(username) {
	// eslint-disable-next-line no-console
	console.log('[INSTITUTIONAL] deleteInstitutional called', { username, time: new Date().toISOString() });
	const db = getDb();
	const coll = db.collection(COLLECTION);
	const res = await coll.deleteOne({ username });
	return res.deletedCount > 0;
}

module.exports = {
	createInstitutional,
	listInstitutional,
	getInstitutional,
	updateInstitutional,
	deleteInstitutional,
};
