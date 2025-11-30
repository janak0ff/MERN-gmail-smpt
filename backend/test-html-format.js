const emailService = require('./services/emailService');

function testFormatting() {
    console.log('--- Testing formatPlainTextToHTML ---');

    // Test 1: Plain Text
    const plainText = "Hello\nWorld";
    const formattedPlain = emailService.formatPlainTextToHTML(plainText);
    console.log('\n1. Plain Text Input:');
    console.log(JSON.stringify(plainText));
    console.log('Output contains <br>?', formattedPlain.includes('Hello<br>World'));

    // Test 2: HTML Input
    const htmlText = "<div>Hello</div><div>World</div>";
    const formattedHtml = emailService.formatPlainTextToHTML(htmlText);
    console.log('\n2. HTML Input:');
    console.log(JSON.stringify(htmlText));
    console.log('Output matches input (inside template)?', formattedHtml.includes(htmlText));
    console.log('Output contains <br>?', formattedHtml.includes('<br>'));

    // Test 3: Mixed (Edge case)
    const mixedText = "<b>Bold</b>\nNew line";
    const formattedMixed = emailService.formatPlainTextToHTML(mixedText);
    console.log('\n3. Mixed Input (HTML tag present):');
    console.log(JSON.stringify(mixedText));
    console.log('Treated as HTML (no <br>)?', !formattedMixed.includes('<br>'));
}

testFormatting();
