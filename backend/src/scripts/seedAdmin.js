const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');

// load env from backend/.env
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const Admin = require('../models/Admin');

async function main() {
  const mongoUri = (process.env.MONGO_URI || '').trim();
  if (!mongoUri) {
    console.error('MONGO_URI not set in backend/.env');
    process.exit(1);
  }

  const argv = process.argv.slice(2);
  const username = argv[0] || process.env.SEED_ADMIN_USERNAME;
  const password = argv[1] || process.env.SEED_ADMIN_PASSWORD;

  if (!username || !password) {
    console.error('Usage: node seedAdmin.js <username> <password>');
    process.exit(1);
  }

  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB for seeding');

  try {
    const hash = await bcrypt.hash(password, 10);
    const res = await Admin.findOneAndUpdate(
      { username },
      { $set: { passwordHash: hash } },
      { upsert: true, new: true }
    );
    console.log('Upserted admin:', res._id.toString(), res.username);
  } catch (err) {
    console.error('Error seeding admin:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

main();
