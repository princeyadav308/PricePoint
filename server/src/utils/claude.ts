import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const generatePricingReport = async (
    pricingResult: any,
    appliedModifiers: any
) => {
    const prompt = `
You are a Tier-1 Pricing Consultant. You write strictly professional, data-driven prose. No emojis.

Based on the following pricing result and active market modifiers, generate an investment-grade analysis.

Pricing Result:
${JSON.stringify(pricingResult, null, 2)}

Active Modifiers:
${JSON.stringify(appliedModifiers, null, 2)}

Return a JSON object with exactly three keys:
- "executiveSummary": 1 paragraph synthesizing the pricing strategy.
- "marketJustification": Explanation of the market gravity and pricing defensibility.
- "defensibility": Why an investor should trust this pricing model.

Do not wrap the JSON in Markdown blocks. Return only a raw JSON string.
`;

    try {
        const response = await anthropic.messages.create({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: 1000,
            temperature: 0.3,
            system: "You are a Tier-1 Pricing Consultant. Always output valid JSON only.",
            messages: [
                { role: 'user', content: prompt }
            ]
        });

        const responseContent = response.content[0];
        const textContent = responseContent.type === 'text' ? responseContent.text : '{}';

        return JSON.parse(textContent);
    } catch (e) {
        console.error('Failed to parse Claude JSON', e);
        return {
            executiveSummary: "An error occurred while generating the executive summary.",
            marketJustification: "Data unavailable.",
            defensibility: "Data unavailable."
        };
    }
};
