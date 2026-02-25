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
 * Updated to support both MCQ and CODING question types with references
 */
const LibrarySchema = new mongoose.Schema({
  topic: { 
    type: String, 
    enum: ['Aptitude', 'Technical', 'Psychometric', 'Coding'], 
    required: false 
  },
  subtopic: { type: String, required: false },

  // Question type discriminator: MCQ or CODING
  questionCategory: { 
    type: String, 
    enum: ['MCQ', 'CODING'], 
    required: true 
  },

  // Reference fields - one will be populated based on questionCategory
  mcqQuestionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ContributorQuestion',
    required: function() { return this.questionCategory === 'MCQ'; }
  },
  codingQuestionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'CodingContributor',
    required: function() { return this.questionCategory === 'CODING'; }
  },

  // Placement readiness flag
  isPlacementReadyQuestion: { type: Boolean, default: false },

  // Question fields (compatible with ContributorQuestion schema - for MCQ)
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
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },

  // Legacy field - kept for backward compatibility with existing MCQ questions
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
      createdBy: contribDoc.contributorId || contribDoc.contributor,
      questionType: contribDoc.questionType || 'mcq',
      questionCategory: 'MCQ',
      mcqQuestionId: contribDoc._id,
      isPlacementReadyQuestion: contribDoc.questionType === 'placement'
    });
    await entry.save();
    return entry;
  } catch (err) {
    console.error('[Library.createFromContributorQuestion] error:', err && err.message);
    throw err;
  }
};

// Create library entry from a coding contributor question document
LibrarySchema.statics.createFromCodingQuestion = async function(codingDoc) {
  try {
    if (!codingDoc) throw new Error('coding question document required');
    
    // Check if already exists in library to prevent duplicates
    const existing = await this.findOne({ codingQuestionId: codingDoc._id });
    if (existing) {
      console.log('[Library.createFromCodingQuestion] entry already exists, returning existing');
      return existing;
    }

    const entry = new this({
      topic: 'Coding', // Coding questions go to Coding category
      subtopic: codingDoc.subTopic,
      subTopic: codingDoc.subTopic,
      difficulty: codingDoc.difficulty,
      contributorId: codingDoc.createdBy,
      createdBy: codingDoc.createdBy,
      questionCategory: 'CODING',
      codingQuestionId: codingDoc._id,
      isPlacementReadyQuestion: codingDoc.isPlacementReadyQuestion || false
    });
    await entry.save();
    console.log('[Library.createFromCodingQuestion] ✓ created library entry for coding question', codingDoc._id);
    return entry;
  } catch (err) {
    console.error('[Library.createFromCodingQuestion] error:', err && err.message);
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
      Psychometric: {},
      Coding: {}
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
    const entries = await this.find({ contributorId })
      .populate('codingQuestionId')
      .populate('mcqQuestionId')
      .lean();
    const organized = { Aptitude: {}, Technical: {}, Psychometric: {}, Coding: {} };
    entries.forEach(entry => {
      const t = entry.topic || 'Technical';
      const s = entry.subtopic || entry.subTopic || 'General';
      if (!organized[t]) organized[t] = {};
      if (!organized[t][s]) organized[t][s] = [];
      
      // Merge coding question data if available
      if (entry.questionCategory === 'CODING' && entry.codingQuestionId) {
        const codingData = entry.codingQuestionId;
        entry.problemName = codingData.problemName;
        entry.problemStatement = codingData.problemStatement;
        entry.imageUrls = codingData.imageUrls;
        entry.imagePublicIds = codingData.imagePublicIds;
        entry.supportedLanguages = codingData.supportedLanguages;
        entry.constraints = codingData.constraints;
        entry.sampleInput = codingData.sampleInput;
        entry.sampleOutput = codingData.sampleOutput;
        entry.industrialTestCases = codingData.industrialTestCases;
        entry.hiddenTestCases = codingData.hiddenTestCases;
        entry.solutionApproach = codingData.solutionApproach;
      }
      
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
