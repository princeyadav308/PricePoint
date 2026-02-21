// ============================================================
// PricePoint — Pricing Intelligence Engine
//
// Pure TypeScript utility. No side effects, no store deps.
// Input: session answers → Output: Trinity Price Quote.
//
// Math Models:
//   1. Van Westendorp — 4-line intersection → Optimal Price Point
//   2. Cost-Plus      — Total Unit Cost × (1 + margin%) × (1 + tax%)
//   3. Value Multiplier — 1.2x–2.0x based on USP + retention + brand
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
        totalUnitCost: number;
    };
}

// ── Van Westendorp (simplified for single-user input) ────────
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
    // Look for any of the three UE field IDs
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

// ── Value-Based Multiplier ───────────────────────────────────
function valueMultiplier(
    uspStrength: number,
    retentionRate: number,
    brandRecognition: string,
    willingnessPremium: number,
): number {
    // Normalize inputs to 0–1 range
    const uspNorm = Math.max(0, Math.min(1, (uspStrength - 1) / 9));
    const retNorm = Math.max(0, Math.min(1, retentionRate / 100));

    // Brand recognition bonus (0–0.15)
    const brandMap: Record<string, number> = {
        'Unknown — just starting': 0,
        'Niche following': 0.03,
        'Established in my segment': 0.07,
        'Well-known brand': 0.11,
        'Market leader': 0.15,
    };
    const brandBonus = brandMap[brandRecognition] ?? 0;

    // Willingness to pay premium factor
    const premiumNorm = Math.max(0, Math.min(1, willingnessPremium / 100));

    // Weighted composite score
    const score = uspNorm * 0.35 + retNorm * 0.25 + premiumNorm * 0.25 + brandBonus / 0.15 * 0.15;

    // Map to 1.2x–2.2x range
    return 1.2 + score * 1.0;
}

// ── Main: calculatePrice ─────────────────────────────────────
export function calculatePrice(
    answers: Record<string, { value: unknown }>,
): PricingResult {
    // Extract answers with sensible defaults
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

    // 1. Van Westendorp
    const vw = vanWestendorp(tooCheap, bargain, gettingExpensive, tooExpensive);

    // 2. Cost-Plus
    const costBase = costPlus(totalUnitCost, desiredMargin, taxRate);

    // 3. Value Multiplier
    const multiplier = valueMultiplier(uspStrength, retentionRate, brandRecognition, willingnessPremium);

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
            totalUnitCost: Math.round(totalUnitCost * 100) / 100,
        },
    };
}
