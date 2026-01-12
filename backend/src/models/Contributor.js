const mongoose = require('mongoose');

const ContributorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  contact: { type: String },
  email: { type: String },
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Contributor || mongoose.model('Contributor', ContributorSchema);
