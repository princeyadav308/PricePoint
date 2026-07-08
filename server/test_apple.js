const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const url = 'https://www.apple.com/apple-watch-series-11/';

async function test() {
    try {
        console.log('Testing Scrapingdog...');
        try {
            const sdResp = await axios.get('https://api.scrapingdog.com/scrape', {
                params: {
                    api_key: process.env.SCRAPINGDOG_API_KEY,
                    url: url,
                    dynamic: 'false'
                },
                timeout: 20000
            });
            console.log('Scrapingdog ok, length:', JSON.stringify(sdResp.data).length);
            if (typeof sdResp.data === 'object' && sdResp.data.success === false) {
                 console.log('Scrapingdog explicitly failed:', sdResp.data.message);
            }
        } catch (e) {
            console.log('Scrapingdog failed:', e.message);
        }

        console.log('Testing direct fetch...');
        const fetchResp = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            }
        });
        if (!fetchResp.ok) throw new Error('Direct fetch failed: ' + fetchResp.status);
        const html = await fetchResp.text();
        console.log('Direct fetch success, HTML length:', html.length);
        
        const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        console.log('Testing Claude...');
        const extraction = await claude.messages.create({
            model: 'claude-3-5-sonnet-20240620',
            max_tokens: 1000,
            temperature: 0,
            messages: [{
                role: 'user',
                content: 'Extract JSON from this HTML. ' + html.substring(0, 15000)
            }]
        });
        console.log('Claude response:', extraction.content[0].text);
    } catch(err) {
        console.error('ERROR:', err);
    }
}
test();
