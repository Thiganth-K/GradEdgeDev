// Student controller inspired by backend/src/routes/student_routes.py.
// These handlers now use the shared MongoDB connection configured
// in src/config/db.js and mirror the Python logic at a high level.

const { getDb } = require('../config/db');
const { hashPassword } = require('../utils/password');

async function listAllStudents() {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] listAllStudents called', { time: new Date().toISOString() });
	try {
		const db = getDb();
		const students = db.collection('students');
		const docs = await students
			.find({}, { projection: { _id: 0, password: 0 } })
			.limit(50)
			.toArray();

		return {
			ok: true,
			status: 200,
			body: {
				ok: true,
				count: docs.length,
				data: docs,
			},
		};
	} catch (err) {
		console.error('Error listing students:', err);
		return {
			ok: false,
			status: 500,
			body: { ok: false, error: 'Error listing students' },
		};
	}
}

async function createTestStudent() {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] createTestStudent called', { time: new Date().toISOString() });
	try {
		const db = getDb();
		const students = db.collection('students');

		const existing = await students.findOne({ username: '23ITBE112' });
		if (existing) {
			return {
				ok: false,
				status: 400,
				body: { ok: false, error: 'Test student already exists' },
			};
		}

		const initialPassword = '23ITBE112';
		const hashed = await hashPassword(initialPassword);
		const testStudent = {
			username: '23ITBE112',
			enrollment_id: '23ITBE112',
			full_name: 'Test Student',
			email: 'test.student@example.com',
			mobile: '9876543210',
			department: 'Computer Science',
			institutional_id: 'test_inst_001',
			faculty_id: null,
			faculty_username: null,
			role: 'student',
			password: hashed,
		};

		await students.insertOne(testStudent);

		const { password: _ignoredPassword, ...sanitized } = testStudent;

		return {
			ok: true,
			status: 201,
			body: {
				ok: true,
				message: 'Test student created successfully',
				data: sanitized,
			},
		};
	} catch (err) {
		console.error('Error creating test student:', err);
		return {
			ok: false,
			status: 500,
			body: { ok: false, error: 'Error creating test student' },
		};
	}
}

async function getStudentProfile(username) {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] getStudentProfile called', { username, time: new Date().toISOString() });
	try {
		const db = getDb();
		const students = db.collection('students');
		const student = await students.findOne(
			{ username },
			{ projection: { _id: 0, password: 0 } }
		);

		if (!student) {
			return {
				ok: false,
				status: 404,
				body: { ok: false, error: 'Student not found' },
			};
		}

		return {
			ok: true,
			status: 200,
			body: { ok: true, data: student },
		};
	} catch (err) {
		console.error('Error fetching student profile:', err);
		return {
			ok: false,
			status: 500,
			body: { ok: false, error: 'Error fetching student profile' },
		};
	}
}

async function updateStudentProfile(username, update) {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] updateStudentProfile called', { username, fields: Object.keys(update || {}), time: new Date().toISOString() });
	try {
		const db = getDb();
		const students = db.collection('students');

		const existing = await students.findOne({ username });
		if (!existing) {
			return {
				ok: false,
				status: 404,
				body: { ok: false, error: 'Student not found' },
			};
		}

		const doc = {};
		if (update.full_name) doc.full_name = String(update.full_name).trim();
		if (update.email !== undefined && update.email !== null)
			doc.email = String(update.email).trim();
		if (update.mobile !== undefined && update.mobile !== null)
			doc.mobile = String(update.mobile).trim();
		if (update.department !== undefined && update.department !== null)
			doc.department = String(update.department).trim();

		if (Object.keys(doc).length === 0) {
			return {
				ok: false,
				status: 400,
				body: { ok: false, error: 'No fields to update' },
			};
		}

		const result = await students.updateOne({ username }, { $set: doc });
		if (result.modifiedCount === 0) {
			return {
				ok: false,
				status: 400,
				body: { ok: false, error: 'No changes made' },
			};
		}

		const updated = await students.findOne(
			{ username },
			{ projection: { _id: 0, password: 0 } }
		);

		return {
			ok: true,
			status: 200,
			body: { ok: true, data: updated },
		};
	} catch (err) {
		console.error('Error updating student profile:', err);
		return {
			ok: false,
			status: 500,
			body: { ok: false, error: 'Error updating student profile' },
		};
	}
}

// === Institution-scoped helpers used by Institutional & Faculty flows ===

async function listStudentsByInstitution(institutionalId) {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] listStudentsByInstitution called', { institutionalId, time: new Date().toISOString() });
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}
	const db = getDb();
	const students = db.collection('students');
	const docs = await students
		.find({ institutional_id: institutionalId }, { projection: { password: 0 } })
		.toArray();
	return docs;
}

