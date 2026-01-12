const mongoose = require('mongoose');
const path = require('path');

// load env from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Models to wipe
const Admin = require('../models/Admin');
const Institution = require('../models/Institution');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Batch = require('../models/Batch');
const Question = require('../models/Question');
const Test = require('../models/Test');
const TestAttempt = require('../models/TestAttempt');

async function confirmPrompt() {
  const argv = process.argv.slice(2);
  // safety: require --yes or CONFIRM_KILL=YES environment variable (case-insensitive)
  const yesFlag = argv.includes('--yes') || argv.includes('-y');
  const envConfirm = (process.env.CONFIRM_KILL || '').toLowerCase();
  if (yesFlag || envConfirm === 'yes' || envConfirm === 'y' || envConfirm === 'true') return true;
  console.error('\nREFUSING TO RUN: This will DELETE ALL data in the application DB.');
  console.error('If you really want to proceed, re-run with `node killer.js --yes` or set CONFIRM_KILL=YES in backend/.env');
  return false;
}

async function main() {
  const ok = await confirmPrompt();
  if (!ok) process.exit(1);

  const mongoUri = (process.env.MONGO_URI || '').trim();
  if (!mongoUri) {
    console.error('MONGO_URI not set in backend/.env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected. Proceeding to delete data...');

  try {
    const ops = [
      { name: 'TestAttempt', model: TestAttempt },
      { name: 'Test', model: Test },
      { name: 'Question', model: Question },
      { name: 'Batch', model: Batch },
      { name: 'Student', model: Student },
      { name: 'Faculty', model: Faculty },
      { name: 'Institution', model: Institution },
      { name: 'Admin', model: Admin },
    ];

    for (const op of ops) {
      try {
        const res = await op.model.deleteMany({});
        console.log(`Deleted ${res.deletedCount || 0} documents from ${op.name}`);
      } catch (err) {
        console.error(`Failed to clear ${op.name}:`, err.message || err);
      }
    }

    // optional: drop collections (best-effort)
    const collectionNames = ['testattempts','tests','questions','batches','students','faculties','institutions','admins'];
    for (const cname of collectionNames) {
      try {
        if (mongoose.connection.collections[cname]) {
          await mongoose.connection.collections[cname].drop();
          console.log(`Dropped collection ${cname}`);
        }
      } catch (err) {
        // ignore "ns not found" and others
      }
    }

    console.log('Wipe complete. Disconnecting.');
  } catch (err) {
    console.error('Fatal error during wipe:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
