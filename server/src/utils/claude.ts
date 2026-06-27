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
            tierLens = `\n\nREPORT DEPTH: INVESTOR GRADE (32-38 pages). This is the maximum depth report. You must act as a Senior Partner at McKinsey's Pricing & Commercial Excellence Practice. Include:
- 2-page investment thesis (long-form narrative justifying the pricing strategy for investors)
- Key findings summary (5 distinct strategic bullets)
- Complete financial scenario modeling (Conservative/Base/Optimistic)
- chart_data arrays with actual calculated numbers for visualizations
- Market timing assessment (why now is the right time)
- Feature-to-price mapping (which features drive price perception)
- Competitive moat assessment with durability rating
- Full investor narrative with pricing thesis, defensibility statement, and comparable companies with pricing details
- Packaging recommendation (bundle strategy, tier structure rationale)
- Price increase strategy with 12-month timeline
- Margin erosion audit (leakage sources, annual impact, fixes)
- Rule of 40 scoring (growth rate + profit margin)
- 7-10 item risk matrix with category, severity, probability, impact, and mitigation
- 4-phase implementation roadmap (Foundation, Launch, Optimize, Scale) covering 18 months
- Investor questions to prepare for (5-7 with prepared answers)
- Glossary of 20-25 pricing terms
- TAM/SAM/SOM analysis
- Board-room language throughout`;
            break;
        case 'Professional':
            tierLens = `\n\nREPORT DEPTH: FOUNDER READY (18-22 pages). Provide a thorough analysis with:
- Strategic verdict card (headline verdict, body explanation, confidence badge)
- Full market analysis with TAM/SAM narrative and positioning map data
- Competitive benchmark table (5 rows minimum)
- Unit economics with LTV:CAC ratios, payback periods, and health scoring
- Pricing strategy with tier suggestions and launch vs. scale pricing path
- Cost of inaction calculation (bold headline number, calculation, narrative)
- 90-day monitoring plan with 3 specific metrics, targets, warning thresholds, and action triggers
- Revenue scenario table (Conservative/Base/Optimistic with MRR, ARR, Gross Profit, Implied CAC)
- 5-7 item risk matrix with category, severity, probability, and mitigation
- 3-phase implementation roadmap (Launch, Optimize, Scale)
- Write substantial paragraphs — this report must fill 18-22 pages`;
            break;
        case 'Basic':
        default:
            tierLens = `\n\nREPORT DEPTH: STARTER (8-10 pages). Focus on core insights with enough detail to fill 8-10 pages:
- Clear executive summary with pricing verdict (1 full page)
- Van Westendorp interpretation (explain what the PSM chart means for their product)
- Cost breakdown narrative (analyze their unit cost structure and gross margin)
- Survival/Best/Premium price commentary (substantial paragraphs, not bullet points)
- Breakeven analysis context
- Top 3 risks with detailed mitigations
- 5 actionable next steps (numbered, with specific actions)
- Cost of inaction (one bold sentence showing the revenue gap between entry and optimal pricing)
- Write in advisory tone, not bullet points. Each section should be 2-3 paragraphs minimum.`;
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

    // ── Duck-type: support BOTH old shape and new frontend shape ──
    // Old shape: { competitiveIntelligence, marketDemand, taxAndCurrency, vanWestendorpAlerts }
    // New shape: { geo, preFill, competitors, competitorPricing, marketPriceRange, demand, vwAlerts }

    // Competitors + Pricing
    const competitors = intelligenceData.competitors
        || intelligenceData.competitiveIntelligence?.competitors
        || [];
    const competitorPricing = intelligenceData.competitorPricing || [];
    const marketPriceRange = intelligenceData.marketPriceRange
        || intelligenceData.competitiveIntelligence?.marketPriceRange
        || null;

    // Demand
    const demand = intelligenceData.demand
        || intelligenceData.marketDemand
        || null;

    // Geo / Tax
    const geo = intelligenceData.geo
        || intelligenceData.taxAndCurrency
        || null;

    // VW Alerts
    const vwAlerts = intelligenceData.vwAlerts
        || intelligenceData.vanWestendorpAlerts
        || [];

    // Pre-fill
    const preFill = intelligenceData.preFill || null;

    let block = `\n═══════════════════════════════════════════════\nAUTO-INTELLIGENCE DATA (VERIFIED MARKET DATA — HIGHER TRUST THAN USER ESTIMATES)\n═══════════════════════════════════════════════\n`;

    // Competitive Intelligence
    if (competitors.length > 0 || competitorPricing.length > 0) {
        block += `\nCOMPETITIVE INTELLIGENCE (scraped from live competitor websites):\n`;
        if (marketPriceRange) {
            block += `Market Price Range: $${marketPriceRange.min || 'N/A'} – $${marketPriceRange.max || 'N/A'} (avg: $${marketPriceRange.average || 'N/A'}, median: $${marketPriceRange.median || 'N/A'})\n`;
        }
        block += `Data Source: auto_scraped | Competitors Found: ${competitors.length}\n`;
        if (competitors.length > 0) {
            block += `\nDiscovered Competitors:\n${JSON.stringify(competitors, null, 2)}\n`;
        }
        if (competitorPricing.length > 0) {
            block += `\nScraped Pricing Breakdown:\n${JSON.stringify(competitorPricing, null, 2)}\n`;
        }
    }

    // Market Demand
    if (demand && (demand.monthlySearchVolume || demand.keyword)) {
        block += `\nMARKET DEMAND SIGNAL (DataForSEO):\nKeyword: "${demand.keyword || 'N/A'}"\nMonthly Search Volume: ${demand.monthlySearchVolume || 'N/A'}\nCompetition Level: ${demand.competitionLevel || 'N/A'}\nCost Per Click: $${demand.costPerClick || 0} (commercial intent proxy)\nDemand Signal: ${demand.demandSignal || 'N/A'}\nInterpretation: ${demand.demandInterpretation || 'N/A'}\n`;
    }

    // Tax & Currency
    if (geo) {
        const country = geo.country || 'N/A';
        const vatRate = geo.suggestedVatRate ?? geo.vatGstRate ?? 0;
        const currency = geo.currency || geo.baseCurrency || 'USD';
        block += `\nTAX & CURRENCY CONTEXT:\nCountry: ${country} (${geo.countryCode || 'N/A'}) | VAT/GST Rate: ${vatRate}%\nCurrency: ${currency} | Timezone: ${geo.timezone || 'N/A'}\n`;
    }

    // Pre-fill product context
    if (preFill) {
        block += `\nPRODUCT PRE-FILL (AI-extracted from user's website):\nProduct Name: ${preFill.productName || 'N/A'}\nCategory: ${preFill.category || 'N/A'} ${preFill.subCategory ? `/ ${preFill.subCategory}` : ''}\nTarget Customer: ${preFill.targetCustomer || 'N/A'}\nGeography: ${preFill.geographyServed || 'N/A'}\nUSP: ${preFill.valueUsp || 'N/A'}\nSource URL: ${preFill.sourceUrl || 'N/A'}\n`;
    }

    // VW Alerts
    if (vwAlerts.length > 0) {
        block += `\nVAN WESTENDORP VALIDATION ALERTS:\n${JSON.stringify(vwAlerts, null, 2)}\n`;
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
  "executive_summary": { "headline": string (bold, 1 sentence), "summary": string (3 substantial paragraphs: situation, key finding, recommended action), "pricing_verdict": { "recommended_price": number, "recommended_model": string, "confidence_level": "High"|"Medium"|"Low", "confidence_rationale": string } },
  "van_westendorp_interpretation": string (2 paragraphs explaining what the Van Westendorp PSM chart means for their specific product — reference OPP, IPP, PMC, PME by name and explain the optimal pricing zone),
  "cost_breakdown_narrative": string (2 paragraphs analyzing their unit cost structure, identifying the largest cost drivers, and explaining how costs relate to the recommended price),
  "gross_margin_commentary": string (1-2 paragraphs on gross margin health and what it means for sustainability),
  "pricing_analysis": { "survival_commentary": string (2 paragraphs), "best_price_commentary": string (2 paragraphs), "premium_price_commentary": string (2 paragraphs), "recommended_anchor": "survival"|"best"|"premium", "anchor_rationale": string (2 paragraphs) },
  "cost_of_inaction": string (one bold calculation sentence, e.g. "Launching at Entry Price instead of Optimal costs you X in annual revenue at Y customers/month — a Z annual gap."),
  "top_risks": [ { "risk": string, "severity": "High"|"Medium"|"Low", "mitigation": string (2-3 sentences) } ] (3 risks),
  "next_steps": [ string ] (5 actionable steps, each 1-2 sentences with specific actions)
}`;
    } else if (tier === 'Professional') {
        schemaInstruction = `
