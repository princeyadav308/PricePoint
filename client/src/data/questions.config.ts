export type QuestionFieldType = 'text' | 'select' | 'number' | 'mcq' | 'slider' | 'multi-select' | 'textarea' | 'unit-economics';

export interface UnitEconomicsRow {
    id: string;
    label: string;
    placeholder?: string;
}

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
    defaultRows?: UnitEconomicsRow[];   // for unit-economics type
    helpText?: string;                  // explanation shown on lightbulb toggle
    allowCustom?: boolean;              // allow user to add custom options (multi-select)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validate?: (value: any, allBranchValues: Record<string, any>) => string | null;
}

export interface StageConfig {
    id: string;
    title: string;
    icon: string;
    fields: QuestionField[];
    nextStageId?: string;   // Linear flow → key into STAGE_MAP (or dynamic like 'product_deep_dive')
    branchIds?: string[];   // Simultaneous branching → keys into STAGE_MAP
    scrollable?: boolean;   // Whether the fields area should scroll
}

// ════════════════════════════════════════════════════════════════
// JOURNEY ROOT QUESTIONS
// ════════════════════════════════════════════════════════════════

/** Journey A — Established Seller (Audit Mode) — PRD Section 4.2 */
export const JOURNEY_A_ROOT: StageConfig = {
    id: 'journey_root_a',
    title: 'Pricing Audit Context',
    icon: 'SearchCheck',
    nextStageId: 'audit_baseline',
    scrollable: true,
    fields: [
        {
            id: 'ra1_selling_status',
            type: 'mcq',
            label: 'Is this product currently live and selling?',
            options: ['Yes, live and selling', 'Yes, but paused', 'Sold before, stopped', 'Never sold at a price'],
        },
        {
            id: 'ra3_time_at_price',
            type: 'mcq',
            label: 'How long have you been selling at this price?',
            options: ['Less than 3 months', '3–12 months', '1–3 years', 'More than 3 years'],
        },
        {
            id: 'ra4_pricing_method',
            type: 'mcq',
            label: 'How did you originally set this price?',
            helpText: 'How you initially set your price reveals whether your baseline is data-driven (cost-based, tested) or instinctual (guessed). This helps us identify where there\'s room for optimisation.',
            options: ['Calculated costs carefully', 'Gut feel / guessed', 'Copied a competitor', 'Supplier suggested', 'Tested & optimised', 'Don\'t remember'],
        },
        {
            id: 'ra5_monthly_volume',
            type: 'number',
            label: 'Approximate monthly sales volume (units or clients)?',
            placeholder: 'e.g. 150',
        },
        {
            id: 'ra7_cost_change',
            type: 'mcq',
            label: 'Have your costs changed since you last set this price?',
            helpText: 'If your input costs have risen since you last set the price but you haven\'t raised it, you may be losing margin without realising it.',
            options: ['Costs went up significantly', 'Costs have come down', 'Roughly the same', 'Haven\'t tracked this'],
        },
        {
            id: 'ra8_market_change',
            type: 'mcq',
            label: 'Has the competitive landscape changed since you set your price?',
            options: ['More competitive now', 'Less competition now', 'Market seems similar', 'Don\'t monitor competitors'],
        },
    ],
};

/** Audit Baseline Verification — Audit Journey Only */
export const AUDIT_BASELINE: StageConfig = {
    id: 'audit_baseline',
    title: 'Audit Baseline Verification',
    icon: 'BarChart3',
    nextStageId: 'product_classification',
    fields: [
        {
            id: 'ab_current_active_price',
            type: 'number',
            label: 'What is your current active price for this product/service?',
            placeholder: 'e.g. 49.99',
            helpText: 'Enter the exact price your customers currently pay. This establishes the baseline for our Revenue Leakage analysis — how much money you may be leaving on the table.',
        },
        {
            id: 'ab_price_sentiment',
            type: 'mcq',
            label: 'What is your current sentiment regarding this price?',
            helpText: 'Your gut feeling about pricing often correlates with actual market positioning. This data powers the Revenue Leakage section in Professional and Investor reports.',
            options: ['Overcharging', 'Undercharging', 'Not Sure'],
        },
    ],
};

