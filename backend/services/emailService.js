const nodemailer = require('nodemailer');
const Email = require('../models/Email');
const dns = require('dns').promises;

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

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailData.to)) {
        throw new Error('Invalid recipient email address');
      }

      // Validate domain MX records
      await this.validateDomain(emailData.to);

      // Create email record in database with pending status
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

      // Prepare email options
      const mailOptions = {
        from: process.env.GMAIL_USER || 'noreply@mern-smtp-app.com',
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.message,
        html: this.formatPlainTextToHTML(emailData.message, emailData.html)
      };

      console.log('Attempting to send email to:', emailData.to);

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      console.log('Email sent successfully. Message ID:', result.messageId);

      // Update record with success
      await emailRecord.markAsSent(result.messageId);

      return {
        success: true,
        messageId: result.messageId,
        emailId: emailRecord._id,
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

  formatPlainTextToHTML(text, extraHtml = null) {
    const formattedText = text
      .replace(/\r\n/g, '<br>')
      .replace(/\n/g, '<br>')
      .replace(/\r/g, '<br>');

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email</title>
          <style>
              body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
                  background-color: #f5f5f5;
              }
              .email-container {
                  background: white;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              }
              .email-header {
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  padding: 30px;
                  color: white;
                  text-align: center;
              }
              .email-header h1 {
                  margin: 0;
                  font-size: 24px;
                  font-weight: 600;
              }
              .email-content {
                  padding: 30px;
                  background: #f8f9fa;
              }
              .message-body {
                  background: white;
                  padding: 25px;
                  border-radius: 8px;
                  border-left: 4px solid #667eea;
                  white-space: pre-line;
                  line-height: 1.8;
              }
              .email-footer {
                  margin-top: 20px;
                  padding-top: 20px;
                  border-top: 1px solid #e9ecef;
                  text-align: center;
                  color: #6c757d;
                  font-size: 12px;
              }
              @media (max-width: 600px) {
                  body {
                      padding: 10px;
                  }
                  .email-header {
                      padding: 20px;
                  }
                  .email-header h1 {
                      font-size: 20px;
                  }
                  .email-content {
                      padding: 20px;
                  }
                  .message-body {
                      padding: 20px;
                  }
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="email-header">
                  <h1>📧 Email Notification</h1>
              </div>
              <div class="email-content">
                  <div class="message-body">
                      ${formattedText}
                      ${extraHtml ? `<br><br><div class="custom-html">${extraHtml}</div>` : ''}
                  </div>
                  <div class="email-footer">
                      <p>Sent via MERN SMTP Application</p>
                      <p>${new Date().toLocaleDateString()}</p>
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

  async validateDomain(email) {
    try {
      const domain = email.split('@')[1];
      const mxRecords = await dns.resolveMx(domain);

      if (!mxRecords || mxRecords.length === 0) {
        throw new Error(`Domain ${domain} does not accept email (no MX records found)`);
      }
      return true;
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
        throw new Error(`Domain ${email.split('@')[1]} not found or invalid`);
      }
      throw error;
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