Return a JSON object with exactly these keys:
{
  "report_meta": { "journey_type": string, "tier": "founder_ready", "one_line_verdict": string },
  "executive_summary": { "headline": string (bold, 1 sentence), "summary": string (4 substantial paragraphs), "pricing_verdict": { "recommended_price": number, "recommended_model": string, "confidence_level": string, "confidence_rationale": string, "price_range_floor": number, "price_range_ceiling": number } },
  "strategic_verdict": { "headline": string (1 bold sentence verdict), "body": string (2-3 paragraph explanation of why this verdict), "confidence_badge": "High"|"Medium"|"Low" },
  "market_analysis": { "market_narrative": string (3 paragraphs), "competitive_landscape": string (2 paragraphs), "positioning_recommendation": string, "willingness_to_pay_analysis": string (reference Van Westendorp PSM points), "tam_sam_narrative": string (2 paragraphs sizing the total addressable and serviceable market), "positioning_map": [ { "name": string (competitor or "Your Product"), "price": number, "value_score": number (1-10) } ] (5-8 data points including "Your Product") },
  "unit_economics": { "narrative": string (2 paragraphs), "gross_margin_analysis": string, "estimated_ltv": number, "estimated_ltv_cac_ratio": number, "payback_period_months": number, "health_score": "Strong"|"Acceptable"|"Needs Attention"|"Critical", "health_rationale": string },
  "pricing_strategy": { "strategy_narrative": string (3 paragraphs), "recommended_model": string, "pricing_tiers_suggestion": [ { "tier_name": string, "price": number, "target_segment": string, "key_value_prop": string } ], "launch_price_recommendation": number, "launch_price_rationale": string (2 paragraphs), "launch_vs_scale": { "launch_rationale": string (2 paragraphs on why to start at launch price), "scale_path": string (2 paragraphs on the path to scale pricing), "transition_trigger": string (specific metric/milestone that triggers the transition) } },
  "cost_of_inaction": { "headline_number": string (the big delta number, e.g. "24.75M annual gap"), "calculation": string (the full calculation sentence), "narrative": string (1-2 paragraphs explaining the urgency) },
  "competitive_positioning": { "narrative": string (2 paragraphs), "position": "Price Leader"|"Value Player"|"Premium"|"Ultra Premium", "benchmark_table": [ { "competitor": string, "estimated_price": string, "positioning": string, "your_advantage": string } ] (5 rows minimum) },
  "monitoring_plan": [ { "metric": string, "target": string, "warning_threshold": string, "action": string (specific action with numbers) } ] (exactly 3 metrics: conversion rate, CAC, refund/churn rate),
  "risk_matrix": [ { "risk": string, "category": "Market"|"Competitive"|"Execution"|"Financial"|"Product", "severity": string, "probability": string, "mitigation": string (2-3 sentences) } ] (5-7 risks),
  "implementation_roadmap": { "narrative": string (2 paragraphs), "phases": [ { "phase": number, "title": string, "duration": string, "key_actions": [string] (4-5 actions), "success_metric": string } ] (3 phases) },
  "next_steps": [ string ] (5 prioritised actions, each 1-2 sentences)
}`;
    } else {
        // Investor Grade
        if (investorSubTier === 'narrative') {
            schemaInstruction = `
