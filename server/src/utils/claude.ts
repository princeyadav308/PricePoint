import Anthropic from '@anthropic-ai/sdk';

// Lazy client — initialized on first call to ensure dotenv has loaded
let _client: Anthropic | null = null;
const getClient = () => {
    if (!_client) {
        _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
    }
    return _client;
};

/**
 * McKinsey-Grade Pricing Intelligence Report Generator
 * 
 * Accepts the FULL sessionData object (all Q&A, pricing result, modifiers)
 * and produces a dense, investment-grade JSON analysis.
 */
export const generatePricingReport = async (
    sessionData: any,
    pricingResult: any,
    appliedModifiers: any,
    tier: string = 'Basic'
) => {
    // ── System Prompt Factory ─────────────────────────────────
    const getSystemPrompt = (level: string) => {
        const base = `Act as a McKinsey Pricing Auditor. You write strictly professional, data-driven prose. No emojis. No marketing fluff. Always output valid JSON only. Do not wrap the JSON in Markdown blocks or code fences.

Use the provided user data to perform a comparative market analysis. Reference specific industry benchmarks for the user's sector. Your output must be data-backed and analytical, not marketing-focused.

CRITICAL: You have access to our proprietary algorithm's internal calculations. When discussing pricing defensibility, you MUST reference the "Value Multiplier" (a 1.2x–2.0x score derived from USP strength, retention rate, brand recognition, and willingness-to-pay premium) and any "Saturation Penalty" or "Blue Ocean Bonus" that was triggered. Show the AI "knows" our algorithm by citing these specific variables.`;

        switch (level) {
            case 'Investor':
                return base + `

You must act as a Senior Partner at McKinsey's Pricing & Commercial Excellence Practice. Your analysis must be extremely dense and rigorous:
- Reference the exact Value Multiplier score and explain what drove it higher or lower
- If a Saturation Penalty (HIGH_SATURATION modifier) was applied, quantify its impact on margin compression
- If a Blue Ocean Bonus was applied, justify the premium expansion
- Include specific competitor gravity calculations with the 70/30 weighted blend formula
- Provide a 90-day Implementation Roadmap with weekly milestones
- Every claim must be backed by the user's actual data points`;
            case 'Professional':
                return base + `

You must act as a Senior Analyst. Provide a thorough 20-page equivalent analysis. Synthesize competitors into a positioning strategy. Reference the Value Multiplier and any applied market modifiers.`;
            case 'Basic':
            default:
                return base + `

Focus on core math and methodology. Be concise and fact-based. Still reference Value Multiplier and any modifiers applied.`;
        }
    };

    const maxTokens = tier === 'Investor' ? 8000 : tier === 'Professional' ? 4000 : 2000;

    // ── Build the Full Data Payload ───────────────────────────
    const prompt = `
You are performing a pricing intelligence audit for a client. Below is the COMPLETE dataset from their assessment session, including every question they answered, their pricing calculations, and the algorithmic modifiers that were applied.

═══════════════════════════════════════════════
FULL SESSION DATA (All Questions & Answers):
═══════════════════════════════════════════════
${JSON.stringify(sessionData, null, 2)}

═══════════════════════════════════════════════
PRICING ENGINE OUTPUT (Our Algorithm's Result):
═══════════════════════════════════════════════
${JSON.stringify(pricingResult, null, 2)}

═══════════════════════════════════════════════
APPLIED MARKET MODIFIERS:
═══════════════════════════════════════════════
${JSON.stringify(appliedModifiers, null, 2)}

Based on ALL of the above data, generate an investment-grade pricing analysis.

Return a JSON object with exactly these 7 keys:

1. "executiveSummary": A dense 2-3 paragraph executive summary synthesizing the COMPLETE pricing strategy. Reference the user's specific product type, their market position, and the final price trinity (Budget/Recommended/Premium). This should read like a McKinsey executive brief.

2. "marketAnalysis": A detailed competitive market analysis. Reference the user's industry sector, competitor count, competitor pricing, and how market gravity influenced the final Optimal Price Point. If competitor data was provided, explicitly show how the 70/30 weighted average adjusted the OPP.

3. "competitivePositioning": Explain where this product sits in its competitive landscape. Reference the user's brand recognition level, USP strength score, and retention rate to justify the positioning. Include specific data points from their session.

4. "pricingDefensibility": WHY an investor should trust this pricing model. MUST reference: (a) the exact Value Multiplier calculated (e.g., "1.47x") and what factors drove it, (b) whether a Saturation Penalty or Blue Ocean Bonus was triggered and its quantitative impact, (c) the Van Westendorp floor/ceiling validation, and (d) the Margin Protection rule if it fired.

5. "riskFactors": Identify 3-5 specific risks based on the user's actual data. For example, if their USP score is low, flag commoditization risk. If their retention rate is below 50%, flag churn impact on unit economics.

6. "implementationRoadmap": A structured 90-day rollout plan with 3 phases (Days 1-30, 31-60, 61-90). Each phase should have 3-4 specific action items tied to the user's product type and market.

7. "methodology": A technical summary of the mathematical models used: Van Westendorp 4-line intersection, Cost-Plus with margin/tax layering, Value-Based Multiplier scoring, and Market Modifier adjustments.

Do not wrap the JSON in Markdown blocks. Return only a raw JSON string.
`;

    try {
        const response = await getClient().messages.create({
            model: 'claude-3-5-sonnet-latest',
            max_tokens: maxTokens,
            temperature: 0.3,
            system: getSystemPrompt(tier),
            messages: [
                { role: 'user', content: prompt }
            ]
        });

        const responseContent = response.content[0];
        const textContent = responseContent.type === 'text' ? responseContent.text : '{}';

        return JSON.parse(textContent);
    } catch (e) {
        console.error('Claude API Error:', e);
        return {
            executiveSummary: "An error occurred while generating the executive summary. Please retry.",
            marketAnalysis: "Data unavailable due to generation error.",
            competitivePositioning: "Data unavailable due to generation error.",
            pricingDefensibility: "Data unavailable due to generation error.",
            riskFactors: "Data unavailable due to generation error.",
            implementationRoadmap: "Data unavailable due to generation error.",
            methodology: "This report uses Van Westendorp Price Sensitivity Modeling, Cost-Plus Calculation with margin and tax layering, Value-Based Multiplier scoring (1.2x–2.0x), and Market Modifier adjustments including Blue Ocean Bonus and Saturation Penalty."
        };
    }
};
