const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  // For library questions, we store the correct index in the parent
});

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: { type: [OptionSchema], validate: v => Array.isArray(v) && v.length >= 2 },
  correctIndex: { type: Number, required: true },
  category: { type: String, enum: ['aptitude', 'technical', 'psychometric'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [{ type: String }],
  // creator can be an Institution or a Contributor; contributor contributions stored in `createdByContributor`
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' },
  createdByContributor: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Contributor' },
  // optional free-form details/explanation for the question
  details: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
