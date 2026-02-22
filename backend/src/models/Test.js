const mongoose = require('mongoose');

// Schema for Custom Questions (embedded, test-specific, NOT in library)
const CustomQuestionSchema = new mongoose.Schema({
  text: { type: String, default: '' },
  options: [{ type: String }],
  correctIndex: { type: Number },
  correctIndices: [{ type: Number }],
  isCoding: { type: Boolean, default: false },
  starterCode: { type: String },
  testCases: [{
    input: { type: String, default: '' },
    output: { type: String, default: '' },
    isHidden: { type: Boolean, default: false }
  }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium', set: v => (v ? v.toLowerCase() : 'medium') },
  createdAt: { type: Date, default: Date.now },
});

// Option schema to match Question model structure
const OptionSchema = new mongoose.Schema({
  text: { type: String, default: '' }
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
  type: { type: String, enum: ['aptitude', 'technical', 'psychometric', 'coding'], required: true },
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
  // 'institution' = created by institution admin, 'faculty' = created by faculty member
  creatorRole: { type: String, enum: ['institution', 'faculty'], default: 'institution' },
  createdAt: { type: Date, default: Date.now },
});

// Helper method to get all questions (library + custom + legacy fallback) in unified format
TestSchema.methods.getAllQuestions = async function() {
  await this.populate('libraryQuestionIds');

  const libraryQuestions = (this.libraryQuestionIds || []).map(q => {
    const correctAnswers = q.getCorrectAnswers ? q.getCorrectAnswers() :
      (Array.isArray(q.correctIndices) && q.correctIndices.length > 0 ? q.correctIndices :
        (typeof q.correctIndex === 'number' ? [q.correctIndex] : []));
    return {
      _id: q._id,
      text: q.text,
      options: q.options.map(o => o.text || o),
      correctIndex: correctAnswers[0],
      correctIndices: correctAnswers,
      difficulty: q.difficulty,
      source: 'library',
      questionId: q._id,
      isCoding: q.isCoding,
      starterCode: q.starterCode,
      testCases: q.testCases
    };
  });

  const customQs = (this.customQuestions || []).map(q => {
    const correctAnswers = Array.isArray(q.correctIndices) && q.correctIndices.length > 0
      ? q.correctIndices
      : (typeof q.correctIndex === 'number' ? [q.correctIndex] : []);
    return {
      _id: q._id,
      text: q.text,
      options: q.options,
      correctIndex: correctAnswers[0],
      correctIndices: correctAnswers,
      difficulty: q.difficulty,
      source: 'custom',
      isCoding: q.isCoding,
      starterCode: q.starterCode,
      testCases: q.testCases
    };
  });

  const combined = [...libraryQuestions, ...customQs];

  // Fall back to legacy embedded questions if the new fields are both empty
  if (combined.length === 0 && Array.isArray(this.questions) && this.questions.length > 0) {
    return this.questions.map(q => ({
      _id: q._id,
      text: q.text,
      options: Array.isArray(q.options) ? q.options.map(o => (typeof o === 'string' ? o : (o && o.text) || '')) : [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : undefined,
      correctIndices: Array.isArray(q.correctIndices) && q.correctIndices.length > 0 ? q.correctIndices
        : (typeof q.correctIndex === 'number' ? [q.correctIndex] : []),
      source: 'legacy',
      isCoding: false,
    }));
  }

  return combined;
};

module.exports = mongoose.models.Test || mongoose.model('Test', TestSchema);
