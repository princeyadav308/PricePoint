require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

async function testTokens() {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    try {
        const response = await client.messages.create({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 20000,
            messages: [{ role: 'user', content: 'hello' }]
        });
        console.log("Success! Tokens:", response.content);
    } catch (err) {
        console.error("SDK Error details:", err.status, err.message);
    }
}
testTokens();
