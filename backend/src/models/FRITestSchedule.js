const mongoose = require('mongoose');

/**
 * FRI Test Schedule Model
 * Stores institution-specific scheduling for FRI tests
 * When an institution schedules an FRI test, they set:
 * - The specific date/time to conduct it
 * - Which faculty will administer it
 * - Which students/batches will take it
 */

const FRITestScheduleSchema = new mongoose.Schema({
  // Reference to the parent FRI Test
  friTestId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'FRITest', 
    required: true 
  },
  
  // Institution conducting this test
  institutionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Institution', 
    required: true 
  },
  institutionName: { 
    type: String, 
    required: true 
  },
  
  // When the institution will conduct this test
  scheduledDate: { 
    type: Date, 
    required: true 
  },
  scheduledEndDate: { 
    type: Date 
  },
  
  // Assigned faculty to administer/monitor the test
  assignedFaculty: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Faculty' 
  },
  assignedFacultyUsername: { 
    type: String 
  },
  
  // Assigned students
  assignedStudents: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student' 
  }],
  
  // Assigned batches (students from these batches will be included)
  assignedBatches: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Batch' 
  }],
  
  // Generated questions (randomly selected based on FRI test criteria)
  // These are stored at scheduling time to ensure all students get the same test
  generatedQuestions: [{
    questionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Question' 
    },
    category: { 
      type: String, 
      enum: ['aptitude', 'technical', 'psychometric'] 
    },
    difficulty: { 
      type: String, 
      enum: ['easy', 'medium', 'hard'] 
    },
    orderIndex: { 
      type: Number 
    }
  }],
  
  // Status
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  
  // Test instructions or notes from institution
  instructions: { 
    type: String 
  },
  
  // Statistics
  totalAssignedStudents: { 
    type: Number, 
    default: 0 
  },
  totalAttempted: { 
    type: Number, 
    default: 0 
  },
  totalCompleted: { 
    type: Number, 
    default: 0 
  },
  
  // Metadata
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Institution', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Pre-save middleware
FRITestScheduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for efficient querying
FRITestScheduleSchema.index({ friTestId: 1, institutionId: 1 });
FRITestScheduleSchema.index({ institutionId: 1, status: 1 });
FRITestScheduleSchema.index({ assignedFaculty: 1 });
FRITestScheduleSchema.index({ scheduledDate: 1 });

// Ensure institution can't schedule the same FRI test multiple times (unless cancelled)
FRITestScheduleSchema.index(
  { friTestId: 1, institutionId: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['scheduled', 'active', 'completed'] } 
    }
  }
);

module.exports = mongoose.models.FRITestSchedule || mongoose.model('FRITestSchedule', FRITestScheduleSchema);
