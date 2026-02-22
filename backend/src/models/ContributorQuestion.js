const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String },
  imageUrl: { type: String },
  imageUrls: { type: [String], default: [] },
  imagePublicId: { type: String },
  imagePublicIds: { type: [String], default: [] },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const SolutionSchema = new mongoose.Schema({
  explanation: { type: String },
  imageUrl: { type: String },
  imagePublicId: { type: String },
  imageUrls: { type: [String], default: [] },
  imagePublicIds: { type: [String], default: [] }
}, { _id: false });

const ContributorQuestionSchema = new mongoose.Schema({
  // track which contributor posted the question
  contributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },
  // keep legacy `contributor` field for backward compatibility
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },
  // status for review workflow
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  // question type: 'mcq' = standard multiple choice, 'placement' = placement readiness question
  questionType: { type: String, enum: ['mcq', 'placement'], default: 'mcq' },
  subTopic: { type: String, required: true, trim: true },
  difficulty: { type: String, required: true, trim: true },
  question: { type: String, required: true },
  questionImageUrl: { type: String },
  questionImagePublicId: { type: String },
  // support multiple question images while keeping single-field names
  questionImageUrls: { type: [String], default: [] },
  questionImagePublicIds: { type: [String], default: [] },
  options: { type: [OptionSchema], default: [] },
  solutions: { type: [SolutionSchema], default: [] }
}, { timestamps: true });

// legacy resequencing and numeric question ids removed to avoid coupling

module.exports = mongoose.model('ContributorQuestion', ContributorQuestionSchema);
