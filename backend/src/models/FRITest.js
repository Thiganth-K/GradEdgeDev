const mongoose = require('mongoose');

/**
 * Foundation Readiness Test (FRI Test) Model
 * Created by Admin to be conducted by institutions within a specified timeframe
 */

const FRITestSchema = new mongoose.Schema({
  // Basic test information
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  
  // Question distribution percentages (must add up to 100)
  aptitudePercentage: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  technicalPercentage: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  psychometricPercentage: { 
    type: Number, 
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Total number of questions in the test
  totalQuestions: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Test duration in minutes
  testDurationMinutes: {
    type: Number,
    required: true,
    min: 1
  },
  
  // Time window for institutions to conduct the test
  availableFrom: { 
    type: Date, 
    required: true 
  },
  availableTo: { 
    type: Date, 
    required: true 
  },
  
  // Target institutions (empty array means all institutions can access)
  targetInstitutions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Institution' 
  }],
  
  // Difficulty distribution (optional)
  easyPercentage: { 
    type: Number, 
    min: 0,
    max: 100,
    default: 33
  },
  mediumPercentage: { 
    type: Number, 
    min: 0,
    max: 100,
    default: 34
  },
  hardPercentage: { 
    type: Number, 
    min: 0,
    max: 100,
    default: 33
  },
  
  // Test settings
  shuffleQuestions: { 
    type: Boolean, 
    default: true 
  },
  showResultsImmediately: { 
    type: Boolean, 
    default: false 
  },
  allowReview: { 
    type: Boolean, 
    default: false 
  },
  
  // Admin who created the test
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Admin', 
    required: true 
  },
  createdByUsername: { 
    type: String, 
    required: true 
  },
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'expired', 'archived'],
    default: 'draft'
  },
  
  // Metadata
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save validation
FRITestSchema.pre('save', function(next) {
  // Validate percentages add up to 100
  const totalPercentage = this.aptitudePercentage + this.technicalPercentage + this.psychometricPercentage;
  if (totalPercentage !== 100) {
    return next(new Error('Question category percentages must add up to 100'));
  }
  
  // Validate difficulty percentages add up to 100
  const totalDifficulty = this.easyPercentage + this.mediumPercentage + this.hardPercentage;
  if (totalDifficulty !== 100) {
    return next(new Error('Difficulty percentages must add up to 100'));
  }
  
  // Validate date range
  if (this.availableFrom >= this.availableTo) {
    return next(new Error('availableFrom must be before availableTo'));
  }
  
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
FRITestSchema.index({ status: 1, availableFrom: 1, availableTo: 1 });
FRITestSchema.index({ createdBy: 1 });

module.exports = mongoose.models.FRITest || mongoose.model('FRITest', FRITestSchema);
