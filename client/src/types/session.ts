// ============================================================
// PricePoint v2.0 — Session Data Types
// Aligned with PRD Section 12.1 Data Schema
// ============================================================

/** Journey A = Established Seller (Audit) | Journey B = New Launcher (Strategy) */
export type JourneyType = 'established_seller' | 'new_launcher';

export type ProductType = 'physical' | 'service' | 'digital';

/** Stages in the questionnaire flow */
export type SessionStage =
    | 'journey_selection'
    | 'journey_root'
    | 'product_classification'
    | 'product_description'
    | 'stage_2a_physical'
    | 'stage_2b_service'
    | 'stage_2c_digital'
    | 'unit_economics_physical'
    | 'unit_economics_service'
    | 'unit_economics_digital'
    | 'market_research'
    | 'product_value'
    | 'financials'
    | 'van_westendorp'
    | 'product_deep_dive'
    | 'market_intelligence'
    | 'business_goals'
    | 'distribution'
    | 'psychological'
    | 'results'
    | 'report_preview';

// ----- Journey A Context (Established Seller) -----
export interface JourneyAContext {
    current_price: number | null;
    time_at_price: 'less_3m' | '3_12m' | '1_3y' | 'more_3y' | null;
    original_pricing_method: 'calculated' | 'gut_feel' | 'copied_competitor' | 'suggested' | 'tested' | 'dont_remember' | null;
    monthly_volume: number | null;
    satisfaction_level: 'undercharging' | 'overcharging' | 'okay_verify' | 'dont_know' | null;
    cost_change_since_pricing: 'up_significant' | 'down' | 'same' | 'not_tracked' | null;
    market_change_since_pricing: 'more_competitive' | 'less_competitive' | 'similar' | 'not_monitored' | null;
    customer_price_feedback: string | null;
    conversion_rate: number | null;
    price_test_history: string | null;
    ltv_estimate: number | null;
    own_price_elasticity_estimate: string | null;
}

// ----- Journey B Context (New Launcher) -----
export interface JourneyBContext {
    prior_sales_history: 'never' | 'samples_only' | 'informal' | 'acquired' | null;
    product_readiness: 'ready' | 'almost_ready' | 'in_development' | 'early_concept' | null;
    demand_validation_status: 'preorders' | 'strong_interest' | 'some_interest' | 'none' | null;
    market_research_done: 'good_sense' | 'casual' | 'none' | null;
    price_in_mind: { type: 'specific' | 'range' | 'open'; value?: number; low?: number; high?: number } | null;
    pricing_fear: 'too_high' | 'too_low_cheap' | 'start_low_raise' | 'start_high_discount' | 'no_preference' | null;
}

// ----- Market Intelligence Types -----
export type CompetitorCount = '0' | '1-3' | '4+';

// ----- Answer Record -----
export interface AnswerRecord {
    questionId: string;
    value: unknown; // Core schema value
    competitorCount?: CompetitorCount; // Strictly typed market input
    competitorPrice?: number;          // Strictly typed market input
    timestamp: number;
}

// ----- The Full Session State -----
export interface SessionData {
    sessionId: string | null;
    journeyType: JourneyType | null;
    productType: ProductType | null;
    currentStage: SessionStage;
    answers: Record<string, AnswerRecord>;
    journeyAContext: JourneyAContext;
    journeyBContext: JourneyBContext;
    completedStages: SessionStage[];
    isUnlocked: boolean;
    createdAt: number | null;
    updatedAt: number | null;
    user: any | null;
    isAuthenticated: boolean;
}

// ----- Default Contexts -----
export const defaultJourneyAContext: JourneyAContext = {
    current_price: null,
    time_at_price: null,
    original_pricing_method: null,
    monthly_volume: null,
    satisfaction_level: null,
    cost_change_since_pricing: null,
    market_change_since_pricing: null,
    customer_price_feedback: null,
    conversion_rate: null,
    price_test_history: null,
    ltv_estimate: null,
    own_price_elasticity_estimate: null,
};

export const defaultJourneyBContext: JourneyBContext = {
    prior_sales_history: null,
    product_readiness: null,
    demand_validation_status: null,
    market_research_done: null,
    price_in_mind: null,
    pricing_fear: null,
};