/** Journey B — New Launcher (Strategy Mode) — PRD Section 4.3 */
export const JOURNEY_B_ROOT: StageConfig = {
    id: 'journey_root_b',
    title: 'Launch Strategy Context',
    icon: 'Rocket',
    nextStageId: 'product_classification',
    scrollable: true,
    fields: [
        {
            id: 'rb1_prior_sales',
            type: 'mcq',
            label: 'Has this product ever been sold at any price?',
            options: ['No — completely new product', 'Given samples/trials only', 'Informal transactions, no formal price', 'Previously sold by another owner'],
        },
        {
            id: 'rb2_readiness',
            type: 'mcq',
            label: 'How far along is the product?',
            options: ['Fully finished & ready to sell', 'Almost ready (1–4 weeks)', 'In development (1–3 months)', 'Early concept (3+ months)'],
        },
        {
            id: 'rb3_demand_validation',
            type: 'mcq',
            label: 'Have you validated demand for this product?',
            helpText: 'Demand validation means confirming people actually want to buy (not just "like") your product. Pre-orders and deposits are the strongest signal. Launching without any validation is risky.',
            options: ['Yes — paying pre-orders or deposits', 'Strong verbal/survey interest', 'Some informal interest', 'No validation — launching blind'],
        },
        {
            id: 'rb4_market_research',
            type: 'mcq',
            label: 'Have you researched what similar products sell for?',
            options: ['Yes — good sense of market range', 'Somewhat — looked casually', 'No idea what the market charges'],
        },
        {
            id: 'rb5_price_in_mind',
            type: 'mcq',
            label: 'Do you have a price in mind already?',
            options: ['Yes — a specific price', 'Yes — a rough range', 'Completely open — tell me what to charge'],
        },
        {
            id: 'rb6_pricing_fear',
            type: 'mcq',
            label: 'What is your primary pricing fear?',
            options: [
                'Pricing too high, no buyers',
                'Pricing too low, seen as cheap',
                'Start low, raise later',
                'Start high, discount if needed',
                'No preference — show me the data',
            ],
        },
    ],
};

// ════════════════════════════════════════════════════════════════
// PRODUCT CLASSIFICATION + DESCRIPTION
// ════════════════════════════════════════════════════════════════

export const STAGE_CLASSIFICATION: StageConfig = {
    id: 'product_classification',
    title: 'Product Classification',
    icon: 'Package',
    nextStageId: 'product_description',
    fields: [
        {
            id: 'product_type',
            type: 'select',
            label: 'What type of product are you pricing?',
            options: ['Physical Product', 'Service', 'Digital Product'],
        },
        {
            id: 'product_name',
            type: 'text',
            label: 'Product Name',
            placeholder: 'e.g. Premium Coffee Blend',
        },
        {
            id: 'business_country',
            type: 'select',
            label: 'Where is your business based?',
            options: ['United States', 'United Kingdom', 'India', 'European Union', 'Canada', 'Australia', 'Other'],
        },
        {
            id: 'currency',
            type: 'select',
            label: 'Currency',
            options: ['USD ($)', 'EUR (€)', 'GBP (£)', 'INR (₹)', 'CAD (C$)', 'AUD (A$)'],
            helpText: 'All prices in your report will be displayed in this currency.',
            validate: (val, form) => {
                // Soft warning for country/currency mismatch
                const country = form?.['business_country'];
                if (!country || !val || country === 'Other') return null;
                const expected: Record<string, string> = {
                    'United States': 'USD ($)',
                    'United Kingdom': 'GBP (£)',
                    'India': 'INR (₹)',
                    'European Union': 'EUR (€)',
                    'Canada': 'CAD (C$)',
                    'Australia': 'AUD (A$)',
                };
                const exp = expected[country];
                if (exp && exp !== val) {
                    return `⚠️ Businesses in ${country} typically use ${exp.split(' ')[0]}. Your report will use ${String(val).split(' ')[0]}.`;
                }
                return null;
            },
        },
    ],
};

export const STAGE_PRODUCT_DESCRIPTION: StageConfig = {
    id: 'product_description',
    title: 'Describe Your Product',
    icon: 'FileText',
    nextStageId: 'product_deep_dive',     // dynamic — resolved in QuestionNode
    fields: [
        {
            id: 'product_description_text',
            type: 'textarea',
            label: 'Tell us about your product in detail. What problem does it solve? Who is it for? What makes it unique?',
            placeholder: 'e.g. A premium, single-origin coffee blend sourced from Ethiopian highlands. We target health-conscious coffee enthusiasts aged 25–45 who value sustainable sourcing. Our unique selling point is the proprietary slow-roast process that…',
        },
    ],
};

