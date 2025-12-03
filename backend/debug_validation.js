const emailValidator = require('deep-email-validator');

async function debug() {
    const email = 'janakshresfsdfadsfdathapro@gmail.com';
    console.log(`Validating ${email}...`);

    try {
        const result = await emailValidator.validate({
            email: email,
            validateRegex: true,
            validateMx: true,
            validateTypo: true,
            validateDisposable: true,
            validateSMTP: true,
        });

        console.log('Validation Result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Validation Error:', error);
    }
}

debug();
