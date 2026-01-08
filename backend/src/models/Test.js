const mongoose = require('mongoose');

const EmbeddedQuestionSchema = new mongoose.Schema({
  questionId: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Question' },
  text: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
});

const TestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['aptitude', 'technical', 'psycometric'], required: true },
  assignedFaculty: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Faculty' },
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' },
  questions: { type: [EmbeddedQuestionSchema], default: [] },
  durationMinutes: { type: Number, default: 30 },
  startTime: { type: Date },
  endTime: { type: Date },
  assignedBatches: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Batch' }],
  assignedStudents: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Test || mongoose.model('Test', TestSchema);