// ════════════════════════════════════════════════════════════════
// PRODUCT DEEP DIVES (Type-Specific) — PRD Section 7.3–7.5
// ════════════════════════════════════════════════════════════════

/** Stage 2A — Physical Product Deep Dive */
export const STAGE_2A_PHYSICAL: StageConfig = {
    id: 'stage_2a_physical',
    title: 'Physical Product Details',
    icon: 'Boxes',
    nextStageId: 'unit_economics_physical',
    scrollable: true,
    fields: [
        {
            id: 'physical_category',
            type: 'select',
            label: 'Product Category',
            options: [
                'Apparel & Fashion', 'Food & Beverage', 'Electronics', 'Home Goods',
                'Health & Beauty', 'Crafts / Handmade', 'Sporting Goods', 'Industrial', 'Other',
            ],
        },
        {
            id: 'physical_sourcing',
            type: 'mcq',
            label: 'How do you produce or source this product?',
            options: ['Make myself', 'Outsource manufacturing', 'Buy wholesale / resell', 'Dropship', 'Private-label'],
        },
        {
            id: 'physical_production_time',
            type: 'number',
            label: 'Average time to produce ONE unit (hours)',
            placeholder: 'e.g. 2.5',
        },
        {
            id: 'physical_selling_platforms',
            type: 'multi-select',
            label: 'Where do you sell or plan to sell?',
            allowCustom: true,
            options: ['Amazon', 'Etsy', 'eBay', 'Shopify', 'Own Website', 'Retail Stores', 'Wholesale', 'Instagram / Social'],
        },
        {
            id: 'physical_return_rate',
            type: 'slider',
            label: 'Expected return/refund rate',
            helpText: 'What percentage of sold units get returned or refunded? Industry averages: Fashion ~20-30%, Electronics ~10-15%, Food ~2-5%. A higher return rate increases your effective cost per sale.',
            min: 0, max: 30, step: 1, unit: '%',
        },
    ],
};

/** Stage 2B — Service Deep Dive */
export const STAGE_2B_SERVICE: StageConfig = {
    id: 'stage_2b_service',
    title: 'Service Details',
    icon: 'Briefcase',
    nextStageId: 'unit_economics_service',
    scrollable: true,
    fields: [
        {
            id: 'service_category',
            type: 'select',
            label: 'Service Category',
            options: [
                'Creative / Design', 'Tech / Development', 'Consulting', 'Education / Coaching',
                'Legal / Financial', 'Health / Wellness', 'Trades / Labour', 'Events', 'Other',
            ],
        },
        {
            id: 'service_billing_model',
            type: 'multi-select',
            label: 'Preferred billing model(s)',
            helpText: 'Many service providers offer multiple billing models depending on the client. Hourly = charge per hour worked. Retainer = fixed monthly fee for ongoing availability. Value-Based = charge based on results delivered, not time spent.',
            allowCustom: true,
            options: ['Hourly', 'Flat Project Fee', 'Retainer', 'Day Rate', 'Value-Based', 'Per Deliverable'],
        },
        {
            id: 'service_desired_income',
            type: 'number',
            label: 'Desired annual income from this service',
            placeholder: 'e.g. 80000',
        },
        {
            id: 'service_billable_hours',
            type: 'slider',
            label: 'Genuinely billable hours per week (exclude admin)',
            helpText: 'Billable hours = only the hours you can actually charge clients for. Most freelancers can bill 60-70% of their work week — the rest goes to admin, marketing, invoicing, etc. Be honest here, overestimating leads to undercharging.',
            min: 5, max: 50, step: 1, unit: 'hrs',
        },
        {
            id: 'service_experience_years',
            type: 'slider',
            label: 'Years of verifiable experience',
            min: 0, max: 30, step: 1,
        },
    ],
};

