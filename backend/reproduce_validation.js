require('dotenv').config();
const emailService = require('./services/emailService');

async function testValidation() {
    const badEmail = 'janakshsdfsdf23resthapro@gmail.com';
    console.log(`Testing validation for: ${badEmail}`);

    try {
        await emailService.validateEmailDeeply(badEmail);
        console.log('Validation PASSED (Unexpected for invalid email if strict)');
    } catch (error) {
        console.log('Validation FAILED (Expected):', error.message);
    }
}

testValidation();
