require('dotenv').config();
const emailService = require('./services/emailService');

// Ensure validation is enabled
process.env.SKIP_DEEP_VALIDATION = 'false';

async function test() {
    console.log('Testing Email Service with Fail-Open Logic...');

    try {
        // Wait for service to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 1: Invalid User (Should Fail)
        console.log('\n--- Test 1: Invalid User ---');
        const randomUser = `non-existent-user-${Date.now()}@gmail.com`;
        const result1 = await emailService.sendEmail({
            to: randomUser,
            subject: 'Test Subject',
            message: 'Test Message'
        });
        console.log('Result 1 (Should be failure):', result1.success === false ? 'SUCCESS (Caught)' : 'FAILURE (Not Caught)');

        // Test 2: Valid User (Should Succeed, even if SMTP times out)
        console.log('\n--- Test 2: Valid User (robbieinvisible@comfythings.com) ---');
        const result2 = await emailService.sendEmail({
            to: 'robbieinvisible@comfythings.com',
            subject: 'Test Subject',
            message: 'Test Message'
        });
        console.log('Result 2 (Should be success):', result2.success === true ? 'SUCCESS (Sent)' : `FAILURE (Error: ${result2.error})`);

    } catch (error) {
        console.error('Caught Unexpected Error:', error);
    }
}

test();
