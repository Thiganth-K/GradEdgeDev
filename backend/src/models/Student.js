const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  email: { type: String },
  dept: { type: String },
  regno: { type: String },
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Student || mongoose.model('Student', StudentSchema);
