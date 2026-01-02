/*
	Small utility script to reset passwords for all institutional
	accounts to a known value, using the same Werkzeug-compatible
	hashing format as the Python backend.

	Usage (from backend-node directory):
	  set MONGO_URI="your-mongodb-uri"
	  set NEW_INSTITUTIONAL_PASSWORD="NewPassword123"
	  node scripts/resetInstitutionalPasswords.js
*/

/* eslint-disable no-console */

const { connectDb, getDb } = require('../src/config/db');
const { hashPassword } = require('../src/utils/password');

async function main() {
	const uri = process.env.MONGO_URI;
	const newPassword = process.env.NEW_INSTITUTIONAL_PASSWORD;
	if (!uri) {
		console.error('MONGO_URI env var is required');
		process.exit(1);
	}
	if (!newPassword) {
		console.error('NEW_INSTITUTIONAL_PASSWORD env var is required');
		process.exit(1);
	}

	await connectDb(uri);
	const db = getDb();
	const coll = db.collection('institutionals');

	const hashed = await hashPassword(newPassword);
	const result = await coll.updateMany({}, { $set: { password: hashed } });
	console.log(
		`Updated ${result.modifiedCount} institutional document(s) with new hashed password.`,
	);
	process.exit(0);
}

main().catch((err) => {
	console.error('Error resetting institutional passwords:', err);
	process.exit(1);
});
