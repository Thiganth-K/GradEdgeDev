const mongoose = require('mongoose');

const OptionSchema = new mongoose.Schema({
  text: { type: String },
  imageUrl: { type: String },
  imageUrls: { type: [String], default: [] },
  imagePublicId: { type: String },
  imagePublicIds: { type: [String], default: [] },
  isCorrect: { type: Boolean, default: false }
}, { _id: false });

const SolutionSchema = new mongoose.Schema({
  explanation: { type: String },
  imageUrl: { type: String },
  imagePublicId: { type: String },
  imageUrls: { type: [String], default: [] },
  imagePublicIds: { type: [String], default: [] }
}, { _id: false });

/**
 * Library Model - stores full question entries (copied from contributor/question)
 * This model intentionally embeds question data so library queries are fast
 */
const LibrarySchema = new mongoose.Schema({
  topic: { 
    type: String, 
    enum: ['Aptitude', 'Technical', 'Psychometric'], 
    required: false 
  },
  subtopic: { type: String, required: false },

  // Question fields (compatible with ContributorQuestion schema)
  subTopic: { type: String, trim: true },
  difficulty: { type: String, trim: true },
  question: { type: String },
  questionImageUrl: { type: String },
  questionImagePublicId: { type: String },
  questionImageUrls: { type: [String], default: [] },
  questionImagePublicIds: { type: [String], default: [] },
  options: { type: [OptionSchema], default: [] },
  solutions: { type: [SolutionSchema], default: [] },

  // track original contributor (if any)
  contributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },

  // question type: 'mcq' = standard multiple choice, 'placement' = placement readiness question
  questionType: { type: String, enum: ['mcq', 'placement'], default: 'mcq' },

}, { timestamps: true });

// Indexes
LibrarySchema.index({ topic: 1, subtopic: 1 });

// Create library entry from a contributor question document
LibrarySchema.statics.createFromContributorQuestion = async function(contribDoc, topic, subtopic) {
  try {
    if (!contribDoc) throw new Error('contributor question document required');
    const entry = new this({
      topic: topic || undefined,
      subtopic: subtopic || contribDoc.subTopic || contribDoc.subtopic,
      subTopic: contribDoc.subTopic,
      difficulty: contribDoc.difficulty,
      question: contribDoc.question,
      questionImageUrl: contribDoc.questionImageUrl,
      questionImagePublicId: contribDoc.questionImagePublicId,
      questionImageUrls: contribDoc.questionImageUrls || [],
      questionImagePublicIds: contribDoc.questionImagePublicIds || [],
      options: contribDoc.options || [],
      solutions: contribDoc.solutions || [],
      contributorId: contribDoc.contributorId || contribDoc.contributor,
      questionType: contribDoc.questionType || 'mcq'
    });
    await entry.save();
    return entry;
  } catch (err) {
    console.error('[Library.createFromContributorQuestion] error:', err && err.message);
    throw err;
  }
};

// Get library structure grouped by topic and subtopic
LibrarySchema.statics.getLibraryStructure = async function() {
  try {
    const entries = await this.find().sort({ topic: 1, subtopic: 1 }).lean();
    const structure = {
      Aptitude: {},
      Technical: {},
      Psychometric: {}
    };
    entries.forEach(entry => {
      const topicKey = entry.topic || 'Technical';
      const sub = entry.subtopic || entry.subTopic || 'General';
      if (!structure[topicKey]) structure[topicKey] = {};
      if (!structure[topicKey][sub]) structure[topicKey][sub] = [];
      structure[topicKey][sub].push(entry._id);
    });
    return structure;
  } catch (err) {
    console.error('[Library.getLibraryStructure] error:', err && err.message);
    throw err;
  }
};

LibrarySchema.statics.getQuestionsByTopicAndSubtopic = async function(topic, subtopic) {
  try {
    const entries = await this.find({ topic, subtopic }).lean();
    return entries;
  } catch (err) {
    console.error('[Library.getQuestionsByTopicAndSubtopic] error:', err && err.message);
    throw err;
  }
};

LibrarySchema.statics.getAllQuestionsByContributor = async function(contributorId) {
  try {
    const entries = await this.find({ contributorId }).lean();
    const organized = { Aptitude: {}, Technical: {}, Psychometric: {} };
    entries.forEach(entry => {
      const t = entry.topic || 'Technical';
      const s = entry.subtopic || entry.subTopic || 'General';
      if (!organized[t]) organized[t] = {};
      if (!organized[t][s]) organized[t][s] = [];
      organized[t][s].push(entry);
    });
    return organized;
  } catch (err) {
    console.error('[Library.getAllQuestionsByContributor] error:', err && err.message);
    throw err;
  }
};

const Library = mongoose.model('Library', LibrarySchema);

module.exports = Library;
