const mongoose = require('mongoose');

const draftSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  to: { type: String, trim: true, maxlength: 4000, default: '' },
  subject: { type: String, trim: true, maxlength: 200, default: '' },
  message: { type: String, maxlength: 100000, default: '' },
  html: { type: String, maxlength: 200000, default: '' },
  lastSavedAt: { type: Date, default: Date.now }
}, { timestamps: true });

draftSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Draft', draftSchema);