/** Stage 2C — Digital Product Deep Dive */
export const STAGE_2C_DIGITAL: StageConfig = {
    id: 'stage_2c_digital',
    title: 'Digital Product Details',
    icon: 'Monitor',
    nextStageId: 'unit_economics_digital',
    scrollable: true,
    fields: [
        {
            id: 'digital_format',
            type: 'select',
            label: 'Digital product format',
            options: [
                'SaaS', 'Mobile App', 'E-book', 'Online Course', 'Template / Asset Pack',
                'Plugin / Extension', 'API / Data Service', 'Music / Audio', 'Other',
            ],
        },
        {
            id: 'digital_sales_model',
            type: 'mcq',
            label: 'Preferred sales model',
            options: ['One-time purchase', 'Monthly subscription', 'Annual subscription', 'Freemium + upgrade', 'Pay-what-you-want', 'Per-seat licence'],
        },
        {
            id: 'digital_dev_cost',
            type: 'number',
            label: 'Total development cost to build the product',
            placeholder: 'e.g. 25000',
        },
        {
            id: 'digital_platforms',
            type: 'multi-select',
            label: 'Distribution platforms',
            allowCustom: true,
            options: ['Own Website', 'Gumroad', 'App Store', 'Google Play', 'Udemy', 'Shopify App Store', 'Envato', 'ProductHunt', 'Other'],
        },
        {
            id: 'digital_churn_rate',
            type: 'slider',
            label: 'Monthly churn rate (if subscription)',
            helpText: 'Churn rate = percentage of subscribers who cancel each month. Example: 5% churn means if you have 100 subscribers, you lose 5 per month. SaaS average is 3-8%. Low churn = strong value; high churn = pricing or product issue.',
            min: 0, max: 25, step: 0.5, unit: '%',
        },
    ],
};

// ════════════════════════════════════════════════════════════════
// UNIT ECONOMICS (Type-Specific Tables)
// ════════════════════════════════════════════════════════════════

/** Physical Product — Unit Economics */
export const UNIT_ECONOMICS_PHYSICAL: StageConfig = {
    id: 'unit_economics_physical',
    title: 'Unit Economics — Physical Product',
    icon: 'Receipt',
    branchIds: ['market_research', 'product_value', 'financials'],
    scrollable: true,
    fields: [
        {
            id: 'ue_physical',
            type: 'unit-economics',
            label: 'Cost to produce/deliver ONE unit',
            defaultRows: [
                { id: 'raw_materials', label: 'Raw Materials / Purchase Cost', placeholder: 'e.g. 12.50' },
                { id: 'labor', label: 'Labor / Production', placeholder: 'e.g. 5.00' },
                { id: 'packaging', label: 'Packaging', placeholder: 'e.g. 2.00' },
                { id: 'inbound_shipping', label: 'Inbound Shipping / Freight', placeholder: 'e.g. 1.50' },
                { id: 'outbound_shipping', label: 'Outbound Shipping to Customer', placeholder: 'e.g. 4.00' },
                { id: 'storage', label: 'Storage / Warehousing', placeholder: 'e.g. 1.00' },
                { id: 'platform_fees', label: 'Platform / Marketplace Fees', placeholder: 'e.g. 3.00' },
                { id: 'marketing_per_unit', label: 'Marketing / Advertising (per unit)', placeholder: 'e.g. 2.00' },
                { id: 'returns_provision', label: 'Returns / Refunds Provision', placeholder: 'e.g. 0.50' },
                { id: 'payment_processing', label: 'Payment Processing Fees', placeholder: 'e.g. 1.50' },
                { id: 'insurance', label: 'Insurance (per unit)', placeholder: 'e.g. 0.30' },
                { id: 'licensing', label: 'Licensing / Compliance', placeholder: 'e.g. 0.20' },
            ],
            validate: (val: any[]) => {
                const total = val ? val.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0) : 0;
                if (total <= 0) return 'Total COGS must be strictly greater than 0.';
                return null;
            },
        },
    ],
};

