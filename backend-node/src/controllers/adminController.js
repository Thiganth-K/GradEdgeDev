function getAdminInfo() {
	// Mirrors backend/src/routes/admin_routes.py logic:
	// derive admin username from environment with a sensible default.
	const username =
		process.env.ADMIN_USERNAME ||
		process.env.ADMIN_USER ||
		process.env.ADMIN ||
		'thiganth';

	return {
		username,
		greeting: `Welcome, ${username}!`,
	};
}

module.exports = {
	getAdminInfo,
};
