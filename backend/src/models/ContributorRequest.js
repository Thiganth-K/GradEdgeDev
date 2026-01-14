const mongoose = require('mongoose');

const QuestionRequestSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['aptitude', 'technical', 'psychometric'], 
    required: true 
  },
  count: { 
    type: Number, 
    required: true,
    min: 1
  }
});

const DraftedQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ 
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false } // Support for multiple correct answers
  }],
  correctIndex: { type: Number }, // Legacy support
  // Each drafted question is linked to a request topic; category comes from the parent questionRequest
  topic: { type: String, required: true },
  // New field: subtopic for organizing questions
  subtopic: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ['easy', 'medium', 'hard'], 
    required: true 
  },
  tags: [{ type: String }],
  details: { type: String }
});

const ContributorRequestSchema = new mongoose.Schema({
  contributorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Contributor', 
    required: true 
  },
  contributorName: { 
    type: String, 
    required: true 
  },
  questionRequests: { 
    type: [QuestionRequestSchema], 
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  },
  draftedQuestions: {
    type: [DraftedQuestionSchema],
    default: []
  },
  rejectionReason: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'rejected'], 
    default: 'pending' 
  },
  notes: { type: String },
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin' 
  },
  reviewedAt: { type: Date }
});

// Update the updatedAt timestamp before saving
ContributorRequestSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.ContributorRequest || mongoose.model('ContributorRequest', ContributorRequestSchema);
