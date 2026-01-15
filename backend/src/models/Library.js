const mongoose = require('mongoose');

/**
 * Library Model - Simplified flat structure for question organization
 * 
 * Each document represents one question entry in the library
 * Organized by topic (Aptitude, Technical, Psychometric) and user-defined subtopic
 */

const LibrarySchema = new mongoose.Schema({
  topic: { 
    type: String, 
    enum: ['Aptitude', 'Technical', 'Psychometric'], 
    required: true 
  },
  subtopic: { 
    type: String, 
    required: true 
  },
  qn_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Question',
    required: true,
    unique: true // Ensure each question appears only once in library
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient querying
LibrarySchema.index({ topic: 1, subtopic: 1 });
LibrarySchema.index({ qn_id: 1 });

// Update timestamps before saving
LibrarySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Helper methods for library operations
LibrarySchema.statics.addQuestionToLibrary = async function(questionId, topic, subtopic) {
  try {
    // Check if question already exists in library
    const existing = await this.findOne({ qn_id: questionId });
    if (existing) {
      // Update if subtopic changed
      if (existing.subtopic !== subtopic || existing.topic !== topic) {
        existing.topic = topic;
        existing.subtopic = subtopic;
        await existing.save();
      }
      return existing;
    }
    
    // Create new library entry
    const entry = new this({
      topic,
      subtopic,
      qn_id: questionId
    });
    
    await entry.save();
    return entry;
  } catch (err) {
    console.error('[Library.addQuestionToLibrary] error:', err.message);
    throw err;
  }
};

LibrarySchema.statics.removeQuestionFromLibrary = async function(questionId) {
  try {
    const result = await this.deleteOne({ qn_id: questionId });
    return result;
  } catch (err) {
    console.error('[Library.removeQuestionFromLibrary] error:', err.message);
    throw err;
  }
};

LibrarySchema.statics.getLibraryStructure = async function() {
  try {
    // Get all library entries grouped by topic and subtopic
    const entries = await this.find().sort({ topic: 1, subtopic: 1 });
    
    // Organize into structure
    const structure = {
      Aptitude: {},
      Technical: {},
      Psychometric: {}
    };
    
    entries.forEach(entry => {
      if (!structure[entry.topic][entry.subtopic]) {
        structure[entry.topic][entry.subtopic] = [];
      }
      structure[entry.topic][entry.subtopic].push(entry.qn_id);
    });
    
    return structure;
  } catch (err) {
    console.error('[Library.getLibraryStructure] error:', err.message);
    throw err;
  }
};

LibrarySchema.statics.getQuestionsByTopicAndSubtopic = async function(topic, subtopic) {
  try {
    const entries = await this.find({ topic, subtopic }).populate('qn_id');
    return entries.map(e => e.qn_id).filter(q => q); // Filter out null refs
  } catch (err) {
    console.error('[Library.getQuestionsByTopicAndSubtopic] error:', err.message);
    throw err;
  }
};

LibrarySchema.statics.getAllQuestionsByContributor = async function(contributorId) {
  try {
    // Get all library entries and populate question details
    const entries = await this.find().populate({
      path: 'qn_id',
      match: { 
        $or: [
          { createdByContributor: contributorId },
          { createdBy: contributorId }
        ]
      }
    });
    
    // Filter out entries where question didn't match (null after population)
    const validEntries = entries.filter(e => e.qn_id);
    
    // Organize by topic and subtopic
    const organized = {
      Aptitude: {},
      Technical: {},
      Psychometric: {}
    };
    
    validEntries.forEach(entry => {
      if (!organized[entry.topic][entry.subtopic]) {
        organized[entry.topic][entry.subtopic] = [];
      }
      organized[entry.topic][entry.subtopic].push(entry.qn_id);
    });
    
    return organized;
  } catch (err) {
    console.error('[Library.getAllQuestionsByContributor] error:', err.message);
    throw err;
  }
};

const Library = mongoose.model('Library', LibrarySchema);

module.exports = Library;
