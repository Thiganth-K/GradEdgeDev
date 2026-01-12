const mongoose = require('mongoose');

const AdminInstitutionChatSchema = new mongoose.Schema({
  institution: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution', required: true },
  fromRole: { type: String, enum: ['institution', 'admin', 'faculty', 'student', 'contributor'], required: true },
  fromRef: { type: require('mongoose').Schema.Types.ObjectId, required: true },
  toRole: { type: String, enum: ['institution', 'admin', 'faculty', 'student', 'contributor'], required: true },
  toRef: { type: require('mongoose').Schema.Types.ObjectId },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.AdminInstitutionChat || mongoose.model('AdminInstitutionChat', AdminInstitutionChatSchema);
