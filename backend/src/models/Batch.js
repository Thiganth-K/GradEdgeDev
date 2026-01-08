const mongoose = require('mongoose');

const BatchSchema = new mongoose.Schema({
  name: { type: String, required: true },
  faculty: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Faculty' },
  students: [{ type: require('mongoose').Schema.Types.ObjectId, ref: 'Student' }],
  createdBy: { type: require('mongoose').Schema.Types.ObjectId, ref: 'Institution' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Batch || mongoose.model('Batch', BatchSchema);
