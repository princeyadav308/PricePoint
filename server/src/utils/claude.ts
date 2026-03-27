import Anthropic from '@anthropic-ai/sdk';

// Lazy client — initialized on first call to ensure dotenv has loaded
let _client: Anthropic | null = null;
const getClient = () => {
    if (!_client) {
        _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });
    }
    return _client;
};

// ============================================================
// JSON Repair Utility
// High-token Claude outputs occasionally have trailing commas,
// unclosed brackets, or stray text outside the JSON object.
// ============================================================
function repairAndParseJSON(raw: string): any {
    // 1. Extract JSON object from potential surrounding text
    let text = raw.trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    // 2. Try direct parse first (fast path)
    try {
        return JSON.parse(text);
    } catch (_) {
        // Continue to repair
    }

    // 3. Remove trailing commas before } or ]
    text = text.replace(/,\s*([\]}])/g, '$1');

    // 4. Fix unclosed brackets/braces by counting
    const opens = (text.match(/{/g) || []).length;
    const closes = (text.match(/}/g) || []).length;
    if (opens > closes) {
        text += '}'.repeat(opens - closes);
    }
    const openBrackets = (text.match(/\[/g) || []).length;
    const closeBrackets = (text.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
        // Insert missing ] before the final }
        const lastBraceIdx = text.lastIndexOf('}');
        const missing = ']'.repeat(openBrackets - closeBrackets);
        text = text.substring(0, lastBraceIdx) + missing + text.substring(lastBraceIdx);
    }

    // 5. Remove control characters that break JSON
    text = text.replace(/[\x00-\x1F\x7F]/g, (ch) => ch === '\n' || ch === '\t' ? ch : '');

    // 6. Final parse attempt
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("=== CLAUDE RAW RESPONSE (PARSE FAILED) ===");
        console.error(raw);
        console.error("=== END RAW RESPONSE ===");
        throw new Error(`JSON parse failed: ${(e as Error).message}`);
    }
}

// ============================================================
// Unit Economics Cost Parser
// Strips currency symbols (£, ₹, $, €, C$, A$) before parseFloat.
// ============================================================
function parseUECosts(raw: unknown): number {
    let items: Array<{ id?: string; key?: string; value: string }> = [];
    try {
        items = typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : [];
    } catch {
        return 0;
    }
    return items.reduce((sum, item) => {
        if (!item.value || item.value === '__NA__' || item.value === 'NA') return sum;
        const n = parseFloat(String(item.value).replace(/[^0-9.-]+/g, '')) || 0;
        return sum + n;
    }, 0);
}

// ============================================================
// Data Sanitiser
// Replaces __NA__, NA, N/A markers with human-readable "Not provided"
// so Claude doesn't attempt calculations on sentinel strings.
// ============================================================
function sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const json = JSON.stringify(data)
        .replace(/"__NA__"/g, '"Not provided"')
        .replace(/"N\/A"/g, '"Not provided"')
        .replace(/"NA"/g, '"Not provided"');
    return JSON.parse(json);
}

