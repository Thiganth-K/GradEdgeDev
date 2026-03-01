const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

// Load root .env first
dotenv.config();
// If no Mongo URI found and backend/.env exists, load that too
if (!process.env.MONGO_URI && !process.env.MONGODB_URI && !process.env.DATABASE_URL) {
  const backendEnv = path.join(__dirname, '..', '.env');
  if (fs.existsSync(backendEnv)) {
    dotenv.config({ path: backendEnv });
  }
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/gradedge';

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    // require the model after connecting to avoid potential model re-compilation warnings
    const Question = require(path.join(__dirname, '..', 'src', 'models', 'Question'));

    const res = await Question.deleteMany({});
    const deleted = typeof res.deletedCount === 'number' ? res.deletedCount : (res.result && res.result.n) || 0;
    console.log(`[clearQuestionCollection] Deleted ${deleted} documents from the Question collection.`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('[clearQuestionCollection] Error:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

run();
