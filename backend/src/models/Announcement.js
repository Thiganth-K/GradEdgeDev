const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  message: { type: String, required: true },
  // who created this announcement (flexible)
  createdByRef: { type: require('mongoose').Schema.Types.ObjectId },
  createdByRole: { type: String, enum: ['admin', 'institution'], default: 'admin' },
  // institution-level targets (used for admin -> institution announcements and for listing by institutions)
  targetInstitutions: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' }],
  // more granular targets for institution-created announcements
  targetFaculty: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Faculty' }],
  targetStudents: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Student' }],
  targetBatches: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Batch' }],
  // institutions that have marked this announcement read
  readBy: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);
