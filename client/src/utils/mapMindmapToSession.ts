// ============================================================
// mapMindmapToSession.ts — MindMap → SessionData Bridge
// Maps raw MindMap answer keys to the structured SessionData
// fields that Claude's prompt expects.
// ============================================================

interface MindMapAnswers {
    [key: string]: { value: unknown };
}

interface SessionData {
    journeyType: string;
    answers: MindMapAnswers;
    pricingResult?: any;
    currency?: string;
}

/**
 * Maps raw MindMap answers into the structured SessionData format
 * that the backend's Claude prompt expects.
 *
 * The MindMap store uses specific keys like `uePhysical`, `bargain`,
 * `competitor_price_low`, etc. This function normalises them into
 * the `answers` object with `{ value }` wrappers.
 */
export function mapMindmapToSession(
    mindmapAnswers: Record<string, unknown>,
    journeyType: string,
    pricingResult?: any
): SessionData {
    const answers: MindMapAnswers = {};

    // Direct 1:1 key mappings from MindMap store → SessionData
    const directKeys = [
        // User Context
        'product_name', 'product_description', 'industry', 'country', 'currency',
        'target_audience', 'business_model', 'product_type',
        // Pricing Psychology
        'bargain', 'good_value', 'getting_expensive', 'too_expensive',
        // Competitor Intel
        'competitor_price_low', 'competitor_price_mid', 'competitor_price_high',
        'competitor_names', 'competitor_count',
        // Unit Economics
        'ue_physical', 'ue_service', 'ue_digital',
        'desired_margin', 'expected_volume',
        // Market Position
        'unique_selling_point', 'feature_comparison',
        'differentiation_level', 'brand_strength',
        // Additional
        'current_price', 'pricing_model', 'launch_timeline',
        'revenue_target', 'customer_segments',
    ];

    for (const key of directKeys) {
        if (mindmapAnswers[key] !== undefined) {
            // If the value is already wrapped in { value }, use as-is
            const raw = mindmapAnswers[key];
            if (raw && typeof raw === 'object' && 'value' in (raw as any)) {
                answers[key] = raw as { value: unknown };
            } else {
                answers[key] = { value: raw };
            }
        }
    }

    // Also carry over any keys we didn't explicitly list
    for (const key of Object.keys(mindmapAnswers)) {
        if (!answers[key] && mindmapAnswers[key] !== undefined) {
            const raw = mindmapAnswers[key];
            if (raw && typeof raw === 'object' && 'value' in (raw as any)) {
                answers[key] = raw as { value: unknown };
            } else {
                answers[key] = { value: raw };
            }
        }
    }

    // Extract currency label for top-level field
    const currencyVal = answers['currency']?.value;
    const currency = typeof currencyVal === 'string' ? currencyVal : 'USD ($)';

    return {
        journeyType: journeyType || 'new_launcher',
        answers,
        pricingResult,
        currency,
    };
}
