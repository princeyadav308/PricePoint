require('dotenv').config({ path: 'server/.env' });
const Anthropic = require('@anthropic-ai/sdk');

async function checkModel() {
    const client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    try {
        await client.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 20000,
            messages: [{ role: 'user', content: 'Say hello!' }]
        });
        console.log("Success with 20000");
    } catch (err) {
        require('fs').writeFileSync('server/out-err.txt', err.message, 'utf8');
        console.error("Error", err.message);
    }
}
checkModel();
