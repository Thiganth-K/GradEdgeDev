const { MongoClient } = require('mongodb');

let client;

async function connectDb(uri) {
	if (client) return client;
	if (!uri) {
		throw new Error('MONGO_URI is not defined');
	}
	client = new MongoClient(uri);
	await client.connect();
	return client;
}

function getClient() {
	if (!client) {
		throw new Error('MongoDB client not initialized. Call connectDb() first.');
	}
	return client;
}

function getDb(dbName = 'gradedgedev') {
	return getClient().db(dbName);
}

module.exports = {
	connectDb,
	getClient,
	getDb,
};