async function batchCreateStudents(institutionalId, payload) {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] batchCreateStudents called', { institutionalId, hasCsv: Boolean(payload && payload.csv), rows: Array.isArray(payload && payload.rows) ? payload.rows.length : undefined, time: new Date().toISOString() });
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}

	const rows = Array.isArray(payload.rows) ? payload.rows : null;
	const csvText = payload.csv && String(payload.csv);

	const studentsToCreate = [];
	if (csvText) {
		for (const line of csvText.split(/\r?\n/)) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			const parts = trimmed.split(',').map((p) => p.trim());
			if (parts.length < 5) {
				throw new Error('each CSV line must have 5 columns: name,regno,dept,email,mobile');
			}
			const [name, regno, dept, email, mobile] = parts;
			if (!name || !regno) {
				throw new Error('name and regno are required for each student');
			}
			studentsToCreate.push({
				full_name: name,
				enrollment_id: regno,
				department: dept,
				email,
				mobile,
			});
		}
	} else if (rows) {
		for (const r of rows) {
			const name = String(r.name || '').trim();
			const regno = String(r.regno || '').trim();
			const dept = String(r.dept || '').trim();
			const email = String(r.email || '').trim();
			const mobile = String(r.mobile || '').trim();
			if (!name || !regno) {
				throw new Error('name and regno are required for each student');
			}
			studentsToCreate.push({
				full_name: name,
				enrollment_id: regno,
				department: dept,
				email,
				mobile,
			});
		}
	} else {
		throw new Error('provide either csv or rows for batch creation');
	}

	if (!studentsToCreate.length) {
		throw new Error('no students to create');
	}

	const db = getDb();
	const coll = db.collection('students');

	// Check duplicate enrollment_id within institution
	const regnos = studentsToCreate.map((s) => s.enrollment_id);
	const existing = await coll
		.find({ institutional_id: institutionalId, enrollment_id: { $in: regnos } }, { projection: { enrollment_id: 1 } })
		.toArray();
	if (existing.length) {
		const dup = existing.map((e) => e.enrollment_id).join(', ');
		throw new Error(`duplicate regno/enrollment_id: ${dup}`);
	}

	const facultyId = payload.faculty_id && String(payload.faculty_id).trim();
	const facultyUsername = payload.faculty_username && String(payload.faculty_username).trim();

	const docs = studentsToCreate.map((s) => ({
		...s,
		username: s.enrollment_id,
		role: 'student',
		// For bulk-created students, use enrollment_id as the
		// original password but store it hashed so it matches
		// Python's semantics.
		password: null,
		institutional_id: institutionalId,
		faculty_id: facultyId || null,
		faculty_username: facultyUsername || null,
	}));

	// Hash passwords for all docs before insert
	for (const doc of docs) {
		if (!doc.password) {
			// enrollment_id is the initial password
			// eslint-disable-next-line no-await-in-loop
			doc.password = await hashPassword(doc.enrollment_id);
		}
	}

	const res = await coll.insertMany(docs);
	const created = docs.map((doc, idx) => {
		const out = { ...doc, _id: res.insertedIds[idx].toString() };
		delete out.password;
		return out;
	});
	return created;
}