Return a JSON object with exactly these keys:
{
  "report_meta": { "journey_type": string, "tier": "investor_grade", "one_line_verdict": string, "report_thesis": string (2-3 sentence thesis) },
  "investment_thesis": string (LONG — 6-8 substantial paragraphs forming a 2-page investment thesis. Cover: market opportunity, pricing power analysis, competitive defensibility, unit economics thesis, growth trajectory, risk-adjusted return potential. This is the section an investor reads first. Write in board-room language.),
  "executive_summary": { "headline": string, "summary": string (5 paragraphs, board-room language), "pricing_verdict": { "recommended_price": number, "recommended_model": string, "confidence_level": string, "confidence_rationale": string, "price_range_floor": number, "price_range_ceiling": number, "upside_scenario_price": number, "downside_scenario_price": number }, "key_findings": [string] (5 strategic bullets — distinct from the summary) },
  "market_analysis": { "market_narrative": string (3 paragraphs), "tam_analysis": string (2 paragraphs with TAM/SAM/SOM estimates), "willingness_to_pay_analysis": string (deep Van Westendorp interpretation), "price_sensitivity_narrative": string, "competitive_landscape": string (3 paragraphs), "market_timing_assessment": string (2 paragraphs on why now is the right/wrong time to launch at this price), "feature_price_mapping": [ { "feature": string, "price_impact": string (e.g. "+15% WTP"), "customer_priority": "High"|"Medium"|"Low" } ] (5-8 features) },
  "pricing_strategy": { "strategy_narrative": string (4 paragraphs), "recommended_model": string, "pricing_tiers_suggestion": [ { "tier_name": string, "price": number, "target_segment": string, "key_value_prop": string, "expected_conversion_rate": string } ], "launch_price_recommendation": number, "launch_price_rationale": string (2 paragraphs), "expansion_price_path": string, "packaging_recommendation_detail": string (3 paragraphs on packaging strategy — what to bundle, what to unbundle, tier structure rationale), "launch_vs_scale": { "launch_rationale": string, "scale_path": string, "transition_trigger": string }, "price_increase_strategy": { "narrative": string (2 paragraphs on the 12-month price increase roadmap), "timeline": [ { "month": string (e.g. "Month 3"), "action": string, "target_price": number } ] (3-4 milestones) } },
  "competitive_positioning": { "narrative": string (3 paragraphs), "position": string, "competitive_moat_assessment": string (3 paragraphs — what makes the pricing defensible, what barriers exist, how durable is the moat), "moat_durability": "Strong"|"Moderate"|"Weak", "benchmark_table": [ { "competitor": string, "estimated_price": string, "pricing_model": string, "positioning": string, "your_advantage": string, "threat_level": string } ] (5 rows minimum), "white_space_opportunity": string },
  "cost_of_inaction": { "headline_number": string, "calculation": string, "narrative": string (2 paragraphs) },
  "investor_narrative": { "pricing_thesis": string (3 paragraphs), "defensibility_statement": string (2 paragraphs), "growth_lever_analysis": string, "comparable_company_pricing": [ { "company": string, "price": string, "model": string, "annual_revenue": string, "key_insight": string } ] (3 companies with pricing details), "comparable_companies": [ { "company": string, "pricing_model": string, "key_lesson": string } ], "red_flags_to_address": [string] (4-6 flags with specific mitigation), "investor_questions_to_prepare": [ { "question": string, "prepared_answer": string } ] (5-7 Q&A pairs) },
  "glossary": [ { "term": string, "definition": string (plain English, 1-2 sentences) } ] (20-25 pricing terms: PMC, OPP, IPP, PME, LTV, CAC, Rule of 40, Van Westendorp, Price Elasticity, Contribution Margin, TAM, SAM, SOM, Breakeven Point, Gross Margin, MRR, ARR, Payback Period, Churn Rate, ARPU, etc.),
  "next_steps": [string] (7 actions with timeframes)
}`;
        } else {
            schemaInstruction = `