/** Service — Unit Economics */
export const UNIT_ECONOMICS_SERVICE: StageConfig = {
    id: 'unit_economics_service',
    title: 'Unit Economics — Service',
    icon: 'Receipt',
    branchIds: ['market_research', 'product_value', 'financials'],
    scrollable: true,
    fields: [
        {
            id: 'ue_service',
            type: 'unit-economics',
            label: 'Monthly operating cost breakdown',
            defaultRows: [
                { id: 'software_tools', label: 'Software / Tools', placeholder: 'e.g. 200' },
                { id: 'office_workspace', label: 'Office / Workspace', placeholder: 'e.g. 500' },
                { id: 'equipment', label: 'Equipment / Hardware', placeholder: 'e.g. 100' },
                { id: 'professional_insurance', label: 'Professional Insurance', placeholder: 'e.g. 80' },
                { id: 'platform_commission', label: 'Platform Commission', placeholder: 'e.g. 150' },
                { id: 'marketing', label: 'Marketing / Advertising', placeholder: 'e.g. 300' },
                { id: 'se_tax', label: 'Self-Employment Tax', placeholder: 'e.g. 400' },
                { id: 'training', label: 'Training / Certifications', placeholder: 'e.g. 50' },
                { id: 'travel', label: 'Travel / Transport', placeholder: 'e.g. 100' },
                { id: 'communications', label: 'Communications (Phone/Internet)', placeholder: 'e.g. 80' },
                { id: 'admin', label: 'Admin / Bookkeeping', placeholder: 'e.g. 100' },
                { id: 'bad_debt', label: 'Bad Debt Provision', placeholder: 'e.g. 50' },
            ],
            validate: (val: any[]) => {
                const total = val ? val.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0) : 0;
                if (total <= 0) return 'Total COGS must be strictly greater than 0.';
                return null;
            },
        },
    ],
};

/** Digital Product — Unit Economics */
export const UNIT_ECONOMICS_DIGITAL: StageConfig = {
    id: 'unit_economics_digital',
    title: 'Unit Economics — Digital Product',
    icon: 'Receipt',
    branchIds: ['market_research', 'product_value', 'financials'],
    scrollable: true,
    fields: [
        {
            id: 'ue_digital',
            type: 'unit-economics',
            label: 'Monthly recurring costs breakdown',
            defaultRows: [
                { id: 'hosting', label: 'Hosting / Servers', placeholder: 'e.g. 50' },
                { id: 'cdn', label: 'CDN / Bandwidth', placeholder: 'e.g. 20' },
                { id: 'third_party_apis', label: 'Third-party APIs / Services', placeholder: 'e.g. 100' },
                { id: 'design_assets', label: 'Design / Assets', placeholder: 'e.g. 30' },
                { id: 'marketing', label: 'Marketing / Advertising', placeholder: 'e.g. 200' },
                { id: 'platform_fees', label: 'Platform Fees (App Store, etc.)', placeholder: 'e.g. 0' },
                { id: 'content_updates', label: 'Content Updates / Maintenance', placeholder: 'e.g. 100' },
                { id: 'customer_support', label: 'Customer Support', placeholder: 'e.g. 150' },
                { id: 'payment_processing', label: 'Payment Processing', placeholder: 'e.g. 50' },
                { id: 'licensing', label: 'Licensing / Dependencies', placeholder: 'e.g. 40' },
                { id: 'security', label: 'Security / Compliance', placeholder: 'e.g. 30' },
                { id: 'dev_amortized', label: 'Development (amortized monthly)', placeholder: 'e.g. 500' },
            ],
            validate: (val: any[]) => {
                const total = val ? val.reduce((sum, r) => sum + (parseFloat(r.value) || 0), 0) : 0;
                if (total <= 0) return 'Total COGS must be strictly greater than 0.';
                return null;
            },
        },
    ],
};

// ════════════════════════════════════════════════════════════════
// 3 ANALYSIS BRANCHES (Expanded)
// ════════════════════════════════════════════════════════════════