// ============================================================
// Dynamic System Prompt Builder
// Forks on journey type AND report tier for maximum specificity.
// ============================================================
function buildSystemPrompt(journeyType: string, tier: string): string {
    const base = `SYSTEM ROLE: You are a "Strategic Architect" and Senior Pricing Auditor with 20 years of experience at top-tier venture capital firms. You specialize in go-to-market pricing, unit economics, and investor-grade financial narratives.

You are generating a structured, high-density pricing intelligence report for PricePoint. Your analysis must be data-anchored, commercially rigorous, and written in the voice of a trusted board-level advisor.

CRITICAL RULES:
1. Every number you cite must trace back to the provided session data or be clearly labeled as a market benchmark estimate. Focus closely on the Cost Base and Value Multiplier.
2. Never recommend a price outside the Survival—Premium band unless explicitly flagged as an outlier scenario.
3. Write as a trusted advisor: "The data indicates...", "Our analysis suggests...", "Investors will ask...". Avoid generic AI filler.
4. You must return ONLY a valid JSON object with exactly these top-level keys (depending on tier):
   executive_summary, path_to_profitability, leakage_audit, market_intelligence, competitive_benchmarking, pricing_strategy, unit_economics, risk_matrix, investor_narrative, implementation_roadmap.
5. Each key must be present even if data is limited. Never return prose outside the JSON.
6. Never truncate the JSON. If you are running low on space, summarize — do not cut closing braces. Ensure the output parses correctly 100% of the time.`;

    // Journey-specific lens
    const journeyLens = journeyType === 'established_seller' || journeyType === 'price_audit'
        ? `\n\nJOURNEY CONTEXT: This is a PRICING AUDIT for an existing product. Your entire tone must be diagnostic and corrective. Lead with what is broken, why, and the cost of inaction. Prioritize the revenue_leakage_estimate to immediately show the user the "Cost of Inaction". Populate audit_findings fully.`
        : `\n\nJOURNEY CONTEXT: This is a NEW PRODUCT launch pricing analysis. Your tone is opportunity-framing. Lead with market validation, then anchor to the Van Westendorp range. Focus on launch strategy and competitive positioning.`;

    // Tier depth calibration
    let tierLens = '';
    switch (tier) {
        case 'Investor':
            tierLens = `\n\nREPORT DEPTH: INVESTOR GRADE. This is the maximum depth report. You must act as a Senior Partner at McKinsey's Pricing & Commercial Excellence Practice. Include:
- Complete financial scenario modeling (Conservative/Base/Optimistic)
- chart_data arrays with actual calculated numbers for visualizations
- Full investor narrative with pricing thesis, defensibility statement, and comparable companies
- 7-10 item risk matrix with category, severity, probability, and mitigation
- 4-phase implementation roadmap (Foundation, Launch, Optimize, Scale)
- Deep unit economics with LTV:CAC ratios, payback periods, and Rule of 40 scoring
- TAM/SAM/SOM analysis
- Board-room language throughout`;
            break;
        case 'Professional':
            tierLens = `\n\nREPORT DEPTH: FOUNDER READY. Provide a thorough analysis with:
- Full market analysis and unit economics
- Pricing strategy with tier suggestions
- Competitive benchmark table
- 5-7 item risk matrix
- 3-phase implementation roadmap (Launch, Optimize, Scale)
- LTV:CAC commentary and health scoring`;
            break;
        case 'Basic':
        default:
            tierLens = `\n\nREPORT DEPTH: BASIC. Focus on core insights:
- Clear executive summary with pricing verdict
- Survival/Best/Premium price commentary
- Top 3 risks
- 3 actionable next steps
- Be concise and fact-based`;
    }

    const truncationWarning = `\n\nCRITICAL: If approaching token limit, write shorter paragraphs. NEVER truncate closing braces or brackets. Incomplete JSON is worse than brief JSON.`;

    return base + journeyLens + tierLens + truncationWarning;
}

// ============================================================
// Dynamic User Prompt Builder
// Populates only the variables we actually have from session data.
// ============================================================
function buildIntelligenceBlock(intelligenceData: any): string {
    if (!intelligenceData) return '';

    const ci = intelligenceData.competitiveIntelligence;
    const md = intelligenceData.marketDemand;
    const tc = intelligenceData.taxAndCurrency;
    const vwa = intelligenceData.vanWestendorpAlerts;

    let block = `\n═══════════════════════════════════════════════\nAUTO-INTELLIGENCE DATA (VERIFIED MARKET DATA — HIGHER TRUST THAN USER ESTIMATES)\n═══════════════════════════════════════════════\n`;

    if (ci && ci.competitors && ci.competitors.length > 0) {
        const range = ci.marketPriceRange || {};
        block += `\nCOMPETITIVE INTELLIGENCE (scraped from live competitor websites):\nMarket Price Range: $${range.min || 'N/A'} – $${range.max || 'N/A'} (avg: $${range.average || 'N/A'})\nData Source: ${ci.source || 'auto_scraped'} | Scraped: ${ci.scrapedAt || 'recent'}\n\nCompetitor Breakdown:\n${JSON.stringify(ci.competitors, null, 2)}\n`;
    }

    if (md && md.monthlySearchVolume) {
        block += `\nMARKET DEMAND SIGNAL (DataForSEO):\nKeyword: "${md.keyword || 'N/A'}"\nMonthly Search Volume: ${md.monthlySearchVolume}\nCompetition Level: ${md.competitionLevel || 'N/A'}\nCost Per Click: $${md.costPerClick || 0} (commercial intent proxy)\nDemand Signal: ${md.demandSignal || 'N/A'}\n`;
    }

    if (tc) {
        block += `\nTAX & CURRENCY CONTEXT:\nCountry: ${tc.country || 'N/A'} | VAT/GST Rate: ${tc.vatGstRate || 0}%\nBase Currency: ${tc.baseCurrency || 'USD'} | USD Rate: ${tc.usdConversionRate || 1}\n`;
    }

    if (vwa && vwa.length > 0) {
        block += `\nVAN WESTENDORP VALIDATION ALERTS:\n${JSON.stringify(vwa, null, 2)}\n`;
    }

    block += `\n───────────────────────────────────────────────\nCRITICAL INSTRUCTION FOR AUTO-INTELLIGENCE DATA:\nWhen the above market data is present (source = "auto_scraped" or "dataforseo"),\ntreat it as verified external data — more reliable than the user's own estimates.\nCross-reference all your analysis against this market reality.\nIf user assumptions conflict with market data, flag this explicitly as a\n"Market Reality Gap" finding. For example:\n- If the user's target price is above the market max → flag premium positioning risk\n- If user's volume assumptions imply market share >15% in year 1 → flag as aggressive\n- If user's CAC estimate is below industry CPC benchmarks → flag as likely underestimated\n───────────────────────────────────────────────\n`;

    return block;
}

