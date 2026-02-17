const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, default: false } // Support for multiple correct answers
});

const QuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: { type: [OptionSchema] }, // Validation moved to schema path validator below
  // Legacy field for backward compatibility - keep for single-answer questions
  correctIndex: { type: Number },
  // NEW: Multiple correct answers support
  correctIndices: [{ type: Number }],
  // New field: multiple correct answers support via isCorrect in options
  // If correctIndex is present, it takes precedence for backward compatibility
  category: { type: String, enum: ['aptitude', 'technical', 'psychometric', 'coding'], required: true },
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
  
  // CODING QUESTION FIELDS
  isCoding: { type: Boolean, default: false }, // If true, it's a coding question
  testCases: [{
    input: { type: String, default: '' },
    output: { type: String, default: '' },
    isHidden: { type: Boolean, default: false }
  }],
  starterCode: { type: String },
  
  createdAt: { type: Date, default: Date.now },
});

// Remove the array length validation from the schema definition
// and move it to a pre-validate hook or custom validator that checks isCoding
/*
  options: { 
    type: [OptionSchema], 
    validate: {
      validator: function(v) {
        if (this.isCoding) return true; // Coding questions don't need options
        return Array.isArray(v) && v.length >= 2;
      },
      message: 'Non-coding questions must have at least 2 options'
    }
  },
*/
// Modifying the options field in place:
QuestionSchema.path('options').validate(function(v) {
  if (this.isCoding) return true;
  return Array.isArray(v) && v.length >= 2;
}, 'Non-coding questions must have at least 2 options');

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
  // Priority 1: Check correctIndices array
  if (Array.isArray(this.correctIndices) && this.correctIndices.length > 0) {
    return this.correctIndices;
  }
  
  // Priority 2: For backward compatibility, check correctIndex
  if (this.correctIndex !== undefined && this.correctIndex !== null) {
    return [this.correctIndex];
  }
  
  // Priority 3: Return all options marked as correct
  const correctIndices = [];
  this.options.forEach((option, index) => {
    if (option.isCorrect) {
      correctIndices.push(index);
    }
  });
  return correctIndices;
};

module.exports = mongoose.models.Question || mongoose.model('Question', QuestionSchema);
