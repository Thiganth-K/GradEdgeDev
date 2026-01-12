const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  institution: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution', required: true },
  fromRole: { type: String, enum: ['institution', 'admin', 'faculty', 'student', 'contributor'], required: true },
  fromRef: { type: require('mongoose').Schema.Types.ObjectId, required: true },
  toRole: { type: String, enum: ['institution', 'admin', 'faculty', 'student', 'contributor'], required: true },
  toRef: { type: require('mongoose').Schema.Types.ObjectId, required: false, default: null },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  readByAdmin: { type: Boolean, default: false },
  readByInstitution: { type: Boolean, default: false },
});

module.exports = mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
