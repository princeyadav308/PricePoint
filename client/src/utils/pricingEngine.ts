// ============================================================
// PricePoint — Pricing Intelligence Engine V2
//
// Pure TypeScript utility. No side effects, no store deps.
// Input: session answers → Output: Trinity Price Quote.
//
// Math Models:
//   1. Van Westendorp — 4-line intersection → Optimal Price Point
//   2. Cost-Plus      — Total Unit Cost × (1 + margin%) × (1 + tax%)
//   3. Value Multiplier — 1.2x–2.0x based on USP + retention + brand
//   4. Market Modifiers — Gravity, Blue Ocean, Saturation Caps
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
    appliedModifiers: string[]; // Captured market logic rules fired
    analysis: {
        vanWestendorp: VanWestendorpResult;
        costPlusBase: number;
        valueMultiplier: number;
        totalUnitCost: number;
    };
}

// ── Van Westendorp ────────
function vanWestendorp(
    tooCheap: number,
    bargain: number,
    expensive: number,
    tooExpensive: number,
): VanWestendorpResult {
    const opp = (bargain + expensive) / 2;
    const floor = (tooCheap + bargain) / 2;
    const ceiling = (expensive + tooExpensive) / 2;
    return { opp, floor, ceiling };
}

// ── Extract total cost from unit economics table ─────────────
function extractUnitEconomicsCost(
    answers: Record<string, { value: unknown }>,
): number {
    const ueKeys = ['ue_physical', 'ue_service', 'ue_digital'];
    for (const key of ueKeys) {
        const ans = answers[key]?.value;
        if (Array.isArray(ans)) {
            return ans.reduce(
                (sum: number, row: { value?: string }) =>
                    sum + (parseFloat(row.value ?? '0') || 0),
                0,
            );
        }
    }
    return 0;
}

// ── Cost-Plus Calculation ────────────────────────────────────
function costPlus(
    totalUnitCost: number,
    marginPct: number,
    taxPct: number,
): number {
    const withMargin = totalUnitCost * (1 + marginPct / 100);
    const withTax = withMargin * (1 + taxPct / 100);
    return withTax;
}

// ── Value-Based Multiplier (Base) ────────────────────────────
function calculateBaseMultiplier(
    uspStrength: number,
    retentionRate: number,
    brandRecognition: string,
    willingnessPremium: number,
): number {
    const uspNorm = Math.max(0, Math.min(1, (uspStrength - 1) / 9));
    const retNorm = Math.max(0, Math.min(1, retentionRate / 100));

    const brandMap: Record<string, number> = {
        'Unknown — just starting': 0,
        'Niche following': 0.03,
        'Established in my segment': 0.07,
        'Well-known brand': 0.11,
        'Market leader': 0.15,
    };
    const brandBonus = brandMap[brandRecognition] ?? 0;

    const premiumNorm = Math.max(0, Math.min(1, willingnessPremium / 100));

    const score = uspNorm * 0.35 + retNorm * 0.25 + premiumNorm * 0.25 + (brandBonus / 0.15) * 0.15;
    return 1.2 + score * 1.0;
}

// ── Main: calculatePrice ─────────────────────────────────────
const NA_MARKER = '__NA__';

/** Check if a value is a real answer (not N/A, not undefined/null) */
function isRealAnswer(answers: Record<string, { value: unknown }>, key: string): boolean {
    const ans = answers[key];
    if (!ans) return false;
    const val = ans.value;
    if (val === null || val === undefined || val === '') return false;
    if (val === NA_MARKER) return false;
    return true;
}

