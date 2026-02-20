#!/usr/bin/env node
'use strict';

const mongoose = require('mongoose');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/gradedge';
if (!process.env.MONGO_URI) {
  console.warn('Warning: MONGO_URI not found in .env; using fallback:', MONGO_URI);
}
const CONFIRM_FLAG = '--yes';

async function main() {
  if (!process.argv.includes(CONFIRM_FLAG)) {
    console.log('This will DELETE ALL ContributorQuestion documents.');
    console.log('To proceed, run: node backend/scripts/kill_contributor_questions.js --yes');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');

  // require model file so schemas and Counter model are registered on mongoose
  const ContributorQuestion = require('../models/ContributorQuestion');

  try {
    const res = await ContributorQuestion.deleteMany({});
    const deleted = (res && (res.deletedCount ?? res.n)) || 0;
    console.log(`Deleted ${deleted} ContributorQuestion documents.`);

    // Reset the counter used by the model (if present)
    try {
      const Counter = mongoose.model('Counter');
      await Counter.findByIdAndUpdate('contributorQuestionSeq', { seq: 0 }, { upsert: true }).exec();
      console.log('Reset contributorQuestionSeq counter to 0.');
    } catch (err) {
      console.warn('Counter model not available or reset failed:', err.message);
    }
  } catch (err) {
    console.error('Error deleting ContributorQuestion documents:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
