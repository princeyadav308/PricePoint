// ============================================================
// PricePoint — Report Validator
//
// Deterministic post-Claude, pre-PDF validation layer.
// Runs after generatePricingReport() returns and before
// generateHTMLTemplate() is called.
//
// Three responsibilities:
//   1. Placeholder substitution ({{PME}} → $910.00)
//   2. Hallucination detection & section stripping
//   3. Provenance tagging per section
//
// Design principle: Prompt edits reduce hallucination frequency.
// This validator IS the control. Nothing ships without passing
// through this gate.
// ============================================================

// ── Types ────────────────────────────────────────────────────

export interface Correction {
    field: string;
    original: any;
    corrected: any;
    reason: string;
}

export interface StrippedSection {
    section: string;
    reason: string;
    replacement: string;
}

export type ProvenanceLevel = 'verified' | 'ai_estimated' | 'illustrative' | 'unavailable';

export interface ValidationReport {
    corrections: Correction[];
    strippedSections: StrippedSection[];
    provenanceMap: Record<string, ProvenanceLevel>;
    hasCostData: boolean;
    hasCompetitorData: boolean;
    hasIntelligenceData: boolean;
}

// ── Currency helpers (mirror of pdfTemplate / claude) ────────

const CURRENCY_SYMBOLS: Record<string, string> = {
    'USD ($)': '$', 'EUR (€)': '€', 'GBP (£)': '£',
    'INR (₹)': '₹', 'CAD (C$)': 'C$', 'AUD (A$)': 'A$',
};

function getCurrencySymbol(sessionData: any): string {
    const raw = sessionData?.answers?.currency?.value;
    if (typeof raw === 'string' && CURRENCY_SYMBOLS[raw]) return CURRENCY_SYMBOLS[raw];
    return '$';
}

function fmt(n: any): string {
    const v = Number(n);
    return isNaN(v) ? '0.00' : v.toFixed(2);
}

// ── 1. Placeholder Substitution ──────────────────────────────
// Walks every string value in Claude's JSON output and replaces
// {{PLACEHOLDER}} tokens with engine-computed values.

function buildPlaceholderMap(
    pricingResult: any,
    sessionData: any,
    totalUnitCost: number,
    margin: number,
): Record<string, string> {
    const cs = getCurrencySymbol(sessionData);
    const vw = pricingResult?.analysis?.vanWestendorp || {};

    return {
        '{{SURVIVAL_PRICE}}': `${cs}${fmt(pricingResult?.budget)}`,
        '{{BEST_PRICE}}': `${cs}${fmt(pricingResult?.recommended)}`,
        '{{PREMIUM_PRICE}}': `${cs}${fmt(pricingResult?.premium)}`,
        '{{PMC}}': `${cs}${fmt(vw.pmc ?? vw.floor)}`,
        '{{OPP}}': `${cs}${fmt(vw.opp)}`,
        '{{IPP}}': `${cs}${fmt(vw.ipp)}`,
        '{{PME}}': `${cs}${fmt(vw.pme ?? vw.ceiling)}`,
        '{{COST_BASE}}': `${cs}${fmt(pricingResult?.analysis?.costPlusBase)}`,
        '{{TOTAL_UNIT_COST}}': totalUnitCost > 0 ? `${cs}${fmt(totalUnitCost)}` : `${cs}0.00`,
        '{{VALUE_MULTIPLIER}}': `${(Number(pricingResult?.analysis?.valueMultiplier) || 1).toFixed(2)}x`,
        '{{GROSS_MARGIN}}': totalUnitCost > 0 ? `${margin.toFixed(1)}%` : 'N/A (cost data not provided)',
        '{{CURRENCY}}': cs,
    };
}

/**
 * Recursively walk a JSON object and substitute all {{PLACEHOLDER}} tokens
 * found in string values.
 */
function substitutePlaceholders(
    obj: any,
    placeholderMap: Record<string, string>,
    corrections: Correction[],
    path: string = '',
): any {
    if (typeof obj === 'string') {
        let result = obj;
        let hadSubstitution = false;
        for (const [placeholder, value] of Object.entries(placeholderMap)) {
            if (result.includes(placeholder)) {
                result = result.split(placeholder).join(value);
                hadSubstitution = true;
            }
        }
        if (hadSubstitution) {
            corrections.push({
                field: path,
                original: `(contained placeholders)`,
                corrected: `(substituted with engine values)`,
                reason: 'Template placeholder substitution',
            });
        }
        return result;
    }

    if (Array.isArray(obj)) {
        return obj.map((item, i) =>
            substitutePlaceholders(item, placeholderMap, corrections, `${path}[${i}]`)
        );
    }

    if (obj !== null && typeof obj === 'object') {
        const result: Record<string, any> = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = substitutePlaceholders(value, placeholderMap, corrections, `${path}.${key}`);
        }
        return result;
    }

    return obj;
}


