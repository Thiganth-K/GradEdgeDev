const mongoose = require('mongoose');

const CustomQuestionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number },
  correctIndices: [{ type: Number }],
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdAt: { type: Date, default: Date.now },
});

const OptionSchema = new mongoose.Schema({
  text: { type: String, required: true }
});

const EmbeddedQuestionSchema = new mongoose.Schema({
  questionId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Question' },
  text: { type: String },
  options: [OptionSchema],
  correctIndex: { type: Number },
  correctIndices: [{ type: Number }],
});

const FacultyTestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['aptitude', 'technical', 'psychometric'], required: true },
  assignedFaculty: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Faculty' },
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Faculty' },
  
  // Flag to indicate if test is created by institution (for badge display)
  isInstitutionGraded: { type: Boolean, default: false },
  
  // Flag to indicate if test is created by faculty (for badge display)
  isFacultyGraded: { type: Boolean, default: false },
  
  libraryQuestionIds: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Question' }],
  customQuestions: { type: [CustomQuestionSchema], default: [] },
  questions: { type: [EmbeddedQuestionSchema], default: [] },
  durationMinutes: { type: Number, default: 30 },
  startTime: { type: Date },
  endTime: { type: Date },
  assignedBatches: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Batch' }],
  assignedStudents: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Student' }],
  linkedTestId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Test' },
  createdAt: { type: Date, default: Date.now },
});

FacultyTestSchema.methods.getAllQuestions = async function() {
  await this.populate('libraryQuestionIds');
  const libraryQuestions = (this.libraryQuestionIds || []).map(q => {
    const correctAnswers = Array.isArray(q.correctIndices) && q.correctIndices.length > 0
      ? q.correctIndices
      : (typeof q.correctIndex === 'number' ? [q.correctIndex] : []);
    return {
      _id: q._id,
      text: q.text,
      options: q.options.map(o => o.text || o),
      correctIndex: correctAnswers[0],
      correctIndices: correctAnswers,
      difficulty: q.difficulty,
      source: 'library',
      questionId: q._id
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
      source: 'custom'
    };
  });
  return [...libraryQuestions, ...customQs];
};

module.exports = mongoose.models.FacultyTest || mongoose.model('FacultyTest', FacultyTestSchema);
