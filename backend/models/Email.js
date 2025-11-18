const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    trim: true
  },
  to: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  html: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['sent', 'failed', 'pending'],
    default: 'pending'
  },
  messageId: {
    type: String,
    default: null
  },
  error: {
    type: String,
    default: null
  },
  sentAt: {
    type: Date,
    default: null
  },
  attempts: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for better performance
emailSchema.index({ createdAt: -1 });
emailSchema.index({ to: 1 });
emailSchema.index({ status: 1 });

// Virtual for email age
emailSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

// Method to mark as sent
emailSchema.methods.markAsSent = function(messageId) {
  this.status = 'sent';
  this.messageId = messageId;
  this.sentAt = new Date();
  this.attempts += 1;
  return this.save();
};

// Method to mark as failed
emailSchema.methods.markAsFailed = function(error) {
  this.status = 'failed';
  this.error = error;
  this.attempts += 1;
  return this.save();
};

module.exports = mongoose.model('Email', emailSchema);
