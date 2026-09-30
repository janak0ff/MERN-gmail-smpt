const mongoose = require('mongoose');

const emailTemplateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  subject: { type: String, trim: true, maxlength: 200, default: '' },
  message: { type: String, required: true, maxlength: 100000 },
  html: { type: String, default: '', maxlength: 200000 }
}, { timestamps: true });

emailTemplateSchema.index({ user: 1, name: 1 }, { unique: true });
emailTemplateSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
