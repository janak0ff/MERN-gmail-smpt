const emailService = require('./services/emailService');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

async function testEmail() {
    console.log('🧪 Starting Email Test...');

    try {
        // Wait for service to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        const htmlContent = `
      <p>Choose your favorite Web language:</p>
      <form>
        <input type="radio" id="html" name="fav_language" value="HTML">
        <label for="html">HTML</label><br>
        <input type="radio" id="css" name="fav_language" value="CSS">
        <label for="css">CSS</label><br>
        <input type="radio" id="javascript" name="fav_language" value="JavaScript">
        <label for="javascript">JavaScript</label>
      </form>
    `;

        console.log('📧 Sending test email...');
        const result = await emailService.sendEmail({
            to: process.env.GMAIL_USER, // Send to self
            subject: 'Test Email with HTML Form',
            message: 'This is a test email with HTML content.',
            html: htmlContent
        });

        console.log('✅ Email sent successfully:', result);
    } catch (error) {
        console.error('❌ Test failed:', error);
    }

    process.exit(0);
}

testEmail();
