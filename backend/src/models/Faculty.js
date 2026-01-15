const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['aptitude', 'technical', 'psychometric'], required: true },
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Faculty || mongoose.model('Faculty', FacultySchema);
