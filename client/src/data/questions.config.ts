export type QuestionFieldType = 'text' | 'select' | 'number' | 'mcq' | 'slider' | 'multi-select';

export interface QuestionField {
    id: string;
    type: QuestionFieldType;
    label: string;
    options?: string[];
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
}

export interface StageConfig {
    id: string;
    title: string;
    icon: string;
    fields: QuestionField[];
    nextStageId?: string;   // Linear flow → key into STAGE_MAP
    branchIds?: string[];   // Simultaneous branching → keys into STAGE_MAP
}

// ── Stage 1: Product Classification ───────────────────────────
export const STAGE_1_QUESTIONS: StageConfig = {
    id: 'product_classification',
    title: 'Product Classification',
    icon: 'Package',
    branchIds: ['market_research', 'product_value', 'financials'],
    fields: [
        {
            id: 'product_type',
            type: 'select',
            label: 'What are you pricing?',
            options: ['Physical Product', 'Service', 'Digital Product'],
        },
        {
            id: 'product_name',
            type: 'text',
            label: 'Product Name',
            placeholder: 'e.g. Premium Coffee Blend',
        },
        {
            id: 'currency',
            type: 'select',
            label: 'Currency',
            options: ['USD', 'EUR', 'GBP', 'INR'],
        },
    ],
};

// ── Branch A: Market Research ─────────────────────────────────
export const BRANCH_MARKET_RESEARCH: StageConfig = {
    id: 'market_research',
    title: 'Market Research',
    icon: 'Globe',
    fields: [
        {
            id: 'competitor_count',
            type: 'slider',
            label: 'Number of Direct Competitors',
            min: 0, max: 50, step: 1,
        },
        {
            id: 'market_saturation',
            type: 'mcq',
            label: 'Market Saturation Level',
            options: ['Low', 'Medium', 'High', 'Oversaturated'],
        },
        {
            id: 'tax_jurisdiction',
            type: 'select',
            label: 'Primary Tax Jurisdiction',
            options: ['United States', 'European Union', 'United Kingdom', 'India', 'Other'],
        },
        {
            id: 'applicable_taxes',
            type: 'multi-select',
            label: 'Applicable Taxes',
            options: ['GST', 'VAT', 'Sales Tax', 'Import Duty', 'Digital Services Tax', 'None'],
        },
    ],
};

// ── Branch B: Product Value ───────────────────────────────────
export const BRANCH_PRODUCT_VALUE: StageConfig = {
    id: 'product_value',
    title: 'Product Value',
    icon: 'Gem',
    fields: [
        {
            id: 'feature_importance',
            type: 'mcq',
            label: 'Most Important Feature',
            options: ['Performance', 'Design', 'Support', 'Price', 'Innovation', 'Reliability'],
        },
        {
            id: 'magic_moment',
            type: 'text',
            label: '"Magic Moment" — What makes your product irreplaceable?',
            placeholder: 'e.g. 10x faster delivery than competitors',
        },
        {
            id: 'usp_strength',
            type: 'slider',
            label: 'Unique Selling Proposition Strength',
            min: 1, max: 10, step: 1,
        },
        {
            id: 'retention_rate',
            type: 'slider',
            label: 'Customer Retention Rate',
            min: 0, max: 100, step: 5, unit: '%',
        },
    ],
};

// ── Branch C: Financials ──────────────────────────────────────
export const BRANCH_FINANCIALS: StageConfig = {
    id: 'financials',
    title: 'Financials',
    icon: 'Calculator',
    fields: [
        {
            id: 'cogs',
            type: 'number',
            label: 'Cost of Goods Sold (per unit)',
            placeholder: 'e.g. 12.50',
        },
        {
            id: 'overhead_pct',
            type: 'slider',
            label: 'Operational Overhead',
            min: 0, max: 80, step: 5, unit: '%',
        },
        {
            id: 'desired_margin',
            type: 'slider',
            label: 'Desired Profit Margin',
            min: 5, max: 90, step: 5, unit: '%',
        },
        {
            id: 'tax_rate',
            type: 'slider',
            label: 'Effective Tax Rate',
            min: 0, max: 40, step: 1, unit: '%',
        },
    ],
};

// ── Convergence: Van Westendorp Price Sensitivity ─────────────
export const VAN_WESTENDORP_QUESTIONS: StageConfig = {
    id: 'van_westendorp',
    title: 'Price Sensitivity',
    icon: 'Target',
    nextStageId: 'result',
    fields: [
        {
            id: 'too_cheap',
            type: 'slider',
            label: 'At what price would you question this product\'s quality?',
            min: 1, max: 999, step: 1, unit: '$',
        },
        {
            id: 'bargain',
            type: 'slider',
            label: 'At what price is this product a great bargain?',
            min: 1, max: 999, step: 1, unit: '$',
        },
        {
            id: 'getting_expensive',
            type: 'slider',
            label: 'At what price does this product start getting expensive?',
            min: 1, max: 999, step: 1, unit: '$',
        },
        {
            id: 'too_expensive',
            type: 'slider',
            label: 'At what price is this product too expensive to consider?',
            min: 1, max: 999, step: 1, unit: '$',
        },
    ],
};

// ── Lookup map ────────────────────────────────────────────────
export const STAGE_MAP: Record<string, StageConfig> = {
    product_classification: STAGE_1_QUESTIONS,
    market_research: BRANCH_MARKET_RESEARCH,
    product_value: BRANCH_PRODUCT_VALUE,
    financials: BRANCH_FINANCIALS,
    van_westendorp: VAN_WESTENDORP_QUESTIONS,
};
