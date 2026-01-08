const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  questionId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Question' },
  selectedIndex: { type: Number, required: true },
  correct: { type: Boolean, required: true },
});

const TestAttemptSchema = new mongoose.Schema({
  testId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Test', required: true },
  studentId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Student', required: true },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  timeTakenSeconds: { type: Number },
  responses: { type: [ResponseSchema], default: [] },
  correctCount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  score: { type: Number, default: 0 },
});

TestAttemptSchema.index({ testId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.models.TestAttempt || mongoose.model('TestAttempt', TestAttemptSchema);
