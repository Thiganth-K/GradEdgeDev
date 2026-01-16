const mongoose = require('mongoose');

const InstitutionAnnouncementSchema = new mongoose.Schema({
  message: { type: String, required: true },
  institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
  // Targets for students
  targetStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  targetBatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Batch' }],
  // Optional metadata for auditing
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.InstitutionAnnouncement || mongoose.model('InstitutionAnnouncement', InstitutionAnnouncementSchema);