export const BRANCH_MARKET_RESEARCH: StageConfig = {
    id: 'market_research',
    title: 'Market Research',
    icon: 'Globe',
    scrollable: true,
    nextStageId: 'product_value_focus',  // sentinel → focus camera on existing Product Value card
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
            helpText: 'Market saturation measures how many competitors serve the same audience. "Red ocean" = fiercely competitive, price wars common. "Blue ocean" = few competitors, more pricing freedom. This heavily impacts how aggressively you can price.',
            options: ['Low — Plenty of room', 'Medium — Moderately crowded', 'High — Very competitive', 'Oversaturated — Red ocean'],
        },
        {
            id: 'competitor_price_low',
            type: 'number',
            label: 'Lowest competitor price you\'ve found',
            placeholder: 'e.g. 15.00',
            validate: (val, form) => {
                const min = Number(val);
                const max = Number(form['competitor_price_high']);
                if (form['competitor_price_high'] !== undefined && min >= max) {
                    return 'Lowest price must be strictly less than the highest price.';
                }
                return null;
            }
        },
        {
            id: 'competitor_price_high',
            type: 'number',
            label: 'Highest competitor price you\'ve found',
            placeholder: 'e.g. 120.00',
            validate: (val, form) => {
                const max = Number(val);
                const min = Number(form['competitor_price_low']);
                if (form['competitor_price_low'] !== undefined && max <= min) {
                    return 'Highest price must be strictly greater than the lowest price.';
                }
                return null;
            }
        },
        {
            id: 'target_customer',
            type: 'multi-select',
            label: 'Who is your target customer?',
            helpText: 'Select all customer segments you serve. Most products have a primary audience but may also attract secondary segments. B2B = selling to businesses.',
            allowCustom: true,
            options: ['Budget-conscious buyers', 'Value seekers (mid-market)', 'Premium / luxury buyers', 'Businesses (B2B)', 'Mixed audience'],
        },
        {
            id: 'customer_price_sensitivity',
            type: 'mcq',
            label: 'How price-sensitive is your target customer?',
            helpText: 'Price sensitivity = how much a price change affects buying behaviour. High sensitivity means even a small price hike drives customers away. Low sensitivity means customers prioritise quality, convenience, or brand over price.',
            options: ['Very sensitive — price is #1 factor', 'Moderately sensitive', 'Low sensitivity — value/quality matters more', 'Insensitive — will pay any premium'],
        },
    ],
};

export const BRANCH_PRODUCT_VALUE: StageConfig = {
    id: 'product_value',
    title: 'Product Value',
    icon: 'Gem',
    scrollable: true,
    nextStageId: 'psychological',
    fields: [
        {
            id: 'feature_importance',
            type: 'multi-select',
            label: 'Most important features of your product (select all that apply)',
            helpText: 'Select every feature that customers value most. You can add custom features using the + button. This helps us understand your value proposition and justify your pricing.',
            allowCustom: true,
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
            helpText: 'USP (Unique Selling Proposition) = what makes your product stand out from competitors. Rate honestly: 1 = identical to competitors, 5 = some differentiation, 10 = truly one-of-a-kind with no substitute. A strong USP justifies premium pricing.',
            min: 1, max: 10, step: 1,
        },
        {
            id: 'retention_rate',
            type: 'slider',
            label: 'Customer Retention / Repeat Purchase Rate',
            helpText: 'What percentage of customers come back and buy again? High retention (70%+) signals strong product-market fit and supports higher pricing. Low retention (<30%) suggests price may need to be more competitive to attract new buyers.',
            min: 0, max: 100, step: 5, unit: '%',
        },
        {
            id: 'brand_recognition',
            type: 'mcq',
            label: 'Brand Recognition Level',
            options: ['Unknown — just starting', 'Niche following', 'Established in my segment', 'Well-known brand', 'Market leader'],
        },
        {
            id: 'willingness_premium',
            type: 'slider',
            label: 'How much premium would customers pay over competitors?',
            helpText: 'If competitors charge $50 and you set 20%, that means you believe customers would pay $60 for your product thanks to its added value. Be conservative — overestimating this is one of the most common pricing mistakes.',
            min: 0, max: 100, step: 5, unit: '%',
        },
    ],
};