export function calculatePrice(
    answers: Record<string, { value: unknown }>,
): PricingResult | null {
    // ══════════════════════════════════════════════════════════
    // GUARD: Minimum Viable Data Check
    // ══════════════════════════════════════════════════════════

    // 1. Count total answers vs N/A markers
    const allKeys = Object.keys(answers);
    const naCount = allKeys.filter((k) => answers[k]?.value === NA_MARKER).length;
    const totalCount = allKeys.length;
    if (totalCount > 0 && naCount / totalCount > 0.5) {
        return null; // More than 50% skipped
    }

    // 2. Check critical price sensitivity inputs
    const hasAnySensitivity = ['too_cheap', 'bargain', 'getting_expensive', 'too_expensive']
        .some((k) => isRealAnswer(answers, k));

    // 3. Check if unit economics data exists
    const hasUnitEconomics = ['ue_physical', 'ue_service', 'ue_digital']
        .some((k) => isRealAnswer(answers, k));

    // 4. Check financials
    const hasFinancials = isRealAnswer(answers, 'desired_margin');

    // If no sensitivity data AND no unit economics AND no financials → insufficient
    if (!hasAnySensitivity && !hasUnitEconomics && !hasFinancials) {
        return null;
    }

    // ══════════════════════════════════════════════════════════

    // Extract base answers
    const totalUnitCost = extractUnitEconomicsCost(answers);
    const desiredMargin = Number(answers['desired_margin']?.value) || 20;
    const taxRate = Number(answers['tax_rate']?.value) || 0;
    const uspStrength = Number(answers['usp_strength']?.value) || 5;
    const retentionRate = Number(answers['retention_rate']?.value) || 50;
    const brandRecognition = String(answers['brand_recognition']?.value ?? 'Unknown — just starting');
    const willingnessPremium = Number(answers['willingness_premium']?.value) || 20;

    const tooCheap = Number(answers['too_cheap']?.value) || 10;
    const bargain = Number(answers['bargain']?.value) || 25;
    const gettingExpensive = Number(answers['getting_expensive']?.value) || 75;
    const tooExpensive = Number(answers['too_expensive']?.value) || 150;

    // Extract market answers (checking both raw value & strictly typed keys if they exist)
    const competitorCountRaw = answers['competitor_count']?.value ?? '1-3';
    const competitorCount = String(competitorCountRaw);
    const competitorPrice = Number(answers['competitor_price']?.value) || 0;

    const appliedModifiers: string[] = [];

    // ==========================================
    // STEP A: Base Calculations
    // ==========================================
    const vw = vanWestendorp(tooCheap, bargain, gettingExpensive, tooExpensive);
    const costBase = costPlus(totalUnitCost, desiredMargin, taxRate);

    // ==========================================
    // STEP B: The Value Multiplier
    // ==========================================
    let multiplier = calculateBaseMultiplier(uspStrength, retentionRate, brandRecognition, willingnessPremium);

    // ==========================================
    // STEP C: Apply Market Modifiers
    // ==========================================
    const isBlueOcean = competitorCount === '0' || competitorCount.toLowerCase() === 'none';
    const isHighSaturation = competitorCount === '4+' || (Number(competitorCount) >= 4);

    // Rule 1: Blue Ocean Bonus
    if (isBlueOcean) {
        multiplier *= 1.2;
        appliedModifiers.push('BLUE_OCEAN');
    }
    // Rule 2: Commodity Penalty
    else if (isHighSaturation) {
        multiplier *= 0.85;
        appliedModifiers.push('HIGH_SATURATION');
    }

    // ==========================================
    // STEP D: Calculate Final Trinity Quote
    // ==========================================

    // 1. Entry Price
    const budget = Math.max(costBase, vw.floor);
    if (costBase > vw.floor) {
        appliedModifiers.push('MARGIN_PROTECTION');
    }

    // 2. Optimal Price
    let recommended = vw.opp;
    if (competitorPrice > 0 && recommended > competitorPrice * 1.5) {
        // Market Delta Sanity Check (Competitor Gravity)
        recommended = (recommended * 0.7) + (competitorPrice * 0.3);
        appliedModifiers.push('MARKET_GRAVITY_APPLIED');
    }

    // 3. Premium Price
    let premium = Math.max(recommended * multiplier, vw.ceiling);
    if (isHighSaturation && competitorPrice > 0) {
        // Mathematical Cap on saturation
        const strictCap = competitorPrice * 1.3;
        if (premium > strictCap) {
            premium = Math.min(premium, strictCap);
        }
    }

    return {
        budget: Math.round(budget * 100) / 100,
        recommended: Math.round(recommended * 100) / 100,
        premium: Math.round(premium * 100) / 100,
        appliedModifiers,
        analysis: {
            vanWestendorp: vw,
            costPlusBase: Math.round(costBase * 100) / 100,
            valueMultiplier: Math.round(multiplier * 100) / 100,
            totalUnitCost: Math.round(totalUnitCost * 100) / 100,
        },
    };
}
