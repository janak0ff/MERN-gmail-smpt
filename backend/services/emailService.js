const nodemailer = require('nodemailer');
const Email = require('../models/Email');
const emailValidator = require('deep-email-validator');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Try multiple Gmail SMTP configurations
    const configs = [
      {
        name: 'Gmail SSL',
        config: {
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        }
      },
      {
        name: 'Gmail Port 465',
        config: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: false,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          },
          tls: {
            rejectUnauthorized: false
          }
        }
      },
      {
        name: 'Gmail Port 465',
        config: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
          }
        }
      }
    ];

    // Try each configuration until one works
    for (const { name, config } of configs) {
      try {
        console.log(`Trying SMTP configuration: ${name}`);
        this.transporter = nodemailer.createTransport(config);
        break;
      } catch (error) {
        console.log(`Configuration ${name} failed:`, error.message);
        continue;
      }
    }

    if (!this.transporter) {
      console.error('All SMTP configurations failed. Using mock transporter for development.');
      this.setupMockTransporter();
    }
  }

  setupMockTransporter() {
    // Mock transporter for development when SMTP is not available
    this.transporter = {
      sendMail: async (mailOptions) => {
        console.log('Mock SMTP - Would send email:', {
          to: mailOptions.to,
          subject: mailOptions.subject
        });

        // Simulate email sending delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return {
          messageId: `mock-${Date.now()}@mern-smtp-app`,
          response: '250 Mock email sent successfully'
        };
      },
      verify: async () => {
        console.log('Mock SMTP - Verification successful');
        return true;
      }
    };
  }

  async sendEmail(emailData) {
    let emailRecord;

    try {
      // Validate required fields
      if (!emailData.to || !emailData.subject || !emailData.message) {
        throw new Error('Missing required fields: to, subject, or message');
      }

      // Create email record in database with pending status (SKIP if ghost mode)
      if (!emailData.ghostMode) {
        emailRecord = new Email({
          from: process.env.GMAIL_USER || 'noreply@mern-smtp-app.com',
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message,
          html: emailData.html,
          status: 'pending'
        });

        await emailRecord.save();
        console.log(`Email record created with ID: ${emailRecord._id}`);
      } else {
        console.log('👻 Ghost Mode enabled: Skipping database storage');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailData.to)) {
        throw new Error('Invalid recipient email address');
      }

      // Validate email deeply (SMTP check)
      await this.validateEmailDeeply(emailData.to);

      // Prepare email options
      const mailOptions = {
        from: process.env.GMAIL_USER || 'noreply@mern-smtp-app.com',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.message,
        html: this.formatPlainTextToHTML(emailData.message, emailData.html, emailData.attachments),
        attachments: (emailData.attachments && emailData.attachments.length > 0)
          ? emailData.attachments.map(file => ({
            filename: file.originalname,
            path: file.path
          }))
          : []
      };

      // Update email record with attachments info if present
      if (!emailData.ghostMode && emailData.attachments && emailData.attachments.length > 0) {
        emailRecord.attachments = emailData.attachments.map(file => ({
          filename: file.originalname,
          path: file.path,
          size: file.size
        }));
        await emailRecord.save();
      }

      console.log('Attempting to send email to:', emailData.to);
      console.log('Attachments count:', emailData.attachments ? emailData.attachments.length : 0);

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      console.log('Email sent successfully. Message ID:', result.messageId);

      // Update record with success (SKIP if ghost mode)
      if (emailRecord) {
        await emailRecord.markAsSent(result.messageId);
      }

      return {
        success: true,
        messageId: result.messageId,
        emailId: emailRecord ? emailRecord._id : 'ghost-mode',
        message: 'Email sent successfully'
      };

    } catch (error) {
      console.error('Email sending error:', error);

      // Update record with failure if it was created
      if (emailRecord) {
        await emailRecord.markAsFailed(error.message);
      }

      // Provide user-friendly error messages
      let userMessage = 'Failed to send email';

      if (error.message.includes('Invalid login') || error.message.includes('EAUTH')) {
        userMessage = 'Gmail authentication failed. Please check your app password.';
      } else if (error.message.includes('ENOTFOUND')) {
        userMessage = 'Network error. Please check your internet connection.';
      } else if (error.message.includes('Invalid recipient')) {
        userMessage = 'Invalid email address. Please check the recipient email.';
      } else {
        userMessage = error.message;
      }

      return {
        success: false,
        error: userMessage,
        emailId: emailRecord?._id,
        technicalError: error.message
      };
    }
  }

  formatPlainTextToHTML(text, extraHtml = null, attachments = []) {
    // Check if text looks like HTML (contains tags)
    const isHtml = /<[a-z][\s\S]*>/i.test(text);

    const formattedText = isHtml ? text : text
      .replace(/\r\n/g, '<br>')
      .replace(/\n/g, '<br>')
      .replace(/\r/g, '<br>');

    const attachmentList = attachments && attachments.length > 0
      ? `
        <div class="attachments-section">
          <h3>📎 Attached Files (${attachments.length})</h3>
          <div class="attachment-grid">
            ${attachments.map(file => `
              <div class="attachment-item">
                <div class="file-icon">📄</div>
                <div class="file-info">
                  <div class="file-name">${file.originalname}</div>
                  <div class="file-size">${(file.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `
      : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
              
              body {
                  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #1e293b;
                  background-color: #f1f5f9;
                  margin: 0;
                  padding: 0;
                  -webkit-font-smoothing: antialiased;
              }
              
              .email-wrapper {
                  width: 100%;
                  background-color: #f1f5f9;
                  padding: 40px 0;
              }
              
              .email-container {
                  background: white;
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                  max-width: 600px;
                  margin: 0 auto;
              }
              
              .email-header {
                  background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                  padding: 40px 30px;
                  text-align: center;
                  color: white;
              }
              
              .brand-logo {
                  font-size: 28px;
                  font-weight: 800;
                  letter-spacing: -0.02em;
                  margin-bottom: 10px;
                  display: inline-block;
              }
              
              .header-subtitle {
                  font-size: 14px;
                  opacity: 0.9;
                  font-weight: 500;
              }
              
              .email-body {
                  padding: 40px 30px;
                  background-color: #ffffff;
              }
              
              .message-content {
                  font-size: 16px;
                  color: #334155;
                  line-height: 1.8;
                  margin-bottom: 30px;
              }
              
              .custom-html-container {
                  background-color: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 12px;
                  padding: 20px;
                  margin: 20px 0;
              }
              
              .attachments-section {
                  margin-top: 30px;
                  padding-top: 30px;
                  border-top: 1px solid #e2e8f0;
              }
              
              .attachments-section h3 {
                  font-size: 14px;
                  color: #64748b;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                  margin-bottom: 15px;
                  font-weight: 600;
              }
              
              .attachment-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                  gap: 10px;
              }
              
              .attachment-item {
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  padding: 10px;
                  background: #f8fafc;
                  border: 1px solid #e2e8f0;
                  border-radius: 8px;
              }
              
              .file-icon {
                  font-size: 20px;
              }
              
              .file-info {
                  display: flex;
                  flex-direction: column;
                  overflow: hidden;
              }
              
              .file-name {
                  font-size: 13px;
                  font-weight: 500;
                  color: #334155;
                  white-space: nowrap;
                  overflow: hidden;
                  text-overflow: ellipsis;
              }
              
              .file-size {
                  font-size: 11px;
                  color: #94a3b8;
              }
              
              .email-footer {
                  background-color: #f8fafc;
                  padding: 20px;
                  text-align: center;
                  border-top: 1px solid #e2e8f0;
              }
              
              .footer-text {
                  font-size: 12px;
                  color: #94a3b8;
                  margin-bottom: 5px;
              }
              
              .footer-link {
                  color: #4f46e5;
                  text-decoration: none;
                  font-weight: 500;
              }
              
              @media only screen and (max-width: 600px) {
                  .email-wrapper {
                      padding: 0;
                  }
                  .email-container {
                      border-radius: 0;
                  }
                  .email-header {
                      padding: 30px 20px;
                  }
                  .email-body {
                      padding: 30px 20px;
                  }
                  .attachment-grid {
                      grid-template-columns: 1fr;
                  }
              }
          </style>
      </head>
      <body>
          <div class="email-wrapper">
              <div class="email-container">
                  <div class="email-header">
                      <div class="brand-logo">✨ MERN SMTP</div>
                      <div class="header-subtitle">Secure Email Delivery System</div>
                  </div>
                  
                  <div class="email-body">
                      <div class="message-content">
                          ${formattedText}
                      </div>
                      
                      ${extraHtml ? `<div class="custom-html-container">${extraHtml}</div>` : ''}
                      
                      ${attachmentList}
                  </div>
                  
                  <div class="email-footer">
                      <p class="footer-text">Sent securely via MERN SMTP Application</p>
                      <p class="footer-text">
                          <a href="#" class="footer-link">Unsubscribe</a> • 
                          <a href="#" class="footer-link">Privacy Policy</a>
                      </p>
                      <p class="footer-text">© ${new Date().getFullYear()} MERN SMTP. All rights reserved.</p>
                  </div>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  async getEmailHistory(filters = {}) {
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
      } = filters;

      // Build query
      const query = {};

      if (status && status !== 'all') query.status = status;
      if (recipient) query.to = { $regex: recipient, $options: 'i' };

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          query.createdAt.$gte = start;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          query.createdAt.$lte = end;
        }
      }

      // Execute query
      const emails = await Email.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .select('-__v');

      const total = await Email.countDocuments(query);

      return {
        emails,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching email history:', error);
      throw new Error('Failed to fetch email history');
    }
  }

  async getEmailStats() {
    try {
      const stats = await Email.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const total = await Email.countDocuments();

      // Today's count
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = await Email.countDocuments({
        createdAt: { $gte: today }
      });

      // Last 7 days count
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const last7DaysCount = await Email.countDocuments({
        createdAt: { $gte: last7Days }
      });

      // Last 30 days count
      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const last30DaysCount = await Email.countDocuments({
        createdAt: { $gte: last30Days }
      });

      // This month count
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      const thisMonthCount = await Email.countDocuments({
        createdAt: { $gte: thisMonth }
      });

      return {
        total,
        today: todayCount,
        last7Days: last7DaysCount,
        last30Days: last30DaysCount,
        thisMonth: thisMonthCount,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, { sent: 0, failed: 0, pending: 0 })
      };
    } catch (error) {
      console.error('Error fetching email stats:', error);
      throw new Error('Failed to fetch email statistics');
    }
  }

  async verifyConnection() {
    try {
      if (!this.transporter) {
        throw new Error('SMTP transporter not initialized');
      }

      await this.transporter.verify();
      console.log('✅ SMTP connection verified successfully');

      return {
        success: true,
        smtpConnected: true,
        message: 'SMTP connection is healthy'
      };
    } catch (error) {
      console.error('❌ SMTP connection failed:', error.message);

      return {
        success: false,
        smtpConnected: false,
        error: error.message,
        message: 'SMTP connection failed'
      };
    }
  }

  async getSMTPInfo() {
    return {
      service: 'gmail',
      user: process.env.GMAIL_USER,
      hasAppPassword: !!process.env.GMAIL_APP_PASSWORD,
      appPasswordLength: process.env.GMAIL_APP_PASSWORD?.length || 0,
      isMock: !this.transporter || typeof this.transporter.verify !== 'function'
    };
  }

  // Method to test email sending with different configurations
  async testEmailSending(testEmail = null) {
    const testTo = testEmail || process.env.GMAIL_USER;

    if (!testTo) {
      return {
        success: false,
        error: 'No test email address provided'
      };
    }

    const testData = {
      to: testTo,
      subject: 'Test Email from MERN SMTP App',
      message: `This is a test email sent from your MERN SMTP application.

Application Details:
- Time: ${new Date().toLocaleString()}
- Environment: ${process.env.NODE_ENV}
- SMTP Service: Gmail

If you received this email, your SMTP configuration is working correctly!

Best regards,
  MERN SMTP Application`
    };

    return await this.sendEmail(testData);
  }

  async validateEmailDeeply(email) {
    try {
      const { valid, reason, validators } = await emailValidator.validate({
        email: email,
        validateRegex: true,
        validateMx: true,
        validateTypo: true,
        validateDisposable: true,
        validateSMTP: false,
      });

      if (!valid) {
        let errorMessage = 'Invalid email address';

        if (validators[reason] && validators[reason].reason) {
          errorMessage = `Email validation failed: ${validators[reason].reason} `;
        } else {
          switch (reason) {
            case 'regex': errorMessage = 'Invalid email format'; break;
            case 'typo': errorMessage = 'Did you mean ' + validators.typo?.reason + '?'; break;
            case 'disposable': errorMessage = 'Disposable email addresses are not allowed'; break;
            case 'mx': errorMessage = 'Domain does not accept email (MX record missing)'; break;
            case 'smtp': errorMessage = 'Email address does not exist (SMTP check failed)'; break;
            default: errorMessage = `Invalid email: ${reason} `;
          }
        }

        throw new Error(errorMessage);
      }

      return true;
    } catch (error) {
      // If it's our own error, rethrow it
      if (error.message.startsWith('Email validation failed') ||
        error.message.startsWith('Invalid email') ||
        error.message.startsWith('Disposable') ||
        error.message.startsWith('Domain') ||
        error.message.startsWith('Did you mean')) {
        throw error;
      }

      // Log unexpected validation errors but allow sending (fail open) to avoid blocking valid emails due to network issues
      console.warn('Deep email validation warning:', error.message);
      return true;
    }
  }
}

// Create and export singleton instance
const emailService = new EmailService();

// Verify connection on startup
emailService.verifyConnection().then(result => {
  if (result.success) {
    console.log('🎉 Email service initialized successfully');
  } else {
    console.log('⚠️ Email service initialized with limited functionality');
    console.log('💡 Reason:', result.error);
  }
});

module.exports = emailService;