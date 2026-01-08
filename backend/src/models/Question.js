const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  // For library questions, we store the correct index in the parent
});

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: { type: [OptionSchema], validate: v => Array.isArray(v) && v.length >= 2 },
  correctIndex: { type: Number, required: true },
  category: { type: String, enum: ['aptitude', 'technical', 'psycometric'], required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [{ type: String }],
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
