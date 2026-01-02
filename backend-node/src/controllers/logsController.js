const { getDb } = require('../config/db');

// In-memory fallback store when MongoDB isn't available
let _store = [];

async function logEvent(username, role, action, extra = null) {
	try {
		const entry = {
			username,
			role,
			action,
			ts: new Date(),
		};
		if (extra) entry.extra = extra;

		try {
			const db = getDb();
			const coll = db.collection('auth_logs');
			await coll.insertOne(entry);
			return true;
		} catch (err) {
			// fallthrough to in-memory
		}

		// store serializable representation
		_store.push({ username, role, action, ts: entry.ts.toISOString(), extra });
		return true;
	} catch (err) {
		// eslint-disable-next-line no-console
		console.error('Failed to log event', err);
		return false;
	}
}

async function getLogs(opts = {}) {
	// opts: { username, role, action, startTs, endTs, limit }
	const limit = Number(opts.limit || 200);

	try {
		const db = getDb();
		const coll = db.collection('auth_logs');
		const q = {};
		if (opts.username) q.username = opts.username;
		if (opts.role) q.role = opts.role;
		if (opts.action) q.action = opts.action;
		if (opts.startTs || opts.endTs) {
			q.ts = {};
			if (opts.startTs) q.ts.$gte = new Date(opts.startTs);
			if (opts.endTs) q.ts.$lte = new Date(opts.endTs);
		}

		const docs = await coll.find(q, { projection: { _id: 0 } }).sort({ ts: -1 }).limit(limit).toArray();
		// convert datetimes to iso strings
		return docs.map((d) => ({ ...d, ts: d.ts instanceof Date ? d.ts.toISOString() : d.ts }));
	} catch (err) {
		// fallback to in-memory store
		const list = Array.from(_store).reverse(); // most recent first
		let filtered = list;
		if (opts.username) filtered = filtered.filter((d) => d.username === opts.username);
		if (opts.role) filtered = filtered.filter((d) => d.role === opts.role);
		if (opts.action) filtered = filtered.filter((d) => d.action === opts.action);
		if (opts.startTs) filtered = filtered.filter((d) => new Date(d.ts) >= new Date(opts.startTs));
		if (opts.endTs) filtered = filtered.filter((d) => new Date(d.ts) <= new Date(opts.endTs));
		return filtered.slice(0, limit);
	}
}

module.exports = {
	logEvent,
	getLogs,
};

// Backup logs to file and delete them from storage (DB or in-memory)
async function backupAndDelete(opts = {}) {
	// fetch all matching logs (use large limit)
	const all = await getLogs({ ...(opts || {}), limit: 1000000 });

	// determine from/to timestamps
	let fromTs = null;
	let toTs = null;
	if (Array.isArray(all) && all.length) {
		const times = all.map((d) => new Date(d.ts));
		times.sort((a, b) => a.getTime() - b.getTime());
		fromTs = times[0];
		toTs = times[times.length - 1];
	} else {
		fromTs = opts.startTs ? new Date(opts.startTs) : new Date();
		toTs = opts.endTs ? new Date(opts.endTs) : new Date();
	}

	const fs = require('fs').promises;
	const path = require('path');
	const outDir = path.resolve(process.cwd(), 'logs_backups');
	await fs.mkdir(outDir, { recursive: true });

	function fmt(d) {
		try {
			return new Date(d).toISOString().replace(/[:.]/g, '-');
		} catch (e) {
			return String(d);
		}
	}

	const fromStr = fromTs ? fmt(fromTs) : 'unknown_from';
	const toStr = toTs ? fmt(toTs) : 'unknown_to';
	const filename = `${fromStr}_to_${toStr}_auditLogs.json`;
	const outfile = path.join(outDir, filename);

	// write full JSON array
	await fs.writeFile(outfile, JSON.stringify(all, null, 2), 'utf8');

	// now delete matching logs
	let deletedCount = 0;
	try {
		const client = (() => {
			try {
				return getDb();
			} catch (e) {
				return null;
			}
		})();

		if (client) {
			// build same query as getLogs
			const q = {};
			if (opts.username) q.username = opts.username;
			if (opts.role) q.role = opts.role;
			if (opts.action) q.action = opts.action;
			if (opts.startTs || opts.endTs) {
				q.ts = {};
				if (opts.startTs) q.ts.$gte = new Date(opts.startTs);
				if (opts.endTs) q.ts.$lte = new Date(opts.endTs);
			}
			const coll = getDb().collection('auth_logs');
			const res = await coll.deleteMany(q);
			deletedCount = res.deletedCount || 0;
		} else {
			// in-memory fallback: remove matching entries
			const before = _store.length;
			_store = _store.filter((d) => {
				if (opts.username && d.username !== opts.username) return true;
				if (opts.role && d.role !== opts.role) return true;
				if (opts.action && d.action !== opts.action) return true;
				if (opts.startTs && new Date(d.ts) < new Date(opts.startTs)) return true;
				if (opts.endTs && new Date(d.ts) > new Date(opts.endTs)) return true;
				return false; // remove matching
			});
			deletedCount = before - _store.length;
		}
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error('backupAndDelete: delete error', e);
	}

	return { filename, path: outfile, deletedCount };
}

module.exports.backupAndDelete = backupAndDelete;
