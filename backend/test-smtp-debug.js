require('dotenv').config();
const nodemailer = require('nodemailer');

async function testSMTP() {
    console.log('--- SMTP Debug Script ---');

    // 1. Check Environment Variables
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    console.log('Environment Variables Check:');
    console.log(`GMAIL_USER: ${user ? 'Set (' + user + ')' : 'MISSING ❌'}`);
    console.log(`GMAIL_APP_PASSWORD: ${pass ? 'Set (Length: ' + pass.length + ')' : 'MISSING ❌'}`);

    if (!user || !pass) {
        console.error('❌ Missing credentials in .env file');
        return;
    }

    // 2. Configure Transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: user,
            pass: pass
        }
    });

    // 3. Verify Connection
    console.log('\nVerifying SMTP Connection...');
    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful!');
    } catch (error) {
        console.error('❌ SMTP Connection Failed:');
        console.error('Error Code:', error.code);
        console.error('Error Message:', error.message);

        if (error.code === 'EAUTH') {
            console.log('\nPossible Causes:');
            console.log('1. Invalid Email or App Password');
            console.log('2. Two-Factor Authentication is not enabled (required for App Passwords)');
            console.log('3. You are using your login password instead of an App Password');
        }
        return;
    }

    // 4. Send Test Email
    console.log('\nSending Test Email to self...');
    try {
        const info = await transporter.sendMail({
            from: user,
            to: user,
            subject: 'SMTP Debug Test',
            text: 'If you receive this, your SMTP configuration is working perfectly!'
        });
        console.log('✅ Test Email Sent!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ Sending Failed:', error.message);
    }
}

testSMTP();