// ── 2. Hallucination Detection & Stripping ───────────────────

/**
 * Detect and strip fabricated cost/margin claims when no cost data was provided.
 * Scans narrative text fields for margin percentages and COGS references.
 */
function stripCostHallucinations(
    report: any,
    hasCostData: boolean,
    corrections: Correction[],
    strippedSections: StrippedSection[],
): void {
    if (hasCostData) return; // Cost data exists — nothing to strip

    const NO_COST_NOTICE = 'Cost data was not provided — margin and profit figures require unit economics input. Re-run your analysis with cost data to unlock accurate margin analysis.';

    // Pattern: match things like "60% gross margin", "$204 COGS", "$306 gross profit"
    const marginPattern = /\d+\.?\d*\s*%?\s*(gross\s*margin|margin|COGS|cost\s*of\s*goods|unit\s*cost|gross\s*profit)/gi;
    const cogsPattern = /\$\d[\d,.]*\s*(COGS|all-in\s*cost|unit\s*cost|gross\s*profit|cost\s*base)/gi;

    function scanAndStrip(obj: any, path: string): void {
        if (typeof obj === 'string') {
            // Check if this text makes cost/margin claims
            if (marginPattern.test(obj) || cogsPattern.test(obj)) {
                // Reset regex lastIndex after test()
                marginPattern.lastIndex = 0;
                cogsPattern.lastIndex = 0;
                // Don't strip the entire string — but flag it
                strippedSections.push({
                    section: path,
                    reason: 'Fabricated cost/margin claim with no cost data provided',
                    replacement: NO_COST_NOTICE,
                });
            }
            // Reset for next use
            marginPattern.lastIndex = 0;
            cogsPattern.lastIndex = 0;
            return;
        }
        if (Array.isArray(obj)) {
            obj.forEach((item, i) => scanAndStrip(item, `${path}[${i}]`));
            return;
        }
        if (obj !== null && typeof obj === 'object') {
            for (const [key, value] of Object.entries(obj)) {
                scanAndStrip(value, `${path}.${key}`);
            }
        }
    }

    // Scan key narrative fields for cost hallucinations
    const narrativeFields = [
        'cost_breakdown_narrative',
        'gross_margin_commentary',
    ];
    for (const field of narrativeFields) {
        if (typeof report[field] === 'string') {
            // Replace these fields entirely when no cost data
            corrections.push({
                field,
                original: report[field].substring(0, 100) + '...',
                corrected: NO_COST_NOTICE,
                reason: 'No cost data provided — stripped fabricated cost narrative',
            });
            report[field] = NO_COST_NOTICE;
        }
    }

    // Also check unit_economics.narrative and gross_margin_analysis
    if (report.unit_economics) {
        if (typeof report.unit_economics.narrative === 'string') {
            scanAndStrip(report.unit_economics.narrative, 'unit_economics.narrative');
        }
        if (typeof report.unit_economics.gross_margin_analysis === 'string') {
            corrections.push({
                field: 'unit_economics.gross_margin_analysis',
                original: report.unit_economics.gross_margin_analysis.substring(0, 100) + '...',
                corrected: NO_COST_NOTICE,
                reason: 'No cost data provided — stripped fabricated margin analysis',
            });
            report.unit_economics.gross_margin_analysis = NO_COST_NOTICE;
        }
    }
}

/**
 * Detect and strip fabricated competitor data when no intelligence data was provided.
 * If Claude invented a competitive benchmark table with named companies, replace it
 * with a generic tier framework.
 */
