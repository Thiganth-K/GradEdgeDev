/**
 * One-time script: drops the stale `questionNumber_1` unique index from the
 * `contributorquestions` collection.  The field was removed from the schema
 * but the index was never cleaned up, causing E11000 duplicate-key errors
 * when inserting new contributor questions.
 *
 * Usage:
 *   node src/scripts/dropQuestionNumberIndex.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
  console.error('No MONGO_URI / MONGODB_URI found in environment. Check your .env file.');
  process.exit(1);
}

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    const collection = mongoose.connection.collection('contributorquestions');

    // List current indexes for visibility
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));

    const targetIndex = 'questionNumber_1';
    const exists = indexes.some(i => i.name === targetIndex);

    if (!exists) {
      console.log(`Index "${targetIndex}" not found – nothing to do.`);
    } else {
      await collection.dropIndex(targetIndex);
      console.log(`Index "${targetIndex}" dropped successfully.`);
    }

    await mongoose.disconnect();
    console.log('Done.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
