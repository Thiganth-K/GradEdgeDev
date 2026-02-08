const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const SolutionSchema = new mongoose.Schema({
  text: { type: String },
  imageUrl: { type: String },
  imagePublicId: { type: String }
}, { _id: false });

const ContributorQuestionSchema = new mongoose.Schema({
  subject: { type: String, required: true, trim: true },
  questionType: { type: String, required: true, trim: true },
  questionNumber: { type: Number },
  questionText: { type: String, required: true },
  imageUrl: { type: String },
  imagePublicId: { type: String },
  options: { type: [OptionSchema], default: [] },
  metadata: {
    difficulty: { type: String },
    bloomTaxonomy: { type: String }
  },
  tags: { type: [String], default: [] },
  topic: { type: String },
  subTopic: { type: String },
  codeEditor: { type: Boolean, default: false },
  solutions: { type: [SolutionSchema], default: [] },
  hints: { type: [String], default: [] },
  courseOutcome: { type: String },
  programOutcome: { type: String },
  contributor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },
}, { timestamps: true });

module.exports = mongoose.model('ContributorQuestion', ContributorQuestionSchema);
