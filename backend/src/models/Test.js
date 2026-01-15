const mongoose = require('mongoose');

// Schema for Custom Questions (embedded, test-specific, NOT in library)
const CustomQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number },
  correctIndices: [{ type: Number }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
});

// Option schema to match Question model structure
const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true }
});

// Legacy schema for backward compatibility
const EmbeddedQuestionSchema = new mongoose.Schema({
  questionId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Question' },
  text: { type: String },
  options: [OptionSchema], // Changed to support both {text: "..."} and string formats
  correctIndex: { type: Number },
  correctIndices: [{ type: Number }],
});

const TestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['aptitude', 'technical', 'psychometric'], required: true },
  assignedFaculty: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Faculty' },
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' },
  
  // NEW: Clear separation of question types
  // Library Questions: referenced by ID, changes affect master question
  libraryQuestionIds: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Question' }],
  
  // Custom Questions: embedded, test-specific, never added to library
  customQuestions: { type: [CustomQuestionSchema], default: [] },
  
  // LEGACY: Old mixed questions field (keep for backward compatibility)
  questions: { type: [EmbeddedQuestionSchema], default: [] },
  
  durationMinutes: { type: Number, default: 30 },
  startTime: { type: Date },
  endTime: { type: Date },
  assignedBatches: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Batch' }],
  assignedStudents: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now },
});

// Helper method to get all questions (library + custom) in unified format
TestSchema.methods.getAllQuestions = async function() {
  await this.populate('libraryQuestionIds');
  
  const libraryQuestions = (this.libraryQuestionIds || []).map(q => {
    // Get correct answers - support both single and multiple
    const correctAnswers = q.getCorrectAnswers ? q.getCorrectAnswers() :
      (Array.isArray(q.correctIndices) && q.correctIndices.length > 0 ? q.correctIndices : 
        (typeof q.correctIndex === 'number' ? [q.correctIndex] : []));
    
    return {
      _id: q._id,
      text: q.text,
      options: q.options.map(o => o.text || o),
      correctIndex: correctAnswers[0], // First correct answer for backward compatibility
      correctIndices: correctAnswers, // All correct answers for multiple choice support
      difficulty: q.difficulty,
      source: 'library',
      questionId: q._id
    };
  });
  
  const customQs = (this.customQuestions || []).map(q => {
    // Get correct answers - support both single and multiple
    const correctAnswers = Array.isArray(q.correctIndices) && q.correctIndices.length > 0 
      ? q.correctIndices 
      : (typeof q.correctIndex === 'number' ? [q.correctIndex] : []);
    
    return {
      _id: q._id,
      text: q.text,
      options: q.options,
      correctIndex: correctAnswers[0], // First correct answer for backward compatibility
      correctIndices: correctAnswers, // All correct answers for multiple choice support
      difficulty: q.difficulty,
      source: 'custom'
    };
  });
  
  return [...libraryQuestions, ...customQs];
};

module.exports = mongoose.models.Test || mongoose.model('Test', TestSchema);
