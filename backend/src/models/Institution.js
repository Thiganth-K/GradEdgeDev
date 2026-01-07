const mongoose = require('mongoose');

const InstitutionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  institutionId: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  location: { type: String },
  contactNo: { type: String },
  email: { type: String },
  // reference to the admin who created this institution
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Admin' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Institution || mongoose.model('Institution', InstitutionSchema);
