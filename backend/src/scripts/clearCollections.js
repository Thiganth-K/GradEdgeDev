const dotenv = require('dotenv');
const fs = require('fs');
const mongoose = require('mongoose');
const path = require('path');

// Load root .env then backend/.env if present
dotenv.config();
const backendEnv = path.join(__dirname, '..', '.env');
if (!process.env.MONGO_URI && !process.env.MONGODB_URI && !process.env.DATABASE_URL) {
  if (fs.existsSync(backendEnv)) dotenv.config({ path: backendEnv });
}

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/gradedge';

// Default models to clear; can be overridden via CLI args
const DEFAULT_MODELS = ['ContributorQuestion', 'CodingContributor', 'Library', 'ContributorRequest'];
const modelsToClear = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_MODELS;

async function run() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const results = [];

    for (const modelName of modelsToClear) {
      try {
        const modelPath = path.join(__dirname, '..', 'src', 'models', modelName);
        const Model = require(modelPath);
        const res = await Model.deleteMany({});
        const deleted = typeof res.deletedCount === 'number' ? res.deletedCount : (res.result && res.result.n) || 0;
        console.log(`[clearCollections] ${modelName}: deleted ${deleted}`);
        results.push({ model: modelName, deleted });
      } catch (err) {
        console.error(`[clearCollections] ${modelName}: error loading or deleting -`, err && err.message ? err.message : err);
        results.push({ model: modelName, error: err && err.message ? err.message : String(err) });
      }
    }

    await mongoose.disconnect();
    // summary
    console.log('[clearCollections] Summary:', results);
    process.exit(0);
  } catch (err) {
    console.error('[clearCollections] Fatal error:', err && err.message ? err.message : err);
    try { await mongoose.disconnect(); } catch (_) {}
    process.exit(1);
  }
}

run();
