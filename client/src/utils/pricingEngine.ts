// ============================================================
// PricePoint — Pricing Intelligence Engine
//
// Pure TypeScript utility. No side effects, no store deps.
// Input: session answers → Output: Trinity Price Quote.
//
// Math Models:
//   1. Van Westendorp — 4-line intersection → Optimal Price Point
//   2. Cost-Plus      — COGS × (1 + overhead%) × (1 + margin%) × (1 + tax%)
//   3. Value Multiplier — 1.2x–2.0x based on USP + retention
// ============================================================

export interface VanWestendorpResult {
    opp: number;          // Optimal Price Point
    floor: number;        // Price floor (below = quality concern)
    ceiling: number;      // Price ceiling (above = lost sales)
}

export interface PricingResult {
    budget: number;
    recommended: number;
    premium: number;
    analysis: {
        vanWestendorp: VanWestendorpResult;
        costPlusBase: number;
        valueMultiplier: number;
    };
}

// ── Van Westendorp (simplified for single-user input) ────────
function vanWestendorp(
    tooCheap: number,
    bargain: number,
    expensive: number,
    tooExpensive: number,
): VanWestendorpResult {
    // Optimal Price Point: midpoint of the acceptable range
    const opp = (bargain + expensive) / 2;

    // Floor: below this, users question quality
    const floor = (tooCheap + bargain) / 2;

    // Ceiling: above this, users won't consider
    const ceiling = (expensive + tooExpensive) / 2;

    return { opp, floor, ceiling };
}

// ── Cost-Plus Calculation ────────────────────────────────────
function costPlus(
    cogs: number,
    overheadPct: number,
    marginPct: number,
    taxPct: number,
): number {
    const withOverhead = cogs * (1 + overheadPct / 100);
    const withMargin = withOverhead * (1 + marginPct / 100);
    const withTax = withMargin * (1 + taxPct / 100);
    return withTax;
}

// ── Value-Based Multiplier ───────────────────────────────────
function valueMultiplier(uspStrength: number, retentionRate: number): number {
    // Normalize inputs to 0–1 range
    const uspNorm = Math.max(0, Math.min(1, (uspStrength - 1) / 9));
    const retNorm = Math.max(0, Math.min(1, retentionRate / 100));

    // Weighted composite score
    const score = uspNorm * 0.6 + retNorm * 0.4;

    // Map to 1.2x–2.0x range
    return 1.2 + score * 0.8;
}

// ── Main: calculatePrice ─────────────────────────────────────
export function calculatePrice(
    answers: Record<string, { value: unknown }>,
): PricingResult {
    // Extract answers with sensible defaults
    const cogs = Number(answers['cogs']?.value) || 0;
    const overheadPct = Number(answers['overhead_pct']?.value) || 0;
    const desiredMargin = Number(answers['desired_margin']?.value) || 20;
    const taxRate = Number(answers['tax_rate']?.value) || 0;
    const uspStrength = Number(answers['usp_strength']?.value) || 5;
    const retentionRate = Number(answers['retention_rate']?.value) || 50;
    const tooCheap = Number(answers['too_cheap']?.value) || 10;
    const bargain = Number(answers['bargain']?.value) || 25;
    const gettingExpensive = Number(answers['getting_expensive']?.value) || 75;
    const tooExpensive = Number(answers['too_expensive']?.value) || 150;

    // 1. Van Westendorp
    const vw = vanWestendorp(tooCheap, bargain, gettingExpensive, tooExpensive);

    // 2. Cost-Plus
    const costBase = costPlus(cogs, overheadPct, desiredMargin, taxRate);

    // 3. Value Multiplier
    const multiplier = valueMultiplier(uspStrength, retentionRate);

    // ── Trinity Quote ────────────────────────────────────────
    const budget = Math.max(costBase, vw.floor);
    const recommended = vw.opp;
    const premium = Math.max(recommended * multiplier, vw.ceiling);

    return {
        budget: Math.round(budget * 100) / 100,
        recommended: Math.round(recommended * 100) / 100,
        premium: Math.round(premium * 100) / 100,
        analysis: {
            vanWestendorp: vw,
            costPlusBase: Math.round(costBase * 100) / 100,
            valueMultiplier: Math.round(multiplier * 100) / 100,
        },
    };
}
