const emailValidator = require('deep-email-validator');

async function validateEmailDeeply(email) {
    try {
        console.log(`Validating email: "${email}"`);
        const { valid, reason, validators } = await emailValidator.validate({
            email: email,
            validateRegex: true,
            validateMx: true,
            validateTypo: true,
            validateDisposable: true,
            validateSMTP: false,
        });

        if (!valid) {
            console.error('Deep validation failed:', reason);
            if (validators[reason]) {
                console.error('Details:', validators[reason]);
            }
            return false;
        }
        console.log('Deep validation passed');
        return true;
    } catch (error) {
        console.error('Deep validation error:', error.message);
        return true; // Fail open
    }
}

async function testValidation(to, subject, message) {
    console.log('\n--- Testing Input ---');
    console.log('Original To:', to);

    // 1. Sanitization
    let sanitizedTo = to;
    if (typeof to === 'string') {
        sanitizedTo = to.replace(/<[^>]*>/g, '').trim();
    }
    console.log('Sanitized To:', sanitizedTo);

    // 2. Basic Validation
    if (!sanitizedTo || !subject || !message) {
        console.error('❌ Failed: Missing fields');
        return;
    }

    // 3. Regex Validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(sanitizedTo)) {
        console.error(`❌ Failed: Regex validation failed for "${sanitizedTo}"`);
        return;
    }
    console.log('Regex validation passed');

    // 4. Deep Validation
    await validateEmailDeeply(sanitizedTo);
}

async function runTests() {
    // Test 1: Clean email
    await testValidation('test@example.com', 'Subject', 'Message');

    // Test 2: Email with HTML tags (simulating the bug)
    await testValidation('test@example.com<div></div>', 'Subject', 'Message');

    // Test 3: Email with complex HTML
    await testValidation('robbieinvisible@comfythings.com<div><ol><li>test</li></ol></div>', 'Subject', 'Message');

    // Test 4: Invalid email
    await testValidation('invalid-email', 'Subject', 'Message');

    // Test 5: Empty message
    await testValidation('test@example.com', 'Subject', '');
}

runTests();
