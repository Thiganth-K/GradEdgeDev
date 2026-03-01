const mongoose = require('mongoose');

const TestCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  output: { type: String, required: true }
}, { _id: false });

const CodingContributorSchema = new mongoose.Schema({
  subTopic: { 
    type: String, 
    required: true,
    trim: true 
  },
  difficulty: { 
    type: String, 
    required: true,
    enum: ['Easy', 'Medium', 'Hard'],
    trim: true 
  },
  problemName: { 
    type: String, 
    required: true,
    trim: true 
  },
  problemStatement: { 
    type: String, 
    required: true 
  },
  imageUrls: { 
    type: [String], 
    default: [] 
  },
  imagePublicIds: { 
    type: [String], 
    default: [] 
  },
  supportedLanguages: { 
    type: [String], 
    default: [] 
  },
  constraints: { 
    type: [String], 
    default: [] 
  },
  sampleInput: { 
    type: String 
  },
  sampleOutput: { 
    type: String 
  },
  industrialTestCases: { 
    type: [TestCaseSchema], 
    default: [] 
  },
  hiddenTestCases: { 
    type: [TestCaseSchema], 
    default: [] 
  },
  solutionApproach: { 
    type: String 
  },
  timeLimit: {
    type: String,
    trim: true
  },
  memoryLimit: {
    type: String,
    trim: true
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  rejectionReason: { 
    type: String 
  },
  isPlacementReadyQuestion: { 
    type: Boolean, 
    default: false 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Contributor',
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Indexes for better query performance
CodingContributorSchema.index({ difficulty: 1 });
CodingContributorSchema.index({ status: 1 });
CodingContributorSchema.index({ subTopic: 1 });
CodingContributorSchema.index({ createdBy: 1 });

module.exports = mongoose.model('CodingContributor', CodingContributorSchema);
