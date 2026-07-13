import { create } from 'zustand';

// ============================================================
// Intelligence Store — Async Market Data Layer
//
// All run* actions are non-blocking. The MindMap progresses
// independently. Intelligence data loads in parallel and
// enriches the session silently.
// ============================================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

// ── Types ────────────────────────────────────────────────────

export interface GeoData {
    country: string;
    countryCode: string;
    currency: string;
    suggestedVatRate: number;
    timezone: string;
}

export interface PreFillData {
    productName: string | null;
    description: string | null;
    category: string | null;
    subCategory: string | null;
    targetCustomer: string | null;
    geographyServed: string | null;
    valueUsp: string | null;
    sourceUrl: string | null;
}

export interface Competitor {
    name: string;
    url: string;
    snippet: string;
    priceFound: null;
}

export interface CompetitorPlan {
    name: string;
    price: number;
    currency: string;
    billingCycle: string;
    isPerSeat: boolean;
    keyFeatures: string[];
}

export interface CompetitorPricing {
    url: string;
    plans: CompetitorPlan[];
    pricingModelType: string;
    hasFreeTrialOrFreeTier: boolean;
    pricingNotFound: boolean;
}

export interface DemandData {
    keyword: string;
    monthlySearchVolume: number | null;
    competitionLevel: string | null;
    costPerClick: number | null;
    demandSignal: string | null;
    demandInterpretation: string;
    tierLimited?: boolean;
}

export interface ValidationAlert {
    type: string;
    severity: 'High' | 'Medium' | 'Low';
    message: string;
    suggestion?: string;
}

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'failed';

// ── Store Interface ──────────────────────────────────────────

interface IntelligenceState {
    // Geolocation
    geoData: GeoData | null;
    geoStatus: AsyncStatus;

    // Product pre-fill
    preFillData: PreFillData | null;
    preFillStatus: AsyncStatus;

    // Competitors
    discoveredCompetitors: Competitor[];
    confirmedCompetitors: Competitor[];
    competitorStatus: AsyncStatus;

    // Pricing per competitor
    competitorPricing: CompetitorPricing[];
    pricingStatus: AsyncStatus;

    // Market price range (computed from scraped data)
    marketPriceRange: { min: number; max: number; average: number; median: number } | null;

    // Demand
    demandData: DemandData | null;
    demandStatus: AsyncStatus;

    // Currency
    currencyRates: Record<string, number> | null;

    // Van Westendorp validation
    vwAlerts: ValidationAlert[];

    // Actions
    runGeolocate: () => Promise<void>;
    runPreFill: (urlOrName: string) => Promise<void>;
    runCompetitorDiscovery: (keyword: string, category: string, geography: string, tier?: string) => Promise<void>;
    runPriceScraping: (urls: string[], tier?: string, userDomain?: string) => Promise<void>;
    runDemandAnalysis: (keyword: string, country: string, tier?: string) => Promise<void>;
    confirmCompetitors: (selected: Competitor[]) => void;
    validateVanWestendorp: (
        sliders: { tooCheap: number; bargain: number; gettingExpensive: number; tooExpensive: number },
        marketData?: { competitorMin: number; competitorMax: number; competitorAvg: number }
    ) => ValidationAlert[];
    resetIntelligence: () => void;
}

// ── Helper: compute market range from scraped pricing ────────
function computeMarketRange(pricing: CompetitorPricing[]) {
    const allPrices: number[] = [];
    for (const cp of pricing) {
        for (const plan of cp.plans) {
            if (plan.price > 0) allPrices.push(plan.price);
        }
    }
    if (allPrices.length === 0) return null;

    allPrices.sort((a, b) => a - b);
    const min = allPrices[0];
    const max = allPrices[allPrices.length - 1];
    const average = Math.round(allPrices.reduce((s, v) => s + v, 0) / allPrices.length);
    const mid = Math.floor(allPrices.length / 2);
    const median = allPrices.length % 2 !== 0
        ? allPrices[mid]
        : Math.round((allPrices[mid - 1] + allPrices[mid]) / 2);

    return { min, max, average, median };
}

// ============================================================
// Store
// ============================================================

