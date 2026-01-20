const mongoose = require('mongoose');

const AdminLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, required: false },
  actorUsername: { type: String, required: false },
  role: { type: String, required: true }, // contributor|faculty|student|institution|admin|superadmin
  actionType: { type: String, required: true }, // login, logout, create, edit, delete, view, approve, reject, submit, etc.
  message: { type: String, required: true },
  refs: { type: mongoose.Schema.Types.Mixed, required: false }, // related entity refs, e.g. { entity: 'Test', id: '...' }
  timestamp: { type: Date, default: Date.now }
}, { collection: 'admin_logs' });

module.exports = mongoose.model('AdminLog', AdminLogSchema);