function stripCompetitorHallucinations(
    report: any,
    hasCompetitorData: boolean,
    intelligenceCompetitors: string[],
    corrections: Correction[],
    strippedSections: StrippedSection[],
): void {
    if (hasCompetitorData) return; // Real scraped competitor data exists

    const NO_COMPETITOR_NOTICE = 'No verified competitor data was provided. Competitive analysis requires market intelligence input. Re-run with competitor discovery enabled to populate this section with real market data.';

    // Strip competitive_positioning.benchmark_table if it contains named companies
    if (report.competitive_positioning?.benchmark_table &&
        Array.isArray(report.competitive_positioning.benchmark_table) &&
        report.competitive_positioning.benchmark_table.length > 0) {

        const table = report.competitive_positioning.benchmark_table;

        // Check if any row uses a company name not from intelligence data
        const hasUnverifiedCompanies = table.some((row: any) => {
            const name = (row.competitor || '').trim();
            if (!name || name.toLowerCase() === 'your product') return false;
            // If we have no intelligence competitors at all, everything is unverified
            if (intelligenceCompetitors.length === 0) return true;
            // Check if this name matches any intelligence-provided competitor
            return !intelligenceCompetitors.some(ic =>
                ic.toLowerCase().includes(name.toLowerCase()) ||
                name.toLowerCase().includes(ic.toLowerCase())
            );
        });

        if (hasUnverifiedCompanies) {
            strippedSections.push({
                section: 'competitive_positioning.benchmark_table',
                reason: 'Competitor table contains named companies not found in intelligence data — fabrication risk',
                replacement: NO_COMPETITOR_NOTICE,
            });
            // Replace with empty array — the template will render the generic tier framework
            report.competitive_positioning.benchmark_table = [];
            report.competitive_positioning._stripped = true;
            report.competitive_positioning._stripReason = NO_COMPETITOR_NOTICE;
        }
    }

    // Also check comparable_company_pricing (Investor tier)
    if (report.investor_narrative?.comparable_company_pricing &&
        Array.isArray(report.investor_narrative.comparable_company_pricing) &&
        report.investor_narrative.comparable_company_pricing.length > 0 &&
        intelligenceCompetitors.length === 0) {

        strippedSections.push({
            section: 'investor_narrative.comparable_company_pricing',
            reason: 'Comparable company pricing contains named companies with no intelligence data — fabrication risk',
            replacement: NO_COMPETITOR_NOTICE,
        });
        report.investor_narrative.comparable_company_pricing = [];
        report.investor_narrative._comparable_stripped = true;
    }
}

/**
 * Detect and strip fabricated TAM/SAM/SOM figures when no intelligence data was provided.
 */
function stripTAMHallucinations(
    report: any,
    hasIntelligenceData: boolean,
    corrections: Correction[],
    strippedSections: StrippedSection[],
): void {
    if (hasIntelligenceData) return; // Intelligence data exists, TAM estimates may be grounded

    const NO_TAM_NOTICE = 'TAM/SAM analysis requires market intelligence data. Re-run with competitor discovery and demand analysis enabled to generate grounded market sizing estimates.';

    // Pattern: match specific dollar TAM figures like "$1.1T", "$500B", "$2.3 billion"
    const tamDollarPattern = /\$[\d,.]+\s*(trillion|billion|million|T|B|M)\b/gi;

    // Check tam_analysis and tam_sam_narrative
    const tamFields = [
        'market_analysis.tam_analysis',
        'market_analysis.tam_sam_narrative',
    ];

    for (const fieldPath of tamFields) {
        const parts = fieldPath.split('.');
        let value = report;
        for (const part of parts) {
            value = value?.[part];
        }

        if (typeof value === 'string' && tamDollarPattern.test(value)) {
            tamDollarPattern.lastIndex = 0; // Reset regex
            strippedSections.push({
                section: fieldPath,
                reason: 'Specific TAM/SAM dollar figures found with no intelligence data — likely fabricated from product name',
                replacement: NO_TAM_NOTICE,
            });

            // Navigate and replace
            let parent = report;
            for (let i = 0; i < parts.length - 1; i++) {
                parent = parent[parts[i]];
            }
            const lastKey = parts[parts.length - 1];
            corrections.push({
                field: fieldPath,
                original: (parent[lastKey] as string).substring(0, 100) + '...',
                corrected: NO_TAM_NOTICE,
                reason: 'Fabricated TAM figure stripped — no intelligence data to ground estimate',
            });
            parent[lastKey] = NO_TAM_NOTICE;
        }
    }
}

/**
 * Correct isolated numeric fields where Claude may have overridden engine values.
 * These are table/KPI fields (not prose) so overwrite is safe.
 */