export const BRANCH_FINANCIALS: StageConfig = {
    id: 'financials',
    title: 'Financials',
    icon: 'Calculator',
    scrollable: true,
    nextStageId: 'distribution',
    fields: [
        {
            id: 'desired_margin',
            type: 'slider',
            label: 'Desired Profit Margin',
            min: 5, max: 90, step: 5, unit: '%',
            validate: (val) => {
                const m = Number(val);
                if (m < 1 || m > 100) return 'Margin must be between 1% and 100%.';
                return null;
            }
        },
        {
            id: 'tax_rate',
            type: 'slider',
            label: 'Effective Tax Rate',
            min: 0, max: 40, step: 1, unit: '%',
        },
        {
            id: 'expected_monthly_volume',
            type: 'number',
            label: 'Expected monthly sales volume (units / clients)',
            placeholder: 'e.g. 500',
        },
        {
            id: 'revenue_target',
            type: 'number',
            label: 'Monthly revenue target',
            placeholder: 'e.g. 25000',
        },
        {
            id: 'pricing_strategy',
            type: 'mcq',
            label: 'What pricing strategy resonates with you?',
            helpText: 'Penetration = enter market with low prices to gain share quickly. Skimming = launch at a high price for early adopters, then drop over time. Value-based = price reflects outcomes/results, not just costs. Each strategy fits different market situations.',
            options: ['Penetration — low to grab share', 'Competitive — match the market', 'Value-based — charge for outcomes', 'Premium — highest possible', 'Skimming — start high, lower later'],
        },
        {
            id: 'breakeven_timeline',
            type: 'mcq',
            label: 'When do you need to break even?',
            helpText: 'Break-even = the point where your total revenue equals your total costs (you stop losing money). A shorter break-even timeline means you need higher prices or higher volume from day one.',
            options: ['Already profitable', 'Within 3 months', '3–6 months', '6–12 months', '1–2 years', 'Not a concern right now'],
        },
        {
            id: 'existing_demand_status',
            type: 'mcq',
            label: 'What is the current demand status for this product?',
            options: ['Testing the waters (no clear demand yet)', 'Generating steady interest', 'Fulfilling existing/proven demand'],
        },
        {
            id: 'promotional_intent',
            type: 'slider',
            label: 'Estimated percentage of sales via discounts/promotions',
            min: 0, max: 100, step: 5, unit: '%',
        },
        {
            id: 'primary_business_goal',
            type: 'mcq',
            label: 'What is your primary goal for this product right now?',
            options: ['Survival (cover costs, stay alive)', 'Growth (maximize volume/market share)', 'Profit (maximize margin per unit)', 'Prestige (limit testing, brand building)'],
        },
    ],
};

// ── Distribution & Legal ──────────────────────────────────────
export const STAGE_5_DISTRIBUTION: StageConfig = {
    id: 'distribution',
    title: 'Distribution & Legal',
    icon: 'Truck',
    scrollable: true,
    fields: [
        {
            id: 'vat_gst_obligation',
            type: 'mcq',
            label: 'Does your price need to be inclusive or exclusive of local sales tax (VAT/GST)?',
            options: ['Inclusive (Consumer standard)', 'Exclusive (B2B standard)', 'Not applicable / Exempt'],
        },
        {
            id: 'international_tax',
            type: 'mcq',
            label: 'Will you absorb cross-border fees and international taxes?',
            options: ['Yes, absorb into price', 'No, passed on to customer', 'Only selling domestically'],
        },
        {
            id: 'wholesale_margin',
            type: 'slider',
            label: 'Required Wholesale / Reseller Margin',
            helpText: 'If you plan to sell through retailers or wholesalers eventually, you need to build their margin (typically 30-50%) into your retail price now.',
            min: 0, max: 70, step: 5, unit: '%',
        },
        {
            id: 'payment_collection_cycle',
            type: 'mcq',
            label: 'What is your typical payment collection cycle?',
            options: ['Paid upfront (100% at checkout)', 'Subscription / Recurring', 'Term payments (Net-15 / Net-30)', 'Milestone-based (50% upfront, 50% completion)'],
        },
    ],
};

