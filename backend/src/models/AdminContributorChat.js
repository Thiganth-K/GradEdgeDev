const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  senderRole: { 
    type: String, 
    enum: ['admin', 'contributor'], 
    required: true 
  },
  senderId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'messages.senderModel'
  },
  senderModel: {
    type: String,
    enum: ['Admin', 'Contributor'],
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

const AdminContributorChatSchema = new mongoose.Schema({
  contributorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Contributor', 
    required: true 
  },
  contributorName: { 
    type: String, 
    required: true 
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
  unreadCountContributor: { 
    type: Number, 
    default: 0 
  }
});

// Update lastMessageAt when messages are added
AdminContributorChatSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
  }
  next();
});

module.exports = mongoose.models.AdminContributorChat || mongoose.model('AdminContributorChat', AdminContributorChatSchema);