Return a JSON object with exactly these keys:
{
  "unit_economics": { "narrative": string (3 paragraphs), "gross_margin_analysis": string, "estimated_ltv": number, "estimated_ltv_cac_ratio": number, "payback_period_months": number, "breakeven_units": number, "health_score": string, "health_rationale": string, "investor_lens_commentary": string, "rule_of_40": { "growth_rate": number (estimated annual growth rate %), "profit_margin": number (gross profit margin %), "combined_score": number (sum of growth + margin), "assessment": string (1-2 sentences: above 40 = strong, below 40 = concern) } },
  "financial_scenarios": { "narrative": string (2 paragraphs), "scenarios": [ { "name": "Conservative"|"Base Case"|"Optimistic", "price_point": number, "monthly_customers": number, "mrr_month_6": number, "mrr_month_12": number, "arr_year_1": number, "gross_profit": number, "implied_cac_budget": number, "key_assumption": string } ] },
  "margin_erosion_audit": { "narrative": string (2 paragraphs explaining margin risks), "leakage_sources": [ { "source": string, "annual_impact": string (dollar amount), "fix": string } ] (4-6 sources), "total_leakage": string (total annual impact) },
  "monitoring_plan": [ { "metric": string, "target": string, "warning_threshold": string, "action": string } ] (3 metrics),
  "chart_data": {
    "price_range_bar": { "labels": ["Survival","PMC","OPP","Best Price","IPP","Premium","PME"], "values": [number x7], "description": string },
    "revenue_projection_12m": { "labels": ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"], "conservative": [number x12], "base_case": [number x12], "optimistic": [number x12], "description": string },
    "ltv_cac_waterfall": { "labels": ["CAC","Gross Margin/Mo","Payback Period","LTV"], "values": [number x4], "description": string }
  },
  "risk_matrix": [ { "risk": string, "category": string, "severity": string, "probability": string, "impact": string, "mitigation": string (2-3 sentences), "timeline": string } ] (7-10 risks),
  "implementation_roadmap": { "narrative": string (2 paragraphs), "phases": [ { "phase": number, "title": string, "duration": string, "key_actions": [string] (5-6 actions), "success_metric": string, "pricing_milestone": string } ] (4 phases covering 18 months) },
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
            const maxTokens = 12000;
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
            const maxTokens = tier === 'Professional' ? 16000 : 10000;
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
