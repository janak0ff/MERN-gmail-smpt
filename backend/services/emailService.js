const nodemailer = require('nodemailer');
const Email = require('../models/Email');

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
          to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
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
      const recipients = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidRecipient = recipients.find(recipient => !emailRegex.test(recipient));
      if (invalidRecipient) {
        throw new Error('Invalid recipient email address');
      }

      // Prepare email options
      const senderAddress = process.env.GMAIL_USER || 'noreply@mern-smtp-app.com';
      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || 'MERN SMTP',
          address: senderAddress
        },
        replyTo: process.env.MAIL_REPLY_TO || senderAddress,
        to: recipients,
        subject: emailData.subject,
        text: this.formatPlainText(emailData.message),
        html: this.formatEmailHTML(emailData.message, emailData.subject, emailData.html, emailData.attachments),
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

      console.log('Attempting to send email to:', recipients.join(', '));
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

  formatPlainText(text) {
    return text
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .trim();
  }

  escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatEmailHTML(text, subject = 'No Subject', extraHtml = null, attachments = []) {
    const safeSubject = this.escapeHtml(subject);
    const brandName = this.escapeHtml(process.env.MAIL_FROM_NAME || 'Quick Mail');
    const senderAddress = this.escapeHtml(process.env.GMAIL_USER || 'your mail service');
    const isHtml = /<(?:p|div|br|strong|em|b|i|u|ul|ol|li|h[1-6])(?:\s|\/?>)/i.test(text);
    const formattedText = isHtml
      ? text
      : text.split(/\r\n|\r|\n/).map(line => this.escapeHtml(line)).join('<br>');
    const attachmentList = attachments?.length
      ? `<div class="attachments">
          <div class="section-label">Attachments <span>${attachments.length}</span></div>
          ${attachments.map(file => `
            <div class="attachment">
              <div class="attachment-icon">&#128206;</div>
              <div class="attachment-details">
                <div class="attachment-name">${this.escapeHtml(file.originalname)}</div>
                <div class="attachment-size">${(Number(file.size || 0) / 1024).toFixed(1)} KB</div>
              </div>
            </div>
          `).join('')}
        </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${safeSubject}</title>
        <style>
          body { margin: 0; padding: 0; background: #f4f7fb; color: #172033; font-family: Arial, Helvetica, sans-serif; }
          .wrapper { width: 100%; padding: 32px 12px; background: #f4f7fb; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background: #fff; border: 1px solid #e6eaf0; border-radius: 14px; overflow: hidden; }
          .topbar { padding: 22px 32px; background: #14213d; }
          .brand { color: #fff; font-size: 18px; font-weight: 700; letter-spacing: .2px; }
          .brand-mark { display: inline-block; width: 28px; height: 28px; margin-right: 9px; border-radius: 8px; background: #4f7cff; color: #fff; text-align: center; line-height: 28px; font-size: 15px; vertical-align: middle; }
          .content { padding: 38px 40px 32px; }
          .eyebrow { margin: 0 0 10px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
          h1 { margin: 0 0 26px; color: #14213d; font-size: 26px; line-height: 1.25; font-weight: 700; overflow-wrap: anywhere; }
          .message { padding: 22px 24px; border: 1px solid #e6eaf0; border-radius: 10px; color: #334155; font-size: 16px; line-height: 1.75; overflow-wrap: anywhere; }
          .custom-content { margin-top: 22px; padding: 20px; border-left: 3px solid #4f7cff; background: #f7f9fc; color: #334155; overflow-wrap: anywhere; }
          .attachments { margin-top: 28px; padding-top: 24px; border-top: 1px solid #e6eaf0; }
          .section-label { margin-bottom: 12px; color: #64748b; font-size: 12px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; }
          .section-label span { display: inline-block; min-width: 18px; margin-left: 4px; border-radius: 10px; background: #e8efff; color: #315dcc; text-align: center; letter-spacing: 0; }
          .attachment { display: inline-flex; width: calc(50% - 7px); box-sizing: border-box; align-items: center; margin: 0 10px 10px 0; padding: 10px; border: 1px solid #e6eaf0; border-radius: 8px; vertical-align: top; }
          .attachment:nth-child(even) { margin-right: 0; }
          .attachment-icon { margin-right: 9px; font-size: 18px; }
          .attachment-details { min-width: 0; }
          .attachment-name { overflow: hidden; color: #334155; font-size: 13px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }
          .attachment-size { margin-top: 3px; color: #94a3b8; font-size: 11px; }
          .footer { padding: 20px 32px; border-top: 1px solid #e6eaf0; background: #fafbfc; color: #94a3b8; font-size: 12px; line-height: 1.5; }
          .footer strong { color: #64748b; }
          @media only screen and (max-width: 600px) {
            .wrapper { padding: 0; }
            .container { border: 0; border-radius: 0; }
            .topbar { padding: 20px; }
            .content { padding: 30px 20px 24px; }
            h1 { font-size: 23px; }
            .attachment { display: flex; width: 100%; margin-right: 0; }
            .footer { padding: 18px 20px; }
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="topbar">
              <div class="brand"><span class="brand-mark">&#9993;</span>${brandName}</div>
            </div>
            <div class="content">
              <p class="eyebrow">A message for you</p>
              <h1>${safeSubject}</h1>
              <div class="message">${formattedText}</div>
              ${extraHtml ? `<div class="custom-content">${extraHtml}</div>` : ''}
              ${attachmentList}
            </div>
            <div class="footer">
              Sent with <strong>${brandName}</strong> from ${senderAddress}. Please reply to this email to contact the sender.
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  formatLegacyEmailHTML(text, subject = 'No Subject', extraHtml = null, attachments = []) {
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
                      <div class="brand-logo">${subject}</div>
                  </div>
                  
                  <div class="email-body">
                      <div class="message-content">
                          ${formattedText}
                      </div>
                      
                      <hr>

                      ${extraHtml ? `<div class="custom-html-container">${extraHtml}</div>` : ''}

                      <hr>
                      
                      ${attachmentList}
                  </div>
                  
                  <div class="email-footer">
                      <p class="footer-text">Sent from ${process.env.GMAIL_USER || 'MERN SMTP'}</p>
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