function buildUserPrompt(
    sessionData: any,
    pricingResult: any,
    appliedModifiers: any,
    journeyType: string,
    tier: string,
    intelligenceData?: any,
    investorSubTier?: 'narrative' | 'data',
    narrativeContext?: any
): string {
    // Sanitise all __NA__ / NA / N/A values before prompt injection
    const sd = sanitize(sessionData || {}) as any;

    // Extract currency from session data
    const currencyLabel = sd?.answers?.currency?.value || sd?.currency || 'USD ($)';
    const currencyCode = typeof currencyLabel === 'string' ? currencyLabel.split(' ')[0] : 'USD';
    const currencySymbolMap: Record<string, string> = {
        'USD ($)': '$', 'EUR (€)': '€', 'GBP (£)': '£',
        'INR (₹)': '₹', 'CAD (C$)': 'C$', 'AUD (A$)': 'A$',
    };
    const cs = currencySymbolMap[currencyLabel] || '$';

    // Pre-process unit economics — parse raw JSON arrays into clean totals
    let totalUECost = 0;
    ['ue_physical', 'ue_service', 'ue_digital'].forEach(key => {
        const rawValue = sd?.answers?.[key]?.value;
        if (rawValue) {
            totalUECost += parseUECosts(rawValue);
        }
    });

    const vw = pricingResult?.analysis?.vanWestendorp || {};

    // Determine the output schema instructions based on tier
    let schemaInstruction = '';

    if (tier === 'Basic') {
        schemaInstruction = `
Return a JSON object with exactly these keys:
{
  "report_meta": { "journey_type": string, "tier": "basic", "one_line_verdict": string (max 25 words) },
  "executive_summary": { "headline": string, "summary": string (3 paragraphs), "pricing_verdict": { "recommended_price": number, "recommended_model": string, "confidence_level": "High"|"Medium"|"Low", "confidence_rationale": string } },
  "pricing_analysis": { "survival_commentary": string, "best_price_commentary": string, "premium_price_commentary": string, "recommended_anchor": "survival"|"best"|"premium", "anchor_rationale": string },
  "top_risks": [ { "risk": string, "severity": "High"|"Medium"|"Low", "mitigation": string } ] (3 max),
  "next_steps": [ string ] (3 actionable steps)
}`;
    } else if (tier === 'Professional') {
        schemaInstruction = `
Return a JSON object with exactly these keys:
{
  "report_meta": { "journey_type": string, "tier": "founder_ready", "one_line_verdict": string },
  "executive_summary": { "headline": string, "summary": string (4 paragraphs), "pricing_verdict": { "recommended_price": number, "recommended_model": string, "confidence_level": string, "confidence_rationale": string, "price_range_floor": number, "price_range_ceiling": number } },
  "market_analysis": { "market_narrative": string (2 paragraphs), "competitive_landscape": string (2 paragraphs), "positioning_recommendation": string, "willingness_to_pay_analysis": string (reference Van Westendorp) },
  "unit_economics": { "narrative": string (2 paragraphs), "gross_margin_analysis": string, "estimated_ltv": number, "estimated_ltv_cac_ratio": number, "payback_period_months": number, "health_score": "Strong"|"Acceptable"|"Needs Attention"|"Critical", "health_rationale": string },
  "pricing_strategy": { "strategy_narrative": string, "recommended_model": string, "pricing_tiers_suggestion": [ { "tier_name": string, "price": number, "target_segment": string, "key_value_prop": string } ], "launch_price_recommendation": number, "launch_price_rationale": string },
  "competitive_positioning": { "narrative": string, "position": "Price Leader"|"Value Player"|"Premium"|"Ultra Premium", "benchmark_table": [ { "competitor": string, "estimated_price": string, "positioning": string, "your_advantage": string } ] },
  "risk_matrix": [ { "risk": string, "category": "Market"|"Competitive"|"Execution"|"Financial"|"Product", "severity": string, "probability": string, "mitigation": string } ] (5-7 risks),
  "implementation_roadmap": { "narrative": string, "phases": [ { "phase": number, "title": string, "duration": string, "key_actions": [string], "success_metric": string } ] (3 phases) },
  "next_steps": [ string ] (5 actions)
}`;
    } else {
        // Investor Grade
        if (investorSubTier === 'narrative') {
            schemaInstruction = `
Return a JSON object with exactly these keys:
{
  "report_meta": { "journey_type": string, "tier": "investor_grade", "one_line_verdict": string, "report_thesis": string (2-3 sentence thesis) },
  "executive_summary": { "headline": string, "summary": string (5 paragraphs, board-room language), "pricing_verdict": { "recommended_price": number, "recommended_model": string, "confidence_level": string, "confidence_rationale": string, "price_range_floor": number, "price_range_ceiling": number, "upside_scenario_price": number, "downside_scenario_price": number }, "key_findings": [string] (5 bullets) },
  "market_analysis": { "market_narrative": string (3 paragraphs), "tam_analysis": string, "willingness_to_pay_analysis": string (deep Van Westendorp), "price_sensitivity_narrative": string, "competitive_landscape": string (3 paragraphs) },
  "pricing_strategy": { "strategy_narrative": string (4 paragraphs), "recommended_model": string, "pricing_tiers_suggestion": [ { "tier_name": string, "price": number, "target_segment": string, "key_value_prop": string, "expected_conversion_rate": string } ], "launch_price_recommendation": number, "launch_price_rationale": string, "expansion_price_path": string, "packaging_recommendation": string },
  "competitive_positioning": { "narrative": string (3 paragraphs), "position": string, "competitive_moat_assessment": string, "moat_durability": "Strong"|"Moderate"|"Weak", "benchmark_table": [ { "competitor": string, "estimated_price": string, "pricing_model": string, "positioning": string, "your_advantage": string, "threat_level": string } ], "white_space_opportunity": string },
  "investor_narrative": { "pricing_thesis": string (3 paragraphs), "defensibility_statement": string, "growth_lever_analysis": string, "comparable_companies": [ { "company": string, "pricing_model": string, "key_lesson": string } ], "red_flags_to_address": [string], "investor_questions_to_prepare": [string] },
  "next_steps": [string] (7 actions with timeframes)
}`;
        } else {
            schemaInstruction = `
Return a JSON object with exactly these keys:
{
  "unit_economics": { "narrative": string (3 paragraphs), "gross_margin_analysis": string, "estimated_ltv": number, "estimated_ltv_cac_ratio": number, "payback_period_months": number, "breakeven_units": number, "health_score": string, "health_rationale": string, "investor_lens_commentary": string },
  "financial_scenarios": { "narrative": string, "scenarios": [ { "name": "Conservative"|"Base Case"|"Optimistic", "price_point": number, "mrr_month_6": number, "mrr_month_12": number, "arr_year_1": number, "key_assumption": string } ] },
  "chart_data": {
    "price_range_bar": { "labels": ["Survival","PMC","OPP","Best Price","IPP","Premium","PME"], "values": [number x7], "description": string },
    "revenue_projection_12m": { "labels": ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"], "conservative": [number x12], "base_case": [number x12], "optimistic": [number x12], "description": string },
    "ltv_cac_waterfall": { "labels": ["CAC","Gross Margin/Mo","Payback Period","LTV"], "values": [number x4], "description": string }
  },
  "risk_matrix": [ { "risk": string, "category": string, "severity": string, "probability": string, "impact": string, "mitigation": string, "timeline": string } ] (7-10 risks),
  "implementation_roadmap": { "narrative": string, "phases": [ { "phase": number, "title": string, "duration": string, "key_actions": [string], "success_metric": string, "pricing_milestone": string } ] (4 phases) },
  "audit_findings": ${journeyType === 'established_seller' || journeyType === 'price_audit'
                ? '{ "current_price_assessment": string, "pricing_health_score": number (0-100), "revenue_leakage_estimate": string, "quick_wins": [string], "structural_changes": [string], "recommended_price_change": string }'
                : 'null (not applicable for new product launch)'}
}`;
        }
    }

    const maxTokenNote = tier === 'Investor' ? 8000 : tier === 'Professional' ? 14000 : 8000;

    // Stringify sanitised session data
    const sessionDataString = JSON.stringify(sd, null, 2);

    const narrativeContextBlock = narrativeContext ? `
═══════════════════════════════════════════════
PART 1 NARRATIVE CONTEXT (FOR CONSISTENCY)
═══════════════════════════════════════════════
Maintain absolute consistency with these previously generated findings:
${JSON.stringify(narrativeContext, null, 2)}
` : '';

    return `You are performing a pricing intelligence audit for a client. Below is the COMPLETE dataset.

Currency: ${currencyCode} (${cs}). All prices in this report are in ${currencyCode}.

═══════════════════════════════════════════════
JOURNEY TYPE: ${journeyType === 'established_seller' ? 'price_audit' : 'new_product'}
REPORT TIER: ${tier === 'Investor' ? 'investor_grade' : tier === 'Professional' ? 'founder_ready' : 'basic'}
═══════════════════════════════════════════════

═══════════════════════════════════════════════
PRICEPOINT ENGINE OUTPUTS (treat these as ground truth)
═══════════════════════════════════════════════
Survival Price (floor): ${cs}${pricingResult?.budget ?? 0} ${currencyCode}
Best Price (optimal): ${cs}${pricingResult?.recommended ?? 0} ${currencyCode}
Premium Price (ceiling): ${cs}${pricingResult?.premium ?? 0} ${currencyCode}

Van Westendorp Outputs:
  - Point of Marginal Cheapness (PMC): ${cs}${vw.pmc ?? vw.floor ?? 0} ${currencyCode}
  - Optimal Price Point (OPP): ${cs}${vw.opp ?? 0} ${currencyCode}
  - Indifference Price Point (IPP): ${cs}${vw.ipp ?? 0} ${currencyCode}
  - Point of Marginal Expensiveness (PME): ${cs}${vw.pme ?? vw.ceiling ?? 0} ${currencyCode}
  - Acceptable Price Range: ${cs}${vw.pmc ?? vw.floor ?? 0} — ${cs}${vw.pme ?? vw.ceiling ?? 0} ${currencyCode}

Cost-Plus Base: ${cs}${pricingResult?.analysis?.costPlusBase ?? 0} ${currencyCode}
Value Multiplier: ${pricingResult?.analysis?.valueMultiplier ?? 1}x
Total Unit Cost: ${cs}${totalUECost > 0 ? totalUECost : (pricingResult?.analysis?.totalUnitCost ?? 0)} ${currencyCode}

═══════════════════════════════════════════════
APPLIED MARKET MODIFIERS:
═══════════════════════════════════════════════
${JSON.stringify(appliedModifiers || [], null, 2)}

═══════════════════════════════════════════════
FULL SESSION DATA (All Questions & Answers):
═══════════════════════════════════════════════
${sessionDataString}
${narrativeContextBlock}
═══════════════════════════════════════════════
OUTPUT INSTRUCTIONS
═══════════════════════════════════════════════
${schemaInstruction}

IMPORTANT: The chart_data arrays (investor_grade only) must contain real calculated numbers based on the provided unit economics. Revenue projections should use the recommended price and an assumed customer growth curve you derive from the data.
${buildIntelligenceBlock(intelligenceData)}
Do not wrap the JSON in Markdown blocks or code fences. Return ONLY the raw JSON object.`;
}

