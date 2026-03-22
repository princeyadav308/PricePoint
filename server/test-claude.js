const fs = require('fs');


async function testClaudeAPI() {
    require('dotenv').config();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.error('No API key found in .env');
        return;
    }

    try {
        console.log('Testing Claude API...');
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1024,
                messages: [
                    { role: 'user', content: 'Say hello world!' }
                ]
            })
        });

        const data = await response.json();
        fs.writeFileSync('response.json', JSON.stringify(data, null, 2), 'utf-8');
        console.log('Response written to response.json');
    } catch (err) {
        console.error('Error during API call:', err);
    }
}

testClaudeAPI();
