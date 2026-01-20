const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderRole: {
    type: String,
    enum: ['admin', 'superadmin'],
    required: true
  },
  senderId: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  senderModel: {
    type: String,
    enum: ['Admin', 'SuperAdmin'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  read: {
    type: Boolean,
    default: false
  }
});

const SuperadminAdminChatSchema = new mongoose.Schema({
  superadminName: {
    type: String
  },
  superadminId: {
    type: String
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  adminName: {
    type: String
  },
  messages: {
    type: [MessageSchema],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  unreadCountAdmin: {
    type: Number,
    default: 0
  },
  unreadCountSuperadmin: {
    type: Number,
    default: 0
  }
});

SuperadminAdminChatSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }
  next();
});

module.exports = mongoose.models.SuperadminAdminChat || mongoose.model('SuperadminAdminChat', SuperadminAdminChatSchema);
