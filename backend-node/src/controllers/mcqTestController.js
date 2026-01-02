// MCQ Test controller
// Supports creating tests by institutional_id with generated questions,
// assigning faculty and students, and student submissions with scoring.

const { getDb } = require('../config/db');

const COLLECTION = 'mcq_tests';

function generateQuestions(type) {
  const t = String(type || '').toLowerCase();
  if (t === 'aptitude') {
    return [
      { q: 'If a train travels 60 km in 1 hour, how long to travel 150 km?', options: ['1.5 hours', '2 hours', '2.5 hours', '3 hours'], correctIndex: 3 },
      { q: 'Find the next number: 2, 6, 12, 20, __', options: ['24', '28', '30', '32'], correctIndex: 1 },
      { q: 'A shop gives 20% discount on a 500 item. Final price?', options: ['400', '450', '480', '420'], correctIndex: 0 },
      { q: 'Ratio of 3:4 equals what fraction?', options: ['3/7', '4/7', '3/4', '4/3'], correctIndex: 2 },
      { q: 'If x + 3 = 10, x = ?', options: ['5', '6', '7', '8'], correctIndex: 1 },
    ];
  }
  if (t === 'technical') {
    return [
      { q: 'Which data structure uses FIFO?', options: ['Stack', 'Queue', 'Tree', 'Graph'], correctIndex: 1 },
      { q: 'Time complexity of binary search?', options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'], correctIndex: 1 },
      { q: 'HTTP status 200 means?', options: ['Created', 'OK', 'No Content', 'Bad Request'], correctIndex: 1 },
      { q: 'Which SQL joins two tables by matching rows?', options: ['INNER JOIN', 'GROUP BY', 'UNION', 'ORDER BY'], correctIndex: 0 },
      { q: 'JavaScript const variable can be?', options: ['Reassigned', 'Redeclared', 'Mutated (object properties)', 'Hoisted with value'], correctIndex: 2 },
    ];
  }
  // psychometric (simplified MCQ style)
  return [
    { q: 'You prefer working:', options: ['Alone', 'In small teams', 'In large teams', 'No preference'], correctIndex: 3 },
    { q: 'Under pressure you are:', options: ['Calm', 'Anxious', 'Motivated', 'Distracted'], correctIndex: 2 },
    { q: 'You solve problems by:', options: ['Analysis', 'Intuition', 'Trial and error', 'Asking for help'], correctIndex: 0 },
    { q: 'Your communication style:', options: ['Direct', 'Diplomatic', 'Reserved', 'Expressive'], correctIndex: 1 },
    { q: 'You value most:', options: ['Results', 'Relationships', 'Process', 'Creativity'], correctIndex: 0 },
  ];
}

async function createMcqTest(institutionalId, payload) {
  if (!institutionalId) throw new Error('institutional_id required');
  const type = String(payload && payload.type || '').toLowerCase();
  const title = (payload && payload.title ? String(payload.title).trim() : undefined) || `${type || 'mcq'} test`;
  if (!type || !['aptitude','technical','psychometric'].includes(type)) throw new Error('type must be aptitude|technical|psychometric');

  const db = getDb();
  const coll = db.collection(COLLECTION);
  const questions = generateQuestions(type);
  const doc = {
    institutional_id: institutionalId,
    type,
    title,
    questions, // stored with correctIndex for server-side grading
    assigned_faculty_ids: [],
    assigned_student_ids: [],
    submissions: [], // { student_id, answers: [index], score, attemptedAt }
    createdAt: new Date().toISOString(),
  };
  const res = await coll.insertOne(doc);
  const created = { ...doc, _id: res.insertedId.toString() };

  // Create a matching announcement so students see the test on their noticeboard
  try {
    const announcementsColl = db.collection('announcements');
    const ann = {
      institutional_id: institutionalId,
      title: `New ${type} test: ${title}`,
      description: `A new ${type} MCQ test is available. Click to take the test.`,
      category: 'Test',
      type: 'mcq_test',
      test_id: res.insertedId.toString(),
      target_batch_codes: Array.isArray(payload.batch_codes) ? payload.batch_codes.map(String) : [],
      createdAt: new Date().toISOString(),
    };
    console.log('[mcq] creating announcement', { institutionalId, annPreview: { title: ann.title, target_batch_codes: ann.target_batch_codes, test_id: ann.test_id } });
    await announcementsColl.insertOne(ann);
    console.log('[mcq] announcement created for test', res.insertedId.toString());
  } catch (err) {
    console.error('[mcq] failed to create announcement for test', err && err.stack ? err.stack : err);
  }

  return created;
}

async function listTestsByInstitution(institutionalId) {
  const db = getDb();
  const coll = db.collection(COLLECTION);
  const docs = await coll.find({ institutional_id: institutionalId }, { projection: { submissions: 0 } }).toArray();
  return docs.map(d => ({ ...d, _id: d._id.toString() }));
}

async function assignParticipants(institutionalId, testId, payload) {
  const db = getDb();
  const coll = db.collection(COLLECTION);
  const facultyIds = Array.isArray(payload && payload.faculty_ids) ? payload.faculty_ids.map(String) : [];
  const studentIds = Array.isArray(payload && payload.student_ids) ? payload.student_ids.map(String) : [];
  const batchCodes = Array.isArray(payload && payload.batch_codes) ? payload.batch_codes.map(String) : [];

  // If batchCodes provided, resolve to student IDs from batches collection
  let studentsFromBatches = [];
  if (batchCodes.length > 0) {
    const batchesColl = db.collection('batches');
    const found = await batchesColl
      .find({ institutional_id: institutionalId, batch_code: { $in: batchCodes } })
      .project({ students: 1 })
      .toArray();
    for (const b of found) {
      if (Array.isArray(b.students)) studentsFromBatches.push(...b.students.map(String));
    }
  }

  // Merge student ids (explicit + from batches) and dedupe
  const allStudentIds = Array.from(new Set([...studentIds.map(String), ...studentsFromBatches]));

  const update = { $addToSet: {} };
  if (facultyIds.length) update.$addToSet.assigned_faculty_ids = { $each: facultyIds };
  if (allStudentIds.length) update.$addToSet.assigned_student_ids = { $each: allStudentIds };
  if (batchCodes.length) update.$addToSet.assigned_batch_codes = { $each: batchCodes };

  // If no changes would be applied, return a clear error
  if (!update.$addToSet || Object.keys(update.$addToSet).length === 0) {
    throw new Error('no participants provided')
  }

  const ObjectId = require('mongodb').ObjectId;
  let oid;
  try {
    oid = new ObjectId(testId);
  } catch (e) {
    throw new Error('invalid test id')
  }
  // Ensure test exists and belongs to this institution before updating
  console.log('[mcq] assignParticipants debug - incoming', { testId: String(testId), institutionalId: String(institutionalId) });
  const foundTest = await coll.findOne({ _id: oid });
  console.log('[mcq] assignParticipants debug - foundTest', foundTest ? { _id: (foundTest._id ? String(foundTest._id) : null), institutional_id: foundTest.institutional_id, assigned_faculty_count: (foundTest.assigned_faculty_ids || []).length, assigned_student_count: (foundTest.assigned_student_ids || []).length } : null);
  if (!foundTest) {
    throw new Error('test not found')
  }
  if (String(foundTest.institutional_id) !== String(institutionalId)) {
    throw new Error('test belongs to another institution')
  }

  await coll.findOneAndUpdate(
    { _id: oid },
    update,
    { returnDocument: 'after' }
  );

  // Fetch the updated document to avoid relying on driver-specific returned shape
  const updated = await coll.findOne({ _id: oid });
  const out = { ...updated };
  return {
    _id: out._id.toString(),
    assigned_faculty_ids: out.assigned_faculty_ids || [],
    assigned_student_ids: out.assigned_student_ids || [],
    assigned_batch_codes: out.assigned_batch_codes || [],
  };
}

async function listTestsForFaculty(facultyId) {
  const db = getDb();
  const coll = db.collection(COLLECTION);
  const docs = await coll.find({ assigned_faculty_ids: facultyId }, { projection: { questions: 0 } }).toArray();
  return docs.map(d => ({ ...d, _id: d._id.toString() }));
}

async function listTestsForStudent(studentId) {
  const db = getDb();
  const coll = db.collection(COLLECTION);
  const docs = await coll.find({ assigned_student_ids: studentId }, { projection: { questions: 0 } }).toArray();
  return docs.map(d => ({ ...d, _id: d._id.toString() }));
}

async function getTestForStudent(testId) {
  const db = getDb();
  const coll = db.collection(COLLECTION);
  const doc = await coll.findOne({ _id: new (require('mongodb').ObjectId)(testId) });
  if (!doc) throw new Error('test not found');
  // sanitize: do not send correctIndex
  const questions = (doc.questions || []).map(q => ({ q: q.q, options: q.options }));
  return { _id: doc._id.toString(), title: doc.title, type: doc.type, questions };
}

async function submitTest(studentId, testId, answers) {
  const db = getDb();
  const coll = db.collection(COLLECTION);
  const doc = await coll.findOne({ _id: new (require('mongodb').ObjectId)(testId) });
  if (!doc) throw new Error('test not found');
  const qs = doc.questions || [];
  const normalized = Array.isArray(answers) ? answers.map(a => Number(a)) : [];
  let score = 0;
  for (let i = 0; i < Math.min(qs.length, normalized.length); i++) {
    if (normalized[i] === qs[i].correctIndex) score += 1;
  }
  const submission = { student_id: String(studentId), answers: normalized, score, attemptedAt: new Date().toISOString() };
  await coll.updateOne({ _id: doc._id }, { $push: { submissions: submission } });
  return { score, total: qs.length };
}

async function getResults(testId) {
  const db = getDb();
  const coll = db.collection(COLLECTION);
  const doc = await coll.findOne({ _id: new (require('mongodb').ObjectId)(testId) });
  if (!doc) throw new Error('test not found');
  const submissions = (doc.submissions || []).map(s => ({ student_id: s.student_id, score: s.score, attemptedAt: s.attemptedAt }));
  return { _id: doc._id.toString(), title: doc.title, type: doc.type, submissions };
}

async function deleteMcqTest(institutionalId, testId) {
  if (!institutionalId) throw new Error('institutional_id required');
  const db = getDb();
  const coll = db.collection(COLLECTION);
  const oid = new (require('mongodb').ObjectId)(testId);
  const res = await coll.deleteOne({ _id: oid, institutional_id: institutionalId });
  if (res.deletedCount === 0) {
    // Determine reason: check if test exists at all
    const found = await coll.findOne({ _id: oid });
    if (!found) throw new Error('test not found');
    // If found but institutional mismatch
    if (String(found.institutional_id) !== String(institutionalId)) throw new Error('test belongs to another institution');
    throw new Error('unable to delete test');
  }
  return true;
}

module.exports = {
  createMcqTest,
  listTestsByInstitution,
  assignParticipants,
  listTestsForFaculty,
  listTestsForStudent,
  getTestForStudent,
  submitTest,
  getResults,
  deleteMcqTest,
};
