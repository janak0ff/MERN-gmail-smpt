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
const { emailQueue } = require('../queue/emailQueue');

const MAX_ATTACHMENTS = 5;
const MAX_TOTAL_ATTACHMENT_SIZE = 25 * 1024 * 1024;
const MAX_HISTORY_EXPORT = 5000;
const RETENTION_DAYS = Math.max(1, Number.parseInt(process.env.EMAIL_RETENTION_DAYS || '90', 10));
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

function buildHistoryQuery({ userId, status, recipient, q, startDate, endDate }) {
  const query = { user: userId };
  if (status && ['sent', 'failed', 'pending'].includes(status)) query.status = status;
  const terms = [recipient, q].filter(Boolean).map(value => String(value).trim()).filter(Boolean);
  if (terms.length) {
    const escaped = terms.map(value => new RegExp(value.slice(0, 120).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
    query.$or = escaped.flatMap(regex => [{ to: regex }, { subject: regex }, { message: regex }]);
  }
  const now = new Date();
  const cutoff = new Date(now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const dateQuery = { $gte: cutoff, $lte: now };
  if (startDate) {
    const start = new Date(startDate);
    if (Number.isNaN(start.getTime())) throw new Error('Invalid start date');
    start.setHours(0, 0, 0, 0);
    dateQuery.$gte = start < cutoff ? cutoff : start;
  }
  if (endDate) {
    const end = new Date(endDate);
    if (Number.isNaN(end.getTime())) throw new Error('Invalid end date');
    end.setHours(23, 59, 59, 999);
    dateQuery.$lte = end > now ? now : end;
  }
  query.createdAt = dateQuery.$gte <= dateQuery.$lte
    ? dateQuery
    : { $gte: now, $lte: now };
  return query;
}

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

    router.post('/schedule', requireAuth, sendEmailLimiter, upload.array('attachments'), async (req, res) => {
      try {
        let { to, subject, message, html, ghostMode, scheduledAt } = req.body;
        if (ghostMode === 'true' || ghostMode === true) {
          await removeUploadedFiles(req.files);
          return res.status(400).json({ success: false, message: 'Ghost mode does not support scheduled delivery' });
        }
        to = String(to || '').split(/[;,]/).map(value => value.trim()).filter(Boolean);
        const scheduledDate = new Date(scheduledAt);
        const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        if (!to.length || !subject || !message || !scheduledAt || Number.isNaN(scheduledDate.getTime())) {
          await removeUploadedFiles(req.files);
          return res.status(400).json({ success: false, message: 'to, subject, message, and a valid scheduledAt are required' });
        }
        if (scheduledDate <= new Date()) {
          await removeUploadedFiles(req.files);
          return res.status(400).json({ success: false, message: 'scheduledAt must be in the future' });
        }
        if (to.length > 20 || to.some(recipient => !emailRegex.test(recipient))) {
          await removeUploadedFiles(req.files);
          return res.status(400).json({ success: false, message: 'Invalid recipients or recipient limit exceeded' });
        }
        if (subject.length > 200 || message.length > 100000 ||
          (req.files || []).reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_ATTACHMENT_SIZE) {
          await removeUploadedFiles(req.files);
          return res.status(400).json({ success: false, message: 'Message or attachments exceed the allowed size' });
        }

        const emailRecord = await emailService.createScheduledEmail({
          to, subject, message, html, attachments: req.files, scheduledAt: scheduledDate, userId: req.user._id
        });
        try {
          const job = await emailQueue.add('deliver-email', {
            emailId: emailRecord._id.toString(),
            userId: req.user._id.toString(),
            to, subject, message, html,
            attachments: (req.files || []).map(file => ({
              originalname: file.originalname, path: file.path, size: file.size
            }))
          }, { jobId: emailRecord._id.toString(), delay: scheduledDate.getTime() - Date.now() });
          emailRecord.queueJobId = job.id;
          await emailRecord.save();
        } catch (queueError) {
          await Email.deleteOne({ _id: emailRecord._id, user: req.user._id });
          await removeUploadedFiles(req.files);
          throw queueError;
        }

        return res.status(202).json({
          success: true,
          message: 'Email scheduled successfully',
          emailId: emailRecord._id,
          scheduledAt: emailRecord.scheduledAt
        });
      } catch (error) {
        console.error('Schedule email error:', error);
        await removeUploadedFiles(req.files);
        return res.status(503).json({ success: false, message: 'Unable to schedule email', error: error.message });
      }
    });

    router.delete('/scheduled/:id', requireAuth, async (req, res) => {
      try {
        const email = await Email.findOne({ _id: req.params.id, user: req.user._id, status: 'scheduled' });
        if (!email) return res.status(404).json({ success: false, message: 'Scheduled email not found' });
        if (email.queueJobId) {
          const job = await emailQueue.getJob(email.queueJobId);
          if (job) await job.remove();
        }
        const canceled = await emailService.cancelScheduledEmail(req.params.id, req.user._id);
        if (canceled) await removeUploadedFiles(email.attachments);
        return res.json({ success: true, email: canceled });
      } catch (error) {
        console.error('Cancel scheduled email error:', error);
        return res.status(500).json({ success: false, message: 'Unable to cancel scheduled email' });
      }
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
      q,
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
    if (q && String(q).length > 120) {
      return res.status(400).json({ success: false, message: 'Search query is too long' });
    }

    const result = await emailService.getEmailHistory({
      page,
      limit,
      status,
      recipient,
      q,
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

router.get('/history/export.csv', requireAuth, async (req, res) => {
  try {
    const { status, recipient, q, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    if (sortOrder !== 'asc' && sortOrder !== 'desc') return res.status(400).json({ success: false, message: 'Invalid sort order' });
    if (!['createdAt', 'sentAt', 'status', 'subject'].includes(sortBy)) return res.status(400).json({ success: false, message: 'Invalid sort field' });
    if (q && String(q).length > 120) return res.status(400).json({ success: false, message: 'Search query is too long' });
    const emails = await Email.find(buildHistoryQuery({ userId: req.user._id, status, recipient, q, startDate, endDate }))
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 }).limit(MAX_HISTORY_EXPORT)
      .select('createdAt sentAt status to subject messageId error message').lean();
    const csvCell = value => `"${String(value ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    const rows = [
      ['Created At', 'Sent At', 'Status', 'To', 'Subject', 'Message ID', 'Error', 'Message'].map(csvCell).join(','),
      ...emails.map(email => [email.createdAt?.toISOString(), email.sentAt?.toISOString(), email.status, email.to, email.subject, email.messageId, email.error, email.message].map(csvCell).join(','))
    ];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="email-history-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(`\uFEFF${rows.join('\n')}`);
  } catch (error) {
    console.error('Export email history error:', error);
    res.status(400).json({ success: false, message: error.message || 'Unable to export history' });
  }
});

router.delete('/history/:id', requireAuth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid email id' });
  const result = await Email.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) return res.status(404).json({ success: false, message: 'Email not found' });
  res.json({ success: true });
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