function correctNumericFields(
    report: any,
    pricingResult: any,
    corrections: Correction[],
): void {
    const vw = pricingResult?.analysis?.vanWestendorp || {};

    // pricing_verdict corrections
    const verdict = report.executive_summary?.pricing_verdict;
    if (verdict) {
        // price_range_ceiling should match PME
        if (verdict.price_range_ceiling !== undefined) {
            const enginePME = Number(vw.pme ?? vw.ceiling ?? 0);
            const claudeVal = Number(verdict.price_range_ceiling);
            if (enginePME > 0 && Math.abs(claudeVal - enginePME) / enginePME > 0.05) {
                corrections.push({
                    field: 'executive_summary.pricing_verdict.price_range_ceiling',
                    original: claudeVal,
                    corrected: enginePME,
                    reason: `Claude ceiling ${claudeVal} differs from engine PME ${enginePME} by >${5}%`,
                });
                verdict.price_range_ceiling = enginePME;
            }
        }

        // price_range_floor should match PMC
        if (verdict.price_range_floor !== undefined) {
            const enginePMC = Number(vw.pmc ?? vw.floor ?? 0);
            const claudeVal = Number(verdict.price_range_floor);
            if (enginePMC > 0 && Math.abs(claudeVal - enginePMC) / enginePMC > 0.05) {
                corrections.push({
                    field: 'executive_summary.pricing_verdict.price_range_floor',
                    original: claudeVal,
                    corrected: enginePMC,
                    reason: `Claude floor ${claudeVal} differs from engine PMC ${enginePMC} by >${5}%`,
                });
                verdict.price_range_floor = enginePMC;
            }
        }

        // recommended_price should match engine recommended
        if (verdict.recommended_price !== undefined) {
            const engineRec = Number(pricingResult?.recommended ?? 0);
            const claudeVal = Number(verdict.recommended_price);
            if (engineRec > 0 && Math.abs(claudeVal - engineRec) / engineRec > 0.15) {
                corrections.push({
                    field: 'executive_summary.pricing_verdict.recommended_price',
                    original: claudeVal,
                    corrected: engineRec,
                    reason: `Claude recommended price ${claudeVal} differs from engine ${engineRec} by >${15}%`,
                });
                verdict.recommended_price = engineRec;
            }
        }
    }

    // financial_scenarios gross_profit correction
    if (report.financial_scenarios?.scenarios && Array.isArray(report.financial_scenarios.scenarios)) {
        const totalUnitCost = Number(pricingResult?.analysis?.totalUnitCost ?? 0);
        for (const scenario of report.financial_scenarios.scenarios) {
            const price = Number(scenario.price_point ?? 0);
            const customers = Number(scenario.monthly_customers ?? 0);
            if (price > 0 && customers > 0 && totalUnitCost > 0) {
                const engineGrossProfit = Math.max(price - totalUnitCost, 0) * customers * 12;
                const claudeGP = Number(scenario.gross_profit ?? 0);
                if (claudeGP > 0 && Math.abs(claudeGP - engineGrossProfit) / engineGrossProfit > 0.15) {
                    corrections.push({
                        field: `financial_scenarios.scenario.${scenario.name}.gross_profit`,
                        original: claudeGP,
                        corrected: Math.round(engineGrossProfit),
                        reason: `Recalculated gross profit from engine data`,
                    });
                    scenario.gross_profit = Math.round(engineGrossProfit);
                }
            }
        }
    }
}


// ── 3. Provenance Tagging ────────────────────────────────────

function buildProvenanceMap(
    hasCostData: boolean,
    hasCompetitorData: boolean,
    hasIntelligenceData: boolean,
): Record<string, ProvenanceLevel> {
    return {
        // Always verified — engine-computed
        'van_westendorp': 'verified',
        'pricing_band': 'verified',
        'applied_modifiers': 'verified',

        // Cost-dependent
        'cost_breakdown': hasCostData ? 'verified' : 'unavailable',
        'cost_breakdown_narrative': hasCostData ? 'ai_estimated' : 'unavailable',
        'gross_margin': hasCostData ? 'verified' : 'unavailable',
        'breakeven': hasCostData ? 'verified' : 'unavailable',

        // Revenue scenarios — MRR/ARR always valid, gross profit depends on cost
        'revenue_scenarios': 'verified',
        'revenue_gross_profit': hasCostData ? 'verified' : 'unavailable',

        // Competitive — depends on intelligence
        'competitive_benchmark': hasCompetitorData ? 'verified' : 'ai_estimated',
        'positioning_map': hasCompetitorData ? 'verified' : 'ai_estimated',
        'tam_sam': hasIntelligenceData ? 'ai_estimated' : 'illustrative',

        // Always AI-estimated — Claude prose
        'executive_summary': 'ai_estimated',
        'strategic_verdict': 'ai_estimated',
        'investment_thesis': 'ai_estimated',
        'pricing_strategy': 'ai_estimated',
        'risk_matrix': 'ai_estimated',
        'implementation_roadmap': 'ai_estimated',
        'next_steps': 'ai_estimated',
        'monitoring_plan': 'ai_estimated',
        'cost_of_inaction': 'ai_estimated',

        // Unit economics
        'unit_economics': hasCostData ? 'ai_estimated' : 'unavailable',
        'ltv_cac': hasCostData ? 'ai_estimated' : 'illustrative',
        'rule_of_40': hasCostData ? 'ai_estimated' : 'illustrative',
        'margin_erosion': hasCostData ? 'ai_estimated' : 'unavailable',

        // Investor-specific
        'investor_narrative': 'ai_estimated',
        'comparable_companies': hasCompetitorData ? 'ai_estimated' : 'illustrative',
        'glossary': 'verified', // definitions are factual
    };
}


