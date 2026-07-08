const Anthropic = require('@anthropic-ai/sdk');
async function test() {
    try {
        const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const models = ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-2.1', 'claude-3-opus-20240229'];
        for (const model of models) {
            console.log('Testing', model);
            try {
                const extraction = await claude.messages.create({
                    model: model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'hi' }]
                });
                console.log('Success!', model);
            } catch(err) {
                console.log('Failed:', err.message);
            }
        }
    } catch(err) {
        console.error('ERROR:', err);
    }
}
test();