export const useIntelligenceStore = create<IntelligenceState>((set) => ({
    geoData: null,
    geoStatus: 'idle',
    preFillData: null,
    preFillStatus: 'idle',
    discoveredCompetitors: [],
    confirmedCompetitors: [],
    competitorStatus: 'idle',
    competitorPricing: [],
    pricingStatus: 'idle',
    marketPriceRange: null,
    demandData: null,
    demandStatus: 'idle',
    currencyRates: null,
    vwAlerts: [],

    // ── Geolocation ──────────────────────────────────────────
    runGeolocate: async () => {
        set({ geoStatus: 'loading' });
        try {
            const resp = await fetch(`${API_BASE}/api/intelligence/geolocate`);
            const json = await resp.json();
            if (json.success && json.data) {
                set({ geoData: json.data, geoStatus: 'success' });
            } else {
                set({ geoStatus: 'failed' });
            }
        } catch {
            set({ geoStatus: 'failed' });
        }
    },

    // ── Product Pre-fill ─────────────────────────────────────
    runPreFill: async (urlOrName: string) => {
        set({ preFillStatus: 'loading' });
        try {
            // More robust URL detection: check for protocol or common TLDs
            let isUrl = false;
            try {
                // Try parsing as URL with protocol
                new URL(urlOrName.startsWith('http') ? urlOrName : `https://${urlOrName}`);
                isUrl = true;
            } catch {
                // Not a valid URL, check for common patterns
                isUrl = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(urlOrName) && 
                        !urlOrName.includes(' ') && 
                        urlOrName.length > 5;
            }
            
            const body = isUrl ? { url: urlOrName.startsWith('http') ? urlOrName : `https://${urlOrName}` } : { productName: urlOrName };

            const resp = await fetch(`${API_BASE}/api/intelligence/prefill-product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const json = await resp.json();
            if (json.success && json.data) {
                set({ preFillData: json.data, preFillStatus: 'success' });
            } else {
                set({ preFillStatus: 'failed' });
            }
        } catch {
            set({ preFillStatus: 'failed' });
        }
    },

    // ── Competitor Discovery ─────────────────────────────────
    runCompetitorDiscovery: async (keyword, category, geography, tier) => {
        set({ competitorStatus: 'loading' });
        try {
            const resp = await fetch(`${API_BASE}/api/intelligence/competitors`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, category, geography, tier }),
            });
            const json = await resp.json();
            if (json.success && json.data?.competitors) {
                set({
                    discoveredCompetitors: json.data.competitors,
                    competitorStatus: 'success',
                });
            } else {
                set({ competitorStatus: 'failed' });
            }
        } catch {
            set({ competitorStatus: 'failed' });
        }
    },

    // ── Competitor Price Scraping ─────────────────────────────
    runPriceScraping: async (urls, tier, userDomain) => {
        set({ pricingStatus: 'loading' });
        try {
            const resp = await fetch(`${API_BASE}/api/intelligence/scrape-pricing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ urls, tier, userDomain }),
            });
            const json = await resp.json();
            if (json.success && json.data?.results) {
                const pricing = json.data.results;
                set({
                    competitorPricing: pricing,
                    marketPriceRange: computeMarketRange(pricing),
                    pricingStatus: 'success',
                });
            } else {
                set({ pricingStatus: 'failed' });
            }
        } catch {
            set({ pricingStatus: 'failed' });
        }
    },

    // ── Market Demand ────────────────────────────────────────
    runDemandAnalysis: async (keyword, country, tier) => {
        set({ demandStatus: 'loading' });
        try {
            const resp = await fetch(`${API_BASE}/api/intelligence/demand`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ keyword, country, tier }),
            });
            const json = await resp.json();
            if (json.success && json.data) {
                set({ demandData: json.data, demandStatus: 'success' });
            } else {
                set({ demandStatus: 'failed' });
            }
        } catch {
            set({ demandStatus: 'failed' });
        }
    },

    // ── Confirm Competitors ─────────────────────────────────
    confirmCompetitors: (selected) => {
        set({ confirmedCompetitors: selected });
    },

    // ── Van Westendorp Validation ────────────────────────────
    validateVanWestendorp: (sliders, marketData) => {
        const alerts: ValidationAlert[] = [];

        if (!marketData) {
            set({ vwAlerts: alerts });
            return alerts;
        }

        // Alert 1: "Too Expensive" is below market average
        if (sliders.tooExpensive < marketData.competitorAvg) {
            alerts.push({
                type: 'CONFIDENCE_ALERT',
                severity: 'High',
                message: `Your "Too Expensive" threshold ($${sliders.tooExpensive}) is below the market average ($${marketData.competitorAvg}). Your customers may accept a higher price than you think.`,
                suggestion: `Consider raising your ceiling to at least $${Math.round(marketData.competitorAvg * 1.1)}`,
            });
        }

        // Alert 2: "Bargain" above market max (accidentally premium)
        if (sliders.bargain > marketData.competitorMax) {
            alerts.push({
                type: 'POSITIONING_ALERT',
                severity: 'Medium',
                message: `Your "Bargain" price ($${sliders.bargain}) is above the highest competitor price ($${marketData.competitorMax}). You may be positioning as ultra-premium.`,
                suggestion: 'Review your competitive positioning — this is a premium play, not a value play.',
            });
        }

        // Alert 3: Too cheap below half of market minimum (race to bottom)
        if (sliders.tooCheap < marketData.competitorMin * 0.5) {
            alerts.push({
                type: 'RACE_TO_BOTTOM_ALERT',
                severity: 'High',
                message: `Your quality floor ($${sliders.tooCheap}) is significantly below the cheapest competitor ($${marketData.competitorMin}). Pricing this low may damage brand perception.`,
            });
        }

        set({ vwAlerts: alerts });
        return alerts;
    },

    // ── Reset ────────────────────────────────────────────────
    resetIntelligence: () => set({
        geoData: null,
        geoStatus: 'idle',
        preFillData: null,
        preFillStatus: 'idle',
        discoveredCompetitors: [],
        confirmedCompetitors: [],
        competitorStatus: 'idle',
        competitorPricing: [],
        pricingStatus: 'idle',
        marketPriceRange: null,
        demandData: null,
        demandStatus: 'idle',
        currencyRates: null,
        vwAlerts: [],
    }),
}));
