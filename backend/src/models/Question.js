const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false } // Support for multiple correct answers
});

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: { type: [OptionSchema], validate: v => Array.isArray(v) && v.length >= 2 },
  // Legacy field for backward compatibility - keep for single-answer questions
  correctIndex: { type: Number },
  // New field: multiple correct answers support via isCorrect in options
  // If correctIndex is present, it takes precedence for backward compatibility
  category: { type: String, enum: ['aptitude', 'technical', 'psychometric'], required: true },
  // New field: subtopic for organizing questions within main categories
  subtopic: { type: String, required: true },
  // Main topic derived from category (Aptitude, Technical, Psychometric)
  // Maps: aptitude -> Aptitude, technical -> Technical, psychometric -> Psychometric
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  tags: [{ type: String }],
  // creator can be an Institution or a Contributor; contributor contributions stored in `createdByContributor`
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' },
  createdByContributor: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Contributor' },
  // optional free-form details/explanation for the question
  details: { type: String },
  // Flag to indicate if question is in library
  inLibrary: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Helper method to get main topic from category
QuestionSchema.methods.getMainTopic = function() {
  const topicMap = {
    'aptitude': 'Aptitude',
    'technical': 'Technical',
    'psychometric': 'Psychometric'
  };
  return topicMap[this.category] || 'Aptitude';
};

// Helper method to get all correct answers
QuestionSchema.methods.getCorrectAnswers = function() {
  // For backward compatibility, check correctIndex first
  if (this.correctIndex !== undefined && this.correctIndex !== null) {
    return [this.correctIndex];
  }
  
  // Otherwise, return all options marked as correct
  const correctIndices = [];
  this.options.forEach((option, index) => {
    if (option.isCorrect) {
      correctIndices.push(index);
    }
  });
  return correctIndices;
};

module.exports = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
