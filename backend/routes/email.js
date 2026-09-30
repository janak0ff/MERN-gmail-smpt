const express = require('express');
const router = express.Router();
const Email = require('../models/Email');
const emailService = require('../services/emailService');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');

const MAX_ATTACHMENTS = 5;
const MAX_TOTAL_ATTACHMENT_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/zip',
  'image/gif',
  'image/jpeg',
  'image/png',
  'text/plain',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original name and timestamp
    const originalName = path.parse(file.originalname).name;
    const sanitizedName = originalName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(file.originalname);

    cb(null, `${sanitizedName}-${timestamp}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024, files: MAX_ATTACHMENTS },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error('Unsupported attachment type'));
    }
    cb(null, true);
  }
});

const removeUploadedFiles = async (files = []) => {
  await Promise.all(files.map(async file => {
    if (!file?.path) return;
    try {
      await fs.promises.unlink(file.path);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Attachment cleanup failed:', error.message);
      }
    }
  }));
};

// Rate limiting for email sending
const sendEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 emails per windowMs
  message: {
    success: false,
    message: 'Too many emails sent from this IP, please try again after 15 minutes'
  }
});

// Send email
router.post('/send', requireAuth, sendEmailLimiter, upload.array('attachments'), async (req, res) => {
  try {
    console.log('=== Send Email Request ===');

    let { to, subject, message, html, ghostMode } = req.body;

    // Accept comma- or semicolon-separated recipients, including array-style input.
    if (to) {
      to = String(to)
        .replace(/<[^>]*>/g, '')
        .replace(/^\s*\[\s*|\s*\]\s*$/g, '')
        .split(/[;,]/)
        .map(recipient => recipient.trim())
        .filter(Boolean);
    }

    console.log('Send request received', {
      userId: req.user._id.toString(),
      recipientCount: to?.length || 0,
      messageLength: message?.length || 0,
      attachmentCount: req.files?.length || 0
    });

    // Validation
    if (!to?.length || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields (to, subject, message) are required'
      });
    }

    if (to.length > 20) {
      return res.status(400).json({ success: false, message: 'A maximum of 20 recipients is allowed' });
    }
    if (subject.length > 200 || message.length > 100000) {
      return res.status(400).json({ success: false, message: 'Subject or message is too long' });
    }
    if ((req.files || []).reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_ATTACHMENT_SIZE) {
      await removeUploadedFiles(req.files);
      return res.status(400).json({ success: false, message: 'Total attachments must be 25 MB or less' });
    }
    // Strict Email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    const invalidRecipient = to.find(recipient => !emailRegex.test(recipient));
    if (invalidRecipient) {
      console.error('Email validation failed for:', invalidRecipient);
      return res.status(400).json({
        success: false,
        message: `Invalid email address format: ${invalidRecipient}`
      });
    }

    // Subject length validation
    // Send email
    const emailResult = await emailService.sendEmail({
      to,
      subject,
      message,
      html,
      attachments: req.files, // Pass uploaded files
      ghostMode: ghostMode === 'true' || ghostMode === true, // Handle both string (multipart) and boolean
      userId: req.user._id
    });
    await removeUploadedFiles(req.files);

    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        messageId: emailResult.messageId,
        emailId: emailResult.emailId
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: emailResult.error,
        emailId: emailResult.emailId
      });
    }

  } catch (error) {
    console.error('Send email error:', error);
    await removeUploadedFiles(req.files);

    // Check for validation errors
    if (error.message.includes('Invalid email') ||
      error.message.includes('validation failed') ||
      error.message.includes('does not exist') ||
      error.message.includes('Disposable') ||
      error.message.includes('Domain') ||
      error.message.includes('mailbox unavailable') ||
      error.message.includes('SMTP check failed')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get email history with filters
router.get('/history', requireAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      recipient,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const parsedPage = Number.parseInt(page, 10);
    const parsedLimit = Number.parseInt(limit, 10);
    if (!Number.isInteger(parsedPage) || parsedPage < 1 ||
      !Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ success: false, message: 'Invalid pagination values' });
    }
    if (sortOrder !== 'asc' && sortOrder !== 'desc') {
      return res.status(400).json({ success: false, message: 'Invalid sort order' });
    }
    if (!['createdAt', 'sentAt', 'status', 'subject'].includes(sortBy)) {
      return res.status(400).json({ success: false, message: 'Invalid sort field' });
    }

    const result = await emailService.getEmailHistory({
      page,
      limit,
      status,
      recipient,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get email history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get email statistics
router.get('/stats/summary', requireAuth, async (req, res) => {
  try {
    const stats = await emailService.getEmailStats(req.user._id);

    res.status(200).json({
      success: true,
      ...stats
    });
  } catch (error) {
    console.error('Get email stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Health check endpoint for Docker
router.get('/health', async (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({
    success: connected,
    status: connected ? 'healthy' : 'unhealthy',
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Check SMTP connection
router.get('/health/check', requireAuth, async (req, res) => {
  try {
    const isConnected = await emailService.verifyConnection();
    res.status(200).json({
      success: true,
      smtpConnected: isConnected
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      smtpConnected: false,
      error: error.message
    });
  }
});

// Get specific email by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const email = await Email.findOne({ _id: req.params.id, user: req.user._id });

    if (!email) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    res.status(200).json({
      success: true,
      email
    });
  } catch (error) {
    console.error('Get email by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
