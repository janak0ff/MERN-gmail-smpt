const express = require('express');
const router = express.Router();
const Email = require('../models/Email');
const emailService = require('../services/emailService');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

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
router.post('/send', sendEmailLimiter, upload.array('attachments'), async (req, res) => {
  try {
    console.log('=== Send Email Request ===');

    const { to, subject, message, html } = req.body;

    // Validation
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields (to, subject, message) are required'
      });
    }

    // Strict Email validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email address format'
      });
    }

    // Subject length validation
    if (subject.length > 200) {
      return res.status(400).json({
        success: false,
        message: 'Subject must be less than 200 characters'
      });
    }



    // Send email
    const emailResult = await emailService.sendEmail({
      to,
      subject,
      message,
      html,
      attachments: req.files // Pass uploaded files
    });

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
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get email history with filters
router.get('/history', async (req, res) => {
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

    const result = await emailService.getEmailHistory({
      page,
      limit,
      status,
      recipient,
      startDate,
      endDate,
      sortBy,
      sortOrder
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
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await emailService.getEmailStats();

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

// Get specific email by ID
router.get('/:id', async (req, res) => {
  try {
    const email = await Email.findById(req.params.id);

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



// Check SMTP connection
router.get('/health/check', async (req, res) => {
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

module.exports = router;