// ── Main Export ──────────────────────────────────────────────

export function validateReport(
    claudeReport: any,
    pricingResult: any,
    sessionData: any,
    intelligenceData?: any,
): { validatedReport: any; validationReport: ValidationReport } {

    // Deep clone to avoid mutating the original
    const report = JSON.parse(JSON.stringify(claudeReport));

    const corrections: Correction[] = [];
    const strippedSections: StrippedSection[] = [];

    // ── Determine data availability ──
    const totalUnitCost = Number(pricingResult?.analysis?.totalUnitCost ?? 0);
    const recommended = Number(pricingResult?.recommended ?? 0);
    const costBase = Number(pricingResult?.analysis?.costPlusBase ?? 0);
    const margin = recommended > 0 && costBase > 0
        ? ((recommended - costBase) / recommended * 100)
        : 0;

    const hasCostData = totalUnitCost > 0;

    // Check if real scraped competitor data exists
    const competitors = intelligenceData?.competitors
        || intelligenceData?.competitiveIntelligence?.competitors
        || [];
    const competitorPricing = intelligenceData?.competitorPricing || [];
    const hasCompetitorData = (competitors.length > 0 || competitorPricing.length > 0);

    // Extract competitor names from intelligence for comparison
    const intelligenceCompetitorNames: string[] = [];
    if (Array.isArray(competitors)) {
        for (const c of competitors) {
            if (typeof c === 'string') intelligenceCompetitorNames.push(c);
            else if (c?.name) intelligenceCompetitorNames.push(c.name);
            else if (c?.title) intelligenceCompetitorNames.push(c.title);
        }
    }

    // Intelligence data exists if we have geo, demand, or competitor data
    const hasDemand = !!(intelligenceData?.demand || intelligenceData?.marketDemand);
    const hasGeo = !!(intelligenceData?.geo || intelligenceData?.taxAndCurrency);
    const hasIntelligenceData = hasCompetitorData || hasDemand || hasGeo;

    // ── Phase 1: Placeholder substitution ──
    const placeholderMap = buildPlaceholderMap(pricingResult, sessionData, totalUnitCost, margin);
    const reportWithPlaceholders = substitutePlaceholders(report, placeholderMap, corrections);

    // Copy substituted values back
    Object.assign(report, reportWithPlaceholders);

    // ── Phase 2: Hallucination detection & stripping ──

    // 2a. Cost hallucinations (when cost=$0)
    stripCostHallucinations(report, hasCostData, corrections, strippedSections);

    // 2b. Competitor hallucinations (when no intelligence data)
    stripCompetitorHallucinations(
        report, hasCompetitorData, intelligenceCompetitorNames,
        corrections, strippedSections,
    );

    // 2c. TAM/SAM hallucinations (when no intelligence data)
    stripTAMHallucinations(report, hasIntelligenceData, corrections, strippedSections);

    // 2d. Isolated numeric field corrections (KPIs, table cells)
    correctNumericFields(report, pricingResult, corrections);

    // ── Phase 3: Provenance tagging ──
    const provenanceMap = buildProvenanceMap(hasCostData, hasCompetitorData, hasIntelligenceData);

    // ── Build final validation report ──
    const validationReport: ValidationReport = {
        corrections,
        strippedSections,
        provenanceMap,
        hasCostData,
        hasCompetitorData,
        hasIntelligenceData,
    };

    return { validatedReport: report, validationReport };
}
