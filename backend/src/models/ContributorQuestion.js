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

// After any delete operation, re-sequence all questionNumber values so they
// are continuous (1..N) and update the counter to reflect total questions.
async function resequenceQuestionNumbers() {
  const Model = mongoose.model('ContributorQuestion');
  try {
    const docs = await Model.find().sort({ questionNumber: 1, _id: 1 }).select('_id questionNumber').lean().exec();
    const total = docs ? docs.length : 0;
    if (!docs || docs.length === 0) {
      await Counter.findByIdAndUpdate('contributorQuestionSeq', { seq: 0 }, { upsert: true }).exec().catch(() => null);
      return;
    }

    const bulkOps = [];
    for (let i = 0; i < docs.length; i++) {
      const desired = i + 1;
      if (docs[i].questionNumber !== desired) {
        bulkOps.push({
          updateOne: {
            filter: { _id: docs[i]._id },
            update: { $set: { questionNumber: desired } }
          }
        });
      }
    }

    if (bulkOps.length > 0) {
      await Model.bulkWrite(bulkOps);
    }

    await Counter.findByIdAndUpdate('contributorQuestionSeq', { seq: total }, { upsert: true }).exec().catch(() => null);
  } catch (err) {
    // swallow errors so delete operations don't fail because of resequencing issues
    // console.error('Error resequencing contributor questions:', err);
  }
}

// Hook into several delete entrypoints so resequencing runs automatically.
ContributorQuestionSchema.post('findOneAndDelete', async function (doc) {
  // doc may be null if nothing was deleted
  await resequenceQuestionNumbers();
});

ContributorQuestionSchema.post('findOneAndRemove', async function (doc) {
  await resequenceQuestionNumbers();
});

ContributorQuestionSchema.post('deleteOne', { document: false, query: true }, async function (res) {
  // query-level deleteOne
  await resequenceQuestionNumbers();
});

// document-level deleteOne (e.g., when calling doc.deleteOne())
ContributorQuestionSchema.post('deleteOne', { document: true, query: false }, async function () {
  await resequenceQuestionNumbers();
});

ContributorQuestionSchema.post('deleteMany', { document: false, query: true }, async function (res) {
  // res may contain deletedCount depending on mongoose version
  await resequenceQuestionNumbers();
});

// Support document-level remove()
ContributorQuestionSchema.post('remove', async function () {
  await resequenceQuestionNumbers();
});

module.exports = mongoose.model('ContributorQuestion', ContributorQuestionSchema);
