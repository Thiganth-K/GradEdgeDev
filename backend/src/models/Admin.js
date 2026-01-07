const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  // Maximum number of institutions this admin may create
  institutionLimit: { type: Number, default: 10 },
});

module.exports = mongoose.model('Admin', AdminSchema);