async function updateStudentForInstitution(institutionalId, enrollmentId, payload) {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] updateStudentForInstitution called', { institutionalId, enrollmentId, fields: Object.keys(payload || {}).filter(k=>k!=='password'), hasPassword: Boolean(payload && payload.password), time: new Date().toISOString() });
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}
	if (!enrollmentId) {
		throw new Error('enrollment_id required');
	}

	const updates = {};

	if (payload.enrollment_id !== undefined) {
		const newEnr = String(payload.enrollment_id || '').trim();
		if (!newEnr) {
			updates.enrollment_id = null;
			updates.username = null;
			updates.password = null;
		} else {
			updates.enrollment_id = newEnr;
			updates.username = newEnr;
			updates.password = newEnr;
		}
	}

	for (const key of ['full_name', 'department', 'email', 'mobile', 'faculty_id', 'faculty_username']) {
		if (Object.prototype.hasOwnProperty.call(payload, key)) {
			const val = payload[key];
			updates[key] = val === null ? null : String(val).trim();
		}
	}

	if (!Object.keys(updates).length) {
		throw new Error('no fields to update');
	}

	const db = getDb();
	const coll = db.collection('students');

	// If enrollment_id is changing, ensure uniqueness inside institution
	if (
		updates.enrollment_id &&
		updates.enrollment_id !== enrollmentId
	) {
		const exists = await coll.findOne({
			institutional_id: institutionalId,
			enrollment_id: updates.enrollment_id,
		});
		if (exists) {
			throw new Error('enrollment_id already exists');
		}
	}

	const setOps = {};
	const unsetOps = {};
	for (const [k, v] of Object.entries(updates)) {
		if (v === null) unsetOps[k] = '';
		else setOps[k] = v;
	}

	const updateSpec = {};
	if (Object.keys(setOps).length) updateSpec.$set = setOps;
	if (Object.keys(unsetOps).length) updateSpec.$unset = unsetOps;

	const doc = await coll.findOneAndUpdate(
		{ institutional_id: institutionalId, enrollment_id: enrollmentId },
		updateSpec,
		{ returnDocument: 'after' }
	);
	if (!doc.value) {
		// Diagnostic logging to help understand why update didn't match
		// eslint-disable-next-line no-console
		console.log('[STUDENT] updateStudentForInstitution no match — running diagnostics', { institutionalId, enrollmentId });

		// First try: if enrollment_id was updated, attempt to find the updated document
		try {
			const targetEnrollment = updates.enrollment_id || enrollmentId;
			const maybeUpdated = await coll.findOne({ institutional_id: institutionalId, enrollment_id: targetEnrollment });
			if (maybeUpdated) {
				// eslint-disable-next-line no-console
				console.log('[STUDENT] updateStudentForInstitution: found updated document via secondary lookup', { enrollment_id: targetEnrollment });
				const out = { ...maybeUpdated };
				delete out.password;
				return out;
			}
		} catch (lookupErr) {
			// eslint-disable-next-line no-console
			console.error('[STUDENT] secondary lookup error', lookupErr && lookupErr.stack ? lookupErr.stack : lookupErr);
		}

		try {
			const byEnrollment = await coll.findOne({ enrollment_id: enrollmentId });
			if (!byEnrollment) {
				// eslint-disable-next-line no-console
				console.log('[STUDENT] diagnostic: no student found with that enrollment_id', { enrollment_id: enrollmentId });
			} else if (String(byEnrollment.institutional_id) !== String(institutionalId)) {
				// eslint-disable-next-line no-console
				console.log('[STUDENT] diagnostic: student exists but belongs to a different institution', { enrollment_id: enrollmentId, existing_institutional_id: byEnrollment.institutional_id, requested_institutional_id: institutionalId });
			} else {
				// eslint-disable-next-line no-console
				console.log('[STUDENT] diagnostic: student found but update failed to match for unknown reason', { byEnrollment });
			}
		} catch (diagErr) {
			// eslint-disable-next-line no-console
			console.error('[STUDENT] update diagnostics error', diagErr && diagErr.stack ? diagErr.stack : diagErr);
		}
		throw new Error('student not found');
	}
	const updated = doc.value;
	delete updated.password;
	return updated;
}

async function deleteStudentForInstitution(institutionalId, enrollmentId) {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] deleteStudentForInstitution called', { institutionalId, enrollmentId, time: new Date().toISOString() });
	if (!institutionalId) {
		throw new Error('institutional_id required');
	}
	if (!enrollmentId) {
		throw new Error('enrollment_id required');
	}
	const db = getDb();
	const coll = db.collection('students');
	const res = await coll.deleteOne({ institutional_id: institutionalId, enrollment_id: enrollmentId });
	return res.deletedCount > 0;
}

async function listStudentsForFaculty(facultyId) {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] listStudentsForFaculty called', { facultyId, time: new Date().toISOString() });
	if (!facultyId) {
		throw new Error('faculty_id required');
	}
	const db = getDb();
	const coll = db.collection('students');
	const docs = await coll
		.find({ faculty_id: facultyId }, { projection: { password: 0 } })
		.toArray();
	return docs;
}

// OTP endpoints remain placeholders; they can be wired up later
// to match the Python implementation.

async function sendOtpForCredentials(username, email) {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] sendOtpForCredentials called', { username, email, time: new Date().toISOString() });
	return {
		ok: true,
		status: 200,
		body: {
			ok: true,
			message: `OTP sending for ${username} (${email}) not yet implemented in Node backend`,
		},
	};
}

async function verifyOtp(username, otp) {
	// eslint-disable-next-line no-console
	console.log('[STUDENT] verifyOtp called', { username, hasOtp: Boolean(otp), time: new Date().toISOString() });
	return {
		ok: false,
		status: 400,
		body: { ok: false, error: 'OTP verification not implemented in Node backend yet' },
	};
}

module.exports = {
	listAllStudents,
	createTestStudent,
	getStudentProfile,
	updateStudentProfile,
	listStudentsByInstitution,
	batchCreateStudents,
	updateStudentForInstitution,
	deleteStudentForInstitution,
	listStudentsForFaculty,
	sendOtpForCredentials,
	verifyOtp,
};
