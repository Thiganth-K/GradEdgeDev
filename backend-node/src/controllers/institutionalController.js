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
		// Keep the fields in the requested order for insertion
		institution_name:
			payload.institution_name && String(payload.institution_name).trim(),
		institution_type:
			payload.institution_type && String(payload.institution_type).trim(),
		address:
			payload.address && String(payload.address).trim(),
		city:
			payload.city && String(payload.city).trim(),
		state:
			payload.state && String(payload.state).trim(),
		phone:
			payload.phone && String(payload.phone).trim(),
		email: payload.email && String(payload.email).trim(),
		head_name:
			payload.head_name && String(payload.head_name).trim(),
		institutional_id:
			payload.institutional_id && String(payload.institutional_id).trim(),
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
	if (payload.institution_type !== undefined) {
		update.institution_type =
			payload.institution_type === null ? null : String(payload.institution_type).trim();
	}
	if (payload.address !== undefined) {
		update.address = payload.address === null ? null : String(payload.address).trim();
	}
	if (payload.city !== undefined) {
		update.city = payload.city === null ? null : String(payload.city).trim();
	}
	if (payload.state !== undefined) {
		update.state = payload.state === null ? null : String(payload.state).trim();
	}
	if (payload.phone !== undefined) {
		update.phone = payload.phone === null ? null : String(payload.phone).trim();
	}
	if (payload.head_name !== undefined) {
		update.head_name = payload.head_name === null ? null : String(payload.head_name).trim();
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