// ── Psychological Pricing ─────────────────────────────────────
export const STAGE_6_PSYCHOLOGICAL: StageConfig = {
    id: 'psychological',
    title: 'Psychological Pricing',
    icon: 'BrainCircuit',
    scrollable: true,
    nextStageId: 'financials_focus',  // sentinel → focus camera on existing Financials card
    fields: [
        {
            id: 'presentation_style',
            type: 'mcq',
            label: 'Preferred Pricing Presentation Style',
            helpText: 'Charm pricing ($49.99) signals value and is common in consumer goods. Prestige pricing ($50.00) signals luxury and quality.',
            options: ['Charm Pricing (e.g. .99 or .95)', 'Prestige Pricing (Flat rounding e.g. .00)', 'Exact/Calculated (no rounding up/down)', 'No preference'],
        },
        {
            id: 'tiering_strategy',
            type: 'mcq',
            label: 'Planned Tiering Strategy',
            options: ['Single Price (Take it or leave it)', 'Good / Better / Best (3 tiers)', 'Base + Modular Add-ons', 'Pay-as-you-go / Usage-based'],
        },
        {
            id: 'hard_market_constraints',
            type: 'mcq',
            label: 'Are there any hard market constraints or price ceilings?',
            helpText: 'For example, if your app targets teenagers, an absolute hard ceiling might be $9.99/mo regardless of the value provided.',
            options: ['No hard ceiling', 'Yes, a specific psychological barrier exists', 'Yes, a strict competitor price cap exists'],
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
            helpText: 'Think as a buyer: at what low price would you think "something must be wrong with this"? Example: A $5 leather wallet would raise quality concerns.',
            min: 1, max: 999, step: 1, unit: 'currency',
            validate: (val, form) => (form.bargain !== undefined && Number(val) >= Number(form.bargain)) ? 'Must be strictly less than Bargain price.' : null,
        },
        {
            id: 'bargain',
            type: 'slider',
            label: 'At what price is this product a great bargain?',
            helpText: 'The price where a customer would think "that\'s a great deal!" — low enough to feel like a steal, but high enough to trust the quality.',
            min: 1, max: 999, step: 1, unit: 'currency',
            validate: (val, form) => {
                if (form.too_cheap !== undefined && Number(val) <= Number(form.too_cheap)) return 'Must be strictly greater than Too Cheap.';
                if (form.getting_expensive !== undefined && Number(val) >= Number(form.getting_expensive)) return 'Must be strictly less than Getting Expensive.';
                return null;
            }
        },
        {
            id: 'getting_expensive',
            type: 'slider',
            label: 'At what price does this product start getting expensive?',
            helpText: 'The price where the buyer pauses and thinks "hmm, that\'s getting pricey" — they might still buy, but they\'d need convincing.',
            min: 1, max: 999, step: 1, unit: 'currency',
            validate: (val, form) => {
                if (form.bargain !== undefined && Number(val) <= Number(form.bargain)) return 'Must be strictly greater than Bargain price.';
                if (form.too_expensive !== undefined && Number(val) >= Number(form.too_expensive)) return 'Must be strictly less than Too Expensive.';
                return null;
            }
        },
        {
            id: 'too_expensive',
            type: 'slider',
            label: 'At what price is this product too expensive to consider?',
            helpText: 'The price where the buyer says "absolutely not" — no amount of features or quality would justify this price. This sets the ceiling for your pricing range.',
            min: 1, max: 999, step: 1, unit: 'currency',
            validate: (val, form) => (form.getting_expensive !== undefined && Number(val) <= Number(form.getting_expensive)) ? 'Must be strictly greater than Getting Expensive.' : null,
        },
    ],
};

// ── Lookup map ────────────────────────────────────────────────
export const STAGE_MAP: Record<string, StageConfig> = {
    // Journey Roots
    journey_root_a: JOURNEY_A_ROOT,
    journey_root_b: JOURNEY_B_ROOT,

    // Audit Baseline (Audit path only)
    audit_baseline: AUDIT_BASELINE,

    // Classification + Description
    product_classification: STAGE_CLASSIFICATION,
    product_description: STAGE_PRODUCT_DESCRIPTION,

    // Product Deep Dives
    stage_2a_physical: STAGE_2A_PHYSICAL,
    stage_2b_service: STAGE_2B_SERVICE,
    stage_2c_digital: STAGE_2C_DIGITAL,

    // Unit Economics
    unit_economics_physical: UNIT_ECONOMICS_PHYSICAL,
    unit_economics_service: UNIT_ECONOMICS_SERVICE,
    unit_economics_digital: UNIT_ECONOMICS_DIGITAL,

    // Analysis Branches
    market_research: BRANCH_MARKET_RESEARCH,
    product_value: BRANCH_PRODUCT_VALUE,
    financials: BRANCH_FINANCIALS,
    distribution: STAGE_5_DISTRIBUTION,
    psychological: STAGE_6_PSYCHOLOGICAL,

    // Convergence
    van_westendorp: VAN_WESTENDORP_QUESTIONS,
};

// ── Product-type routing helpers ─────────────────────────────
export const PRODUCT_TYPE_TO_DEEP_DIVE: Record<string, string> = {
    'Physical Product': 'stage_2a_physical',
    'Service': 'stage_2b_service',
    'Digital Product': 'stage_2c_digital',
};
