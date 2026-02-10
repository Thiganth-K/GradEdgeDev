const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String },
  imageUrl: { type: String },
  imagePublicId: { type: String },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const SolutionSchema = new mongoose.Schema({
  explanation: { type: String },
  imageUrl: { type: String },
  imagePublicId: { type: String },
  imageUrls: { type: [String], default: [] },
  imagePublicIds: { type: [String], default: [] }
}, { _id: false });

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

const Counter = mongoose.model('Counter', CounterSchema);

const ContributorQuestionSchema = new mongoose.Schema({
  questionNumber: { type: Number, unique: true },
  subTopic: { type: String, required: true, trim: true },
  difficulty: { type: String, required: true, trim: true },
  question: { type: String, required: true },
  questionImageUrl: { type: String },
  questionImagePublicId: { type: String },
  options: { type: [OptionSchema], default: [] },
  solutions: { type: [SolutionSchema], default: [] }
}, { timestamps: true });

async function getNextQuestionNumber() {
  const id = 'contributorQuestionSeq';
  const existing = await Counter.findById(id).exec();
  if (!existing) {
    // Seed counter from current max questionNumber if any
    const last = await mongoose.model('ContributorQuestion').findOne().sort({ questionNumber: -1 }).select('questionNumber').lean().exec().catch(() => null);
    const start = last && last.questionNumber ? last.questionNumber : 0;
    await Counter.create({ _id: id, seq: start });
  }
  const updated = await Counter.findByIdAndUpdate(id, { $inc: { seq: 1 } }, { new: true }).exec();
  return updated.seq;
}

ContributorQuestionSchema.pre('save', async function (next) {
  if (this.isNew && (this.questionNumber === undefined || this.questionNumber === null)) {
    try {
      this.questionNumber = await getNextQuestionNumber();
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// When a question is deleted, shift down questionNumber for following questions
// and decrement the global counter so new inserts continue numbering from 1..N
ContributorQuestionSchema.post('findOneAndDelete', async function (doc) {
  if (!doc || typeof doc.questionNumber !== 'number') return;
  const deletedNumber = doc.questionNumber;
  const Model = mongoose.model('ContributorQuestion');
  try {
    await Model.updateMany({ questionNumber: { $gt: deletedNumber } }, { $inc: { questionNumber: -1 } }).exec();
    await Counter.findByIdAndUpdate('contributorQuestionSeq', { $inc: { seq: -1 } }).exec();
  } catch (err) {
    // swallow errors to avoid affecting the delete operation; log if desired
    // console.error('Error adjusting question numbers after delete:', err);
  }
});

// Support document-level remove()
ContributorQuestionSchema.post('remove', async function () {
  if (typeof this.questionNumber !== 'number') return;
  const deletedNumber = this.questionNumber;
  const Model = mongoose.model('ContributorQuestion');
  try {
    await Model.updateMany({ questionNumber: { $gt: deletedNumber } }, { $inc: { questionNumber: -1 } }).exec();
    await Counter.findByIdAndUpdate('contributorQuestionSeq', { $inc: { seq: -1 } }).exec();
  } catch (err) {
    // console.error('Error adjusting question numbers after remove:', err);
  }
});

module.exports = mongoose.model('ContributorQuestion', ContributorQuestionSchema);
