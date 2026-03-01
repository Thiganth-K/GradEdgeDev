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
  // legacy alias used by some frontend pages — kept for compatibility
  category: { type: String, enum: ['Aptitude', 'Technical', 'Psychometric', 'Coding'], required: false },
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

  // Coding-specific fields
  problemName: { type: String },
  problemStatement: { type: String },
  imageUrls: { type: [String], default: [] },
  imagePublicIds: { type: [String], default: [] },
  supportedLanguages: { type: [String], default: [] },
  constraints: { type: [String], default: [] },
  sampleInput: { type: String },
  sampleOutput: { type: String },
  industrialTestCases: { type: Array, default: [] },
  hiddenTestCases: { type: Array, default: [] },
  solutionApproach: { type: String },
  timeLimit: { type: String },
  memoryLimit: { type: String },

  // track original contributor (if any)
  contributorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Contributor' },

  // Legacy field - kept for backward compatibility with existing MCQ questions
  // question type: 'mcq' = standard multiple choice, 'placement' = placement readiness question
  questionType: { type: String, enum: ['mcq', 'placement'], default: 'mcq' },

  // question type: 'mcq' = standard multiple choice, 'placement' = placement readiness question
  questionType: { type: String, enum: ['mcq', 'placement'], default: 'mcq' },

}, { timestamps: true });

// Indexes
LibrarySchema.index({ topic: 1, subtopic: 1 });

// Create library entry from a contributor question document
LibrarySchema.statics.createFromContributorQuestion = async function(contribDoc, topic, subtopic) {
  try {
    if (!contribDoc) throw new Error('contributor question document required');
    const normalize = (raw) => { if (!raw) return null; const s = String(raw).trim(); if (!s) return null; const l = s.toLowerCase(); if (l === 'aptitude') return 'Aptitude'; if (l === 'technical') return 'Technical'; if (l === 'psychometric') return 'Psychometric'; return null; };
    const contribTopic = normalize(contribDoc.topic) || normalize(contribDoc.category) || null;
    const requestedTopic = normalize(topic) || null;
    // Prefer contributor's saved topic, then explicit request topic, then fallback to null
    const finalTopic = contribTopic || requestedTopic || undefined;
    // Prevent duplicate entries: if a Library entry already references this
    // contributor question (`mcqQuestionId`), update that entry instead of
    // creating a new one. This ensures edits go through re-approval and the
    // Library always reflects the latest approved version.
    const existingEntry = await this.findOne({ mcqQuestionId: contribDoc._id });
    if (existingEntry) {
      existingEntry.topic = finalTopic;
      existingEntry.category = finalTopic || contribDoc.category || existingEntry.category;
      existingEntry.subtopic = subtopic || contribDoc.subTopic || contribDoc.subtopic || existingEntry.subtopic;
      existingEntry.subTopic = contribDoc.subTopic || existingEntry.subTopic;
      existingEntry.difficulty = contribDoc.difficulty || existingEntry.difficulty;
      existingEntry.question = contribDoc.question || existingEntry.question;
      existingEntry.questionImageUrl = contribDoc.questionImageUrl || existingEntry.questionImageUrl;
      existingEntry.questionImagePublicId = contribDoc.questionImagePublicId || existingEntry.questionImagePublicId;
      existingEntry.questionImageUrls = contribDoc.questionImageUrls || existingEntry.questionImageUrls || [];
      existingEntry.questionImagePublicIds = contribDoc.questionImagePublicIds || existingEntry.questionImagePublicIds || [];
      existingEntry.options = contribDoc.options || existingEntry.options || [];
      existingEntry.solutions = contribDoc.solutions || existingEntry.solutions || [];
      existingEntry.contributorId = contribDoc.contributorId || contribDoc.contributor || existingEntry.contributorId;
      existingEntry.createdBy = contribDoc.contributorId || contribDoc.contributor || existingEntry.createdBy;
      existingEntry.questionType = contribDoc.questionType || existingEntry.questionType || 'mcq';
      existingEntry.questionCategory = 'MCQ';
      existingEntry.isPlacementReadyQuestion = contribDoc.questionType === 'placement' || existingEntry.isPlacementReadyQuestion;
      await existingEntry.save();
      return existingEntry;
    }

    const entry = new this({
      topic: finalTopic,
      category: finalTopic || contribDoc.category || undefined,
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
      existing.topic = 'Coding';
      existing.subtopic = codingDoc.subTopic || existing.subtopic;
      existing.subTopic = codingDoc.subTopic || existing.subTopic;
      existing.difficulty = codingDoc.difficulty || existing.difficulty;
      existing.contributorId = codingDoc.createdBy || existing.contributorId;
      existing.createdBy = codingDoc.createdBy || existing.createdBy;
      existing.questionCategory = 'CODING';
      existing.isPlacementReadyQuestion = codingDoc.isPlacementReadyQuestion || existing.isPlacementReadyQuestion || false;

      // Merge coding-specific fields so library reflects latest approved version
      existing.problemName = codingDoc.problemName || existing.problemName;
      existing.problemStatement = codingDoc.problemStatement || existing.problemStatement;
      existing.imageUrls = codingDoc.imageUrls || existing.imageUrls || [];
      existing.imagePublicIds = codingDoc.imagePublicIds || existing.imagePublicIds || [];
      existing.supportedLanguages = codingDoc.supportedLanguages || existing.supportedLanguages || [];
      existing.constraints = codingDoc.constraints || existing.constraints || [];
      existing.sampleInput = codingDoc.sampleInput || existing.sampleInput;
      existing.sampleOutput = codingDoc.sampleOutput || existing.sampleOutput;
      existing.industrialTestCases = codingDoc.industrialTestCases || existing.industrialTestCases || [];
      existing.hiddenTestCases = codingDoc.hiddenTestCases || existing.hiddenTestCases || [];
      existing.solutionApproach = codingDoc.solutionApproach || existing.solutionApproach;
      existing.timeLimit = codingDoc.timeLimit || existing.timeLimit;
      existing.memoryLimit = codingDoc.memoryLimit || existing.memoryLimit;

      await existing.save();
      console.log('[Library.createFromCodingQuestion] ✓ updated library entry for coding question', codingDoc._id);
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
      isPlacementReadyQuestion: codingDoc.isPlacementReadyQuestion || false,

      // coding-specific fields
      problemName: codingDoc.problemName,
      problemStatement: codingDoc.problemStatement,
      imageUrls: codingDoc.imageUrls || [],
      imagePublicIds: codingDoc.imagePublicIds || [],
      supportedLanguages: codingDoc.supportedLanguages || [],
      constraints: codingDoc.constraints || [],
      sampleInput: codingDoc.sampleInput,
      sampleOutput: codingDoc.sampleOutput,
      industrialTestCases: codingDoc.industrialTestCases || [],
      hiddenTestCases: codingDoc.hiddenTestCases || [],
      solutionApproach: codingDoc.solutionApproach,
      timeLimit: codingDoc.timeLimit,
      memoryLimit: codingDoc.memoryLimit
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
        // Include resource limits so admin UI shows current approved values
        entry.timeLimit = codingData.timeLimit;
        entry.memoryLimit = codingData.memoryLimit;
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