// ============================================================
// Main Export: generatePricingReport
// ============================================================
export const generatePricingReport = async (
    sessionData: any,
    pricingResult: any,
    appliedModifiers: any,
    tier: string = 'Basic',
    journeyType: string = 'new_launcher',
    intelligenceData?: any
) => {
    const generateStream = (systemPromptText: string, userPromptText: string, maxTokensAllocated: number) => new Promise<string>(async (resolve, reject) => {
        const timeoutMs = parseInt(process.env.CLAUDE_TIMEOUT_MS || '300000');
        let timer: NodeJS.Timeout | undefined;
        const resetTimer = () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => reject(new Error('Report generation timed out (idle)')), timeoutMs);
        };

        try {
            resetTimer(); // Start initial timer
            const stream = await getClient().messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: maxTokensAllocated,
                temperature: 0.3,
                system: systemPromptText,
                messages: [
                    { role: 'user', content: userPromptText }
                ],
                stream: true,
            });

            let fullText = '';
            for await (const chunk of stream) {
                resetTimer(); // Reset timer on every chunk received!
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                    fullText += chunk.delta.text;
                }
            }
            clearTimeout(timer);
            resolve(fullText);
        } catch (err) {
            clearTimeout(timer);
            reject(err);
        }
    });

    try {
        if (tier === 'Investor') {
            console.log(`[Claude] Generating Investor Grade Call 1: Narrative`);
            const maxTokens = 8000;
            const systemPrompt = buildSystemPrompt(journeyType, tier);
            
            const userPrompt1 = buildUserPrompt(sessionData, pricingResult, appliedModifiers, journeyType, tier, intelligenceData, 'narrative');
            const text1 = await generateStream(systemPrompt, userPrompt1, maxTokens);
            const narrativeResult = repairAndParseJSON(text1);

            console.log(`[Claude] Generating Investor Grade Call 2: Data`);
            const narrativeContext = {
                executive_summary: narrativeResult?.executive_summary,
                pricing_verdict: narrativeResult?.executive_summary?.pricing_verdict,
            };
            const userPrompt2 = buildUserPrompt(sessionData, pricingResult, appliedModifiers, journeyType, tier, intelligenceData, 'data', narrativeContext);
            const text2 = await generateStream(systemPrompt, userPrompt2, maxTokens);
            const dataResult = repairAndParseJSON(text2);

            const finalReport = { ...narrativeResult, ...dataResult };
            return finalReport;
        } else {
            const maxTokens = tier === 'Professional' ? 14000 : 8000;
            console.log(`[Claude] Generating ${tier} report for journey: ${journeyType} (max_tokens: ${maxTokens})`);
            const systemPrompt = buildSystemPrompt(journeyType, tier);
            const userPrompt = buildUserPrompt(sessionData, pricingResult, appliedModifiers, journeyType, tier, intelligenceData);
            
            const textContent = await generateStream(systemPrompt, userPrompt, maxTokens);

            console.log('[Claude RAW RESPONSE LENGTH]', textContent.length);
            console.log('[Claude RAW RESPONSE TAIL]', textContent.slice(-500));

            return repairAndParseJSON(textContent);
        }
    } catch (e) {
        console.error('Claude API Error:', e);
        // Return tier-appropriate fallback
        if (tier === 'Basic') {
            return {
                report_meta: { journey_type: journeyType, tier: 'basic', one_line_verdict: 'Report generation failed — please retry.' },
                executive_summary: { headline: 'Report Unavailable', summary: 'An error occurred while generating the executive summary. Please retry.', pricing_verdict: { recommended_price: 0, recommended_model: 'N/A', confidence_level: 'Low', confidence_rationale: 'Generation error' } },
                pricing_analysis: { survival_commentary: 'Data unavailable.', best_price_commentary: 'Data unavailable.', premium_price_commentary: 'Data unavailable.', recommended_anchor: 'best', anchor_rationale: 'Error occurred.' },
                top_risks: [{ risk: 'Report generation failed', severity: 'High', mitigation: 'Retry generation' }],
                next_steps: ['Retry report generation', 'Contact support if issue persists']
            };
        }
        // Professional / Investor fallback
        return {
            report_meta: { journey_type: journeyType, tier: tier === 'Investor' ? 'investor_grade' : 'founder_ready', one_line_verdict: 'Report generation failed — please retry.' },
            executive_summary: { headline: 'Report Unavailable', summary: 'An error occurred. Please retry.', pricing_verdict: { recommended_price: 0, recommended_model: 'N/A', confidence_level: 'Low', confidence_rationale: 'Generation error' } },
            market_analysis: { market_narrative: 'Data unavailable.', competitive_landscape: 'Data unavailable.' },
            pricing_strategy: { strategy_narrative: 'Data unavailable.' },
            risk_matrix: [{ risk: 'Report generation failed', severity: 'High', probability: 'High', mitigation: 'Retry' }],
            next_steps: ['Retry report generation']
        };
    }
};
