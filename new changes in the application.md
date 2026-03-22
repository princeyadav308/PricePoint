# PricePoint: Auto-Intelligence Upgrade
## Agent Engineering Brief — Full Implementation Specification

**Document Type:** Senior Engineering Specification  
**Project:** PricePoint — Pricing Intelligence SaaS Platform  
**Scope:** Transform MindMap from a manual form-filler into a real-time intelligence engine  
**Stack:** Next.js · Node.js/Express · Zustand · Claude API · React-PDF  
**Author:** Product Owner  
**Status:** Ready for Implementation

---

## 1. Mission Statement

PricePoint currently asks users to guess answers they don't know: competitor prices, market demand, tax rates, and volume estimates. A user paying $2,000 for an Investor Grade report should not be filling out 50 fields manually.

**The goal of this upgrade is simple:** wherever the user is currently guessing, the system should already know. Every API call we make on behalf of the user is a moment of perceived magic — it's what separates a form from a product.

This brief specifies exactly what to build, in what order, using which tools, with full data contracts between each layer.

---

## 2. Current Architecture (What Exists Today)

```
User fills MindMap manually
  → Raw session data JSON
  → POST /api/generatePricingReport
  → Claude API (claude-opus-4-6)
  → Structured JSON response
  → React-PDF renders PDF in browser
  → User downloads PDF
```

**The problem:** The session data is only as good as what the user types. No external validation. No market data. No competitive intelligence. The Claude prompt receives user opinions, not market facts.

---

## 3. Target Architecture (What We're Building)

```
User enters Product Name / URL
  → [AUTO] IP Geolocation → pre-fill country, currency, suggest VAT rate
  → [AUTO] URL Scraper → pre-fill product name, description, category
  → User confirms/adjusts pre-filled data
  → User enters competitor URL(s) OR product keyword
  → [AUTO] Competitor Discovery (Apify Google Search) → find 3–5 competitor URLs
  → [AUTO] Price Scraper (Scrapingdog) → extract competitor pricing from each URL
  → [AUTO] Market Demand (DataForSEO) → pull monthly search volume for product keyword
  → [AUTO] Currency & Tax (AbstractAPI / Fixer.io) → live rates + VAT by country
  → Enriched session data JSON (user answers + real market data)
  → POST /api/generatePricingReport
  → Claude API — receives enriched JSON, acts as Chief Strategy Officer
  → Structured JSON with full pricing analysis
  → React-PDF renders investor-grade PDF
  → User downloads PDF
```

**The key shift:** Claude no longer receives opinions. Claude receives facts — scraped prices, validated demand numbers, live tax rates — and performs the strategic interpretation on top of real data.

---

## 4. Phase-by-Phase Implementation Plan

### PHASE 1 — The Intelligence Hook (First 5 Minutes of User Experience)

**Objective:** Before the user types a single word, impress them.

#### Step 1.1 — IP Geolocation on Page Load

- **Trigger:** User lands on the MindMap start screen
- **API:** AbstractAPI Geolocation (`https://ipgeolocation.abstractapi.com/v1/`)
- **What to extract:** `country_code`, `country`, `currency.currency_code`, `timezone`
- **Action:** Auto-populate the "Country" and "Currency" selector fields silently
- **UI treatment:** Show a small badge: *"📍 Detected: United Kingdom · GBP"* with an edit link
- **Do not block** the user flow if the API fails — gracefully fall back to manual entry

```typescript
// Backend endpoint: GET /api/intelligence/geolocate
// Called on app load, returns:
{
  country: "United Kingdom",
  countryCode: "GB",
  currency: "GBP",
  suggestedVatRate: 20,         // derived from countryCode lookup table
  timezone: "Europe/London"
}
```

**VAT rate lookup table** (build this as a static JSON in your backend, do not call an API for this — it rarely changes):

```json
{
  "GB": 20, "DE": 19, "FR": 20, "IT": 22, "ES": 21,
  "US": 0, "CA": 5, "AU": 10, "IN": 18, "SG": 9,
  "JP": 10, "BR": 12, "MX": 16, "ZA": 15, "AE": 5
}
```

---

#### Step 1.2 — URL/Product Name Scrape → Pre-fill

- **Trigger:** User enters their product URL or product name in the very first field ("What is your website or product name?")
- **This is the new Question 0** — replace the current Journey Entry Point with this single field
- **API for URL scraping:** Scrapingdog (`https://api.scrapingdog.com/scrape`)
- **Processing:** Send scraped HTML to Claude with the following micro-prompt:

```
You are a product intelligence extractor. Given the following HTML from a product website, 
extract and return ONLY a JSON object with these fields:
{
  "productName": string,
  "productDescription": string (2-3 sentences max, plain text),
  "productCategory": string (one of: Physical Product, Service, Digital Product),
  "productSubCategory": string (e.g. "SaaS Analytics", "E-commerce", "Consulting"),
  "targetCustomer": string (1 sentence),
  "geographyServed": string,
  "uniqueValueProp": string (1 sentence)
}
If a field cannot be determined, return null for that field. Return ONLY valid JSON.

HTML:
{{HTML_CONTENT}}
```

- **Action:** Pre-populate the "Describe Your Product" and "Product Classification" sections
- **UI treatment:** Show each pre-filled field with a ✨ sparkle icon and label *"Auto-detected"*. Every field must be editable. Include a "Re-analyze" button.
- **Fallback:** If no URL is provided or scrape fails, proceed with the standard manual flow — no error shown to user

---

### PHASE 2 — Market Research Auto-Intelligence

This replaces the current manual Market Research branch entirely.

#### Step 2.1 — Competitor Discovery

- **Trigger:** User completes Product Classification (or the pre-fill step above provides a category)
- **API:** Apify Google Search Scraper Actor (`apify/google-search-scraper`)
- **Query construction:**

```typescript
function buildCompetitorQuery(productName: string, category: string, geography: string): string {
  // Examples of what this generates:
  // "SaaS project management tool pricing site:producthunt.com OR site:g2.com OR site:capterra.com"
  // "handmade candle pricing UK competitors"
  // "freelance UX design rates London"
  
  const geoModifier = geography !== "US" ? geography : "";
  return `${productName} ${category} pricing competitors ${geoModifier}`.trim();
}
```

- **What to extract from Apify results:** Top 5 organic results where URL is not the user's own domain, Wikipedia, Reddit, or news sites
- **Return to frontend:**

```typescript
// GET /api/intelligence/competitors?keyword=X&category=Y&geography=Z
{
  competitors: [
    {
      name: "Competitor A",
      url: "https://competitora.com",
      snippet: "Google snippet text",
      priceFound: null  // null at this stage — filled in next step
    }
    // ... up to 5
  ]
}
```

- **UI treatment:** Show a card: *"We found 5 potential competitors. Confirm which ones are relevant."* 
  - Checkbox list — user deselects irrelevant ones
  - "Add a competitor manually" input field always visible
  - Maximum 5 competitors go through to the price scraping step (API cost control)

---

#### Step 2.2 — Competitor Price Extraction

- **Trigger:** User confirms their competitor list (from step 2.1) or manually submits competitor URLs
- **API:** Scrapingdog for each URL, then Claude to extract pricing
- **Process (per competitor):**

```
1. Scrapingdog scrapes the competitor URL
2. Extract only the text content (strip HTML tags)  
3. Send to Claude with this extraction prompt:

"You are a pricing intelligence extractor. From the following webpage text, 
find all pricing information and return ONLY this JSON:
{
  'plans': [
    {
      'name': string (plan name, e.g. 'Starter', 'Pro', 'Enterprise'),
      'price': number (numeric value only, no symbols),
      'currency': string (3-letter ISO code, e.g. 'USD'),
      'billingCycle': 'monthly' | 'annual' | 'one-time' | 'unknown',
      'isPerSeat': boolean,
      'keyFeatures': [string] (max 3 features)
    }
  ],
  'hasFreeTrialOrFreeTier': boolean,
  'pricingModelType': 'flat' | 'per-seat' | 'usage-based' | 'tiered' | 'unknown',
  'websiteUrl': string
}
If no pricing found, return { 'plans': [], 'pricingNotFound': true }
Return ONLY valid JSON."

TEXT: {{SCRAPED_TEXT}}
```

- **UI treatment:** Display a live "Analysing competitor pricing..." skeleton loader per competitor as they resolve
- **Final rendered output in MindMap:**

```
┌─────────────────────────────────────────────────────┐
│  🔍 Competitor Pricing Intelligence                  │
├──────────────┬──────────┬───────────┬───────────────┤
│ Competitor   │ From     │ To        │ Model         │
├──────────────┼──────────┼───────────┼───────────────┤
│ Competitor A │ $29/mo   │ $199/mo   │ Per seat      │
│ Competitor B │ $49/mo   │ $299/mo   │ Flat rate     │
│ Competitor C │ Free     │ $79/mo    │ Freemium      │
├──────────────┼──────────┼───────────┼───────────────┤
│ Market Range │ $29      │ $299      │               │
└──────────────┴──────────┴───────────┴───────────────┘
  ✏️  Edit any value  |  + Add competitor manually
```

- This table **replaces** the manual "Lowest competitor price" and "Highest competitor price" slider inputs
- The min/max values from this table automatically pre-populate those fields in the session data

---

#### Step 2.3 — Market Demand Signal

- **Trigger:** After product name/keyword is confirmed
- **API:** DataForSEO Keywords Data API (`https://api.dataforseo.com/v3/keywords_data/google/search_volume/live`)
- **Query:** Product name + top 2–3 keyword variants (construct with Claude or a simple rule)
- **What to extract:** `search_volume` (monthly), `competition` (LOW/MEDIUM/HIGH), `cpc` (cost per click — a proxy for commercial intent)
- **Return:**

```typescript
// POST /api/intelligence/demand
{
  keyword: "project management SaaS",
  monthlySearchVolume: 22000,
  competitionLevel: "HIGH",
  costPerClick: 4.20,
  demandSignal: "Strong",    // derived: <1K = Niche, 1K-10K = Moderate, 10K+ = Strong
  demandInterpretation: "22,000 monthly searches indicates validated market demand. High CPC ($4.20) confirms commercial intent — buyers are actively spending to reach this audience."
}
```

- **UI treatment:** Replace the "Expected monthly sales volume" guesswork field with:

```
📊 Market Demand Signal
─────────────────────────────────
Monthly Searches:  22,000  [Strong]
Competition:       High
Commercial Intent: $4.20 CPC

"High search volume with strong commercial intent validates 
 your product's market demand. Use this to anchor your 
 volume assumptions below."
─────────────────────────────────
[Override with my own estimate]
```

---

#### Step 2.4 — Live Currency & Tax Rates

- **Trigger:** Country confirmed (either auto-detected or manually selected)
- **API for currency:** Fixer.io (`http://data.fixer.io/api/latest`) OR ExchangeRate-API (free tier)
- **API for tax confirmation:** AbstractAPI VAT Validation (or use the static lookup table from Step 1.1 — recommended for speed)
- **What to extract:** Live conversion rates to user's base currency, confirmed VAT/GST rate for their country
- **Action:** All price inputs/outputs in the app dynamically convert to the user's local currency. When PDF is generated, all numbers appear in the user's currency.
- **UI treatment:** Small currency pill on every price input: "GBP £" with auto-conversion tooltip

---

### PHASE 3 — The Van Westendorp Confidence Layer

This is a new validation layer that runs after the user sets their psychological price sliders.

#### Step 3.1 — Market Cross-Reference Alert

- **Trigger:** User submits the 4 Van Westendorp sliders
- **Logic:**

```typescript
function validateVanWestendorp(
  userSliders: { tooCheap: number, bargain: number, gettingExpensive: number, tooExpensive: number },
  marketData: { competitorMin: number, competitorMax: number, competitorAvg: number }
): ValidationResult {
  
  const alerts = [];
  
  // Alert 1: User's "Too Expensive" ceiling is below market average
  if (userSliders.tooExpensive < marketData.competitorAvg) {
    alerts.push({
      type: "CONFIDENCE_ALERT",
      severity: "High",
      message: `Your "Too Expensive" threshold ($${userSliders.tooExpensive}) is below the market average ($${marketData.competitorAvg}). Your customers may accept a higher price than you think.`,
      suggestion: `Consider raising your ceiling to at least $${Math.round(marketData.competitorAvg * 1.1)}`
    });
  }
  
  // Alert 2: User's "Bargain" price is above market max (they're accidentally premium)
  if (userSliders.bargain > marketData.competitorMax) {
    alerts.push({
      type: "POSITIONING_ALERT", 
      severity: "Medium",
      message: `Your "Bargain" price ($${userSliders.bargain}) is above the highest competitor price found ($${marketData.competitorMax}). You may be unconsciously positioning as ultra-premium.`,
      suggestion: "Review your competitive positioning — this is a premium play, not a value play."
    });
  }
  
  // Alert 3: Too cheap threshold below all competitors (race to bottom risk)
  if (userSliders.tooCheap < marketData.competitorMin * 0.5) {
    alerts.push({
      type: "RACE_TO_BOTTOM_ALERT",
      severity: "High", 
      message: `Your quality floor ($${userSliders.tooCheap}) is significantly below the cheapest competitor ($${marketData.competitorMin}). Pricing this low may damage brand perception.`
    });
  }
  
  return { alerts, isHealthy: alerts.filter(a => a.severity === "High").length === 0 };
}
```

- **UI treatment:** After slider submission, show alert cards inline before proceeding to price generation. User can acknowledge and adjust, or proceed anyway.

---

## 5. Backend API Specifications

All new intelligence endpoints live under `/api/intelligence/`. Each endpoint must:
- Return within 10 seconds (use Promise.race with a 10s timeout and graceful fallback)
- Return `{ success: true, data: {...} }` on success
- Return `{ success: false, fallback: true, message: string }` on failure — never block user flow
- Log all third-party API errors to your monitoring service

### New Endpoints to Build

```
GET  /api/intelligence/geolocate
     → Auto-detect user location
     → Returns: { country, countryCode, currency, suggestedVatRate, timezone }

POST /api/intelligence/prefill-product
     Body: { url?: string, productName?: string }
     → Scrape URL (if provided) + Claude extraction
     → Returns: { productName, description, category, subCategory, targetCustomer, valueUsp }

POST /api/intelligence/competitors
     Body: { keyword: string, category: string, geography: string }  
     → Apify Google Search
     → Returns: { competitors: [{ name, url, snippet }] }

POST /api/intelligence/scrape-pricing
     Body: { urls: string[] }  // max 5 URLs
     → Scrapingdog per URL + Claude extraction per URL
     → Returns: { results: [{ url, plans: [...], pricingModelType, hasFreeTrialOrFreeTier }] }

POST /api/intelligence/demand
     Body: { keyword: string, country: string }
     → DataForSEO search volume
     → Returns: { monthlySearchVolume, competitionLevel, costPerClick, demandSignal, demandInterpretation }

GET  /api/intelligence/currency
     Query: ?base=GBP
     → Fixer.io or ExchangeRate-API
     → Returns: { base, rates: {...}, timestamp }
```

---

## 6. The Enriched Session Data Contract

This is the most important data structure in the system. It is what gets sent to Claude for report generation. It must contain both user inputs AND the auto-intelligence data.

```typescript
interface EnrichedSessionData {
  
  // ── Meta ──────────────────────────────────────────────────────────────
  journeyType: "new_product" | "price_audit";
  reportTier: "basic" | "founder_ready" | "investor_grade";
  sessionId: string;
  generatedAt: string; // ISO timestamp
  
  // ── User-provided ──────────────────────────────────────────────────────
  productName: string;
  productUrl?: string;
  productCategory: "Physical Product" | "Service" | "Digital Product";
  productSubCategory: string;
  productDescription: string; // From textarea OR pre-filled from URL scrape
  targetCustomer: string;
  geography: string;
  currency: string;
  
  // ── Unit Economics (user-provided via table) ───────────────────────────
  unitEconomics: {
    costBreakdown: Record<string, number>; // e.g. { rawMaterials: 12, labor: 8, ... }
    totalCostPerUnit: number;              // sum of above
    desiredMarginPercent: number;
    minimumViablePrice: number;            // cost / (1 - margin)
  };
  
  // ── Auto-Intelligence: Competitive Data ───────────────────────────────
  competitiveIntelligence: {
    source: "auto_scraped" | "user_provided" | "mixed";
    scrapedAt: string;
    competitors: Array<{
      name: string;
      url: string;
      plans: Array<{
        name: string;
        price: number;
        currency: string;
        billingCycle: string;
        isPerSeat: boolean;
        keyFeatures: string[];
      }>;
      pricingModelType: string;
      hasFreeTrialOrFreeTier: boolean;
    }>;
    marketPriceRange: {
      min: number;
      max: number;
      average: number;
      median: number;
      currency: string;
    };
  };
  
  // ── Auto-Intelligence: Market Demand ──────────────────────────────────
  marketDemand: {
    source: "dataforseo" | "user_estimate" | "unavailable";
    keyword: string;
    monthlySearchVolume: number | null;
    competitionLevel: "LOW" | "MEDIUM" | "HIGH" | null;
    costPerClick: number | null;
    demandSignal: "Niche" | "Moderate" | "Strong" | null;
    demandInterpretation: string;
  };
  
  // ── Auto-Intelligence: Tax & Currency ────────────────────────────────
  taxAndCurrency: {
    country: string;
    countryCode: string;
    vatGstRate: number;           // e.g. 20 for UK
    vatInclusive: boolean;        // user's choice
    baseCurrency: string;         // e.g. "GBP"
    usdConversionRate: number;    // for standardized analysis
  };
  
  // ── Van Westendorp Sliders ────────────────────────────────────────────
  vanWestendorp: {
    tooCheap: number;
    bargain: number;
    gettingExpensive: number;
    tooExpensive: number;
    validationAlerts: Array<{
      type: string;
      severity: "High" | "Medium" | "Low";
      message: string;
    }>;
  };
  
  // ── PricePoint Engine Outputs ─────────────────────────────────────────
  pricingResult: {
    survivalPrice: number;
    bestPrice: number;
    premiumPrice: number;
    pmc: number;
    opp: number;
    ipp: number;
    pme: number;
  };
  
  // ── Journey-specific fields (Audit Mode) ─────────────────────────────
  auditContext?: {
    currentPrice: number;
    monthsSelling: number;
    monthlyVolume: number;
    currentSentiment: string;
    howPriceWasSet: string;
    hasCompetitionChanged: boolean;
    hasCogsChanged: boolean;
  };
  
  // ── Additional MindMap Answers (raw) ─────────────────────────────────
  mindmapAnswers: Record<string, unknown>;
}
```

---

## 7. The Updated Claude System Prompt (Chief Strategy Officer Mode)

The existing Claude prompt must be updated to consume the `competitiveIntelligence` and `marketDemand` fields and treat them as ground truth. Add this block to the existing system prompt, immediately after the Van Westendorp outputs section:

```
───────────────────────────────────────────────
AUTO-INTELLIGENCE DATA (VERIFIED MARKET DATA — HIGHER TRUST THAN USER ESTIMATES)
───────────────────────────────────────────────

COMPETITIVE INTELLIGENCE (scraped from live competitor websites):
Market Price Range: ${{MARKET_MIN}} – ${{MARKET_MAX}} (avg: ${{MARKET_AVG}})
Data Source: {{COMPETITIVE_SOURCE}} | Scraped: {{SCRAPED_AT}}

Competitor Breakdown:
{{COMPETITORS_JSON}}

MARKET DEMAND SIGNAL (DataForSEO):
Keyword: "{{DEMAND_KEYWORD}}"
Monthly Search Volume: {{MONTHLY_SEARCH_VOLUME}}
Competition Level: {{COMPETITION_LEVEL}}
Cost Per Click: ${{CPC}} (commercial intent proxy)
Demand Signal: {{DEMAND_SIGNAL}}

TAX & CURRENCY CONTEXT:
Country: {{COUNTRY}} | VAT/GST Rate: {{VAT_RATE}}%
Base Currency: {{CURRENCY}} | USD Rate: {{USD_RATE}}

VAN WESTENDORP VALIDATION ALERTS:
{{VW_ALERTS_JSON}}

───────────────────────────────────────────────
CRITICAL INSTRUCTION FOR AUTO-INTELLIGENCE DATA:
When the above market data is present (source = "auto_scraped" or "dataforseo"), 
treat it as verified external data — more reliable than the user's own estimates.
Cross-reference all your analysis against this market reality.
If user assumptions conflict with market data, flag this explicitly as a 
"Market Reality Gap" finding. For example:
- If the user's target price is above the market max → flag premium positioning risk
- If user's volume assumptions imply market share >15% in year 1 → flag as aggressive
- If user's CAC estimate is below industry CPC benchmarks → flag as likely underestimated
```

---

## 8. Frontend State Management (Zustand)

The new intelligence layer requires careful async state management. Use this Zustand store structure:

```typescript
interface IntelligenceStore {
  // Geolocation
  geoData: GeoData | null;
  geoStatus: "idle" | "loading" | "success" | "failed";
  
  // Product pre-fill
  preFillData: PreFillData | null;
  preFillStatus: "idle" | "loading" | "success" | "failed";
  
  // Competitors
  discoveredCompetitors: Competitor[];
  confirmedCompetitors: Competitor[];   // after user confirms
  competitorStatus: "idle" | "loading" | "scraping" | "success" | "failed";
  
  // Pricing data per competitor
  competitorPricing: Record<string, CompetitorPricing>;
  pricingStatus: Record<string, "idle" | "loading" | "success" | "failed">;
  
  // Demand
  demandData: DemandData | null;
  demandStatus: "idle" | "loading" | "success" | "failed";
  
  // Currency
  currencyRates: Record<string, number> | null;
  
  // Validation alerts
  vwAlerts: ValidationAlert[];
  
  // Computed
  enrichedSessionData: EnrichedSessionData | null;
  
  // Actions
  runGeolocate: () => Promise<void>;
  runPreFill: (urlOrName: string) => Promise<void>;
  runCompetitorDiscovery: (keyword: string) => Promise<void>;
  runPriceScraping: (urls: string[]) => Promise<void>;
  runDemandAnalysis: (keyword: string) => Promise<void>;
  confirmCompetitors: (selected: Competitor[]) => void;
  buildEnrichedSessionData: (mindmapAnswers: Record<string, unknown>) => EnrichedSessionData;
}
```

**Key rule:** Every `run*` action must be non-blocking. The MindMap progresses independently. Intelligence data loads in parallel and enriches the session silently. The user sees loading indicators only when data is about to be *displayed* to them (e.g., the competitor table).

---

## 9. API Keys Required (What to Set Up Before Starting)

Set these in your `.env` file. All have free tiers sufficient for development:

```env
# ─── Intelligence APIs ──────────────────────────────────
ABSTRACTAPI_GEOLOCATION_KEY=     # abstractapi.com — IP geolocation
SCRAPINGDOG_API_KEY=             # scrapingdog.com — web scraping (1,000 free/mo)
APIFY_API_TOKEN=                 # apify.com — Google Search (free tier available)
DATAFORSEO_LOGIN=                # dataforseo.com — keyword volume (pay-as-you-go, ~$0.0005/call)
DATAFORSEO_PASSWORD=             # dataforseo.com
FIXER_API_KEY=                   # fixer.io — currency rates (100 free/mo)

# ─── Existing ────────────────────────────────────────────
ANTHROPIC_API_KEY=               # Already configured

# ─── Rate Limit Config ───────────────────────────────────
MAX_COMPETITOR_SCRAPES=5         # Cap scraping per session
INTELLIGENCE_TIMEOUT_MS=10000   # 10s timeout on all external calls
```

---

## 10. Rate Limiting & Cost Controls

This is a paid product — protect the API budget carefully.

```typescript
// Rules to implement in your backend middleware:

const RATE_LIMITS = {
  // Per user session (identified by sessionId)
  competitorScrapes: 5,          // max 5 competitors scraped per report
  demandQueries: 3,              // max 3 keyword queries per session
  preFillAttempts: 2,            // max 2 URL pre-fills per session
  
  // Per IP address (daily)
  intelligenceCallsPerIpPerDay: 20,
  
  // Tier-based intelligence depth
  basic: {
    competitorScraping: false,   // No scraping for basic tier
    demandData: false,           // No demand data for basic tier
    preFill: true,               // URL pre-fill available
    geolocate: true,
  },
  founder_ready: {
    competitorScraping: true,    // Up to 3 competitors
    demandData: true,
    preFill: true,
    geolocate: true,
    maxCompetitors: 3,
  },
  investor_grade: {
    competitorScraping: true,    // Up to 5 competitors  
    demandData: true,
    preFill: true,
    geolocate: true,
    maxCompetitors: 5,
  }
};
```

**Cost estimate per Investor Grade report:**
- Scrapingdog (5 scrapes): ~$0.005
- Apify Google Search: ~$0.01
- DataForSEO (3 queries): ~$0.002
- AbstractAPI (1 geolocate): Free tier
- Claude API (16K tokens): ~$0.24
- **Total per Investor Grade report: ~$0.26**
- At $149–$299 price point, this is a sub-0.2% COGS — build this without hesitation.

---

## 11. UX Flow for the New "Question 0" Experience

Replace the current Journey Entry Points with this revised first screen:

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                    │
│   Let's start with your product.                                   │
│                                                                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  🌐  Enter your website URL or product name              │    │
│   │      e.g. "myproduct.com" or "BuildMetrics AI"           │    │
│   └──────────────────────────────────────────────────────────┘    │
│                                                                    │
│   [ Analyse My Product → ]                                         │
│                                                                    │
│   ─────────── or ───────────                                       │
│                                                                    │
│   [ I don't have a website yet → continue manually ]               │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

  ↓ After clicking "Analyse My Product":

┌──────────────────────────────────────────────────────────────────┐
│   ✨ Analysing your product...                                     │
│                                                                    │
│   ████████████░░░░░░  Scraping product details                    │
│   ████████████████░░  Detecting your location                     │
│   ░░░░░░░░░░░░░░░░░░  Finding competitors (next)                  │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘

  ↓ After completion:

┌──────────────────────────────────────────────────────────────────┐
│   ✅ Here's what we found about your product:                      │
│                                                                    │
│   Product Name:     BuildMetrics AI           [✏️ Edit]            │
│   Category:         Digital Product — SaaS    [✏️ Edit]            │
│   Location:         📍 United Kingdom · GBP   [✏️ Edit]            │
│   VAT Rate:         20% (standard UK rate)    [✏️ Edit]            │
│                                                                    │
│   Description (auto-detected):                                     │
│   "Real-time cost variance analytics for construction              │
│   project managers, with AI-driven schedule risk prediction."      │
│                                                                    │
│   [ Looks right — Continue → ]   [ Edit everything manually ]     │
└──────────────────────────────────────────────────────────────────┘
```

---

## 12. Verification Checklist

Before calling Phase 1 complete, verify each of the following:

### Phase 1 Verification
- [ ] IP Geolocation fires on page load and pre-fills country/currency within 2 seconds
- [ ] VAT rate auto-populates based on detected country (spot-check: UK=20, DE=19, US=0)
- [ ] URL scrape + Claude extraction pre-fills at least 4 of 7 fields for a real product URL
- [ ] All pre-filled fields are editable without clearing other fields
- [ ] If geolocation fails → manual selector appears, no error message to user
- [ ] If URL scrape fails → form proceeds in standard manual mode

### Phase 2 Verification
- [ ] Competitor discovery returns 3–5 results for a real product category keyword
- [ ] Competitor price scraping extracts at least one price for 3 of 5 known competitor sites
- [ ] Market price range (min/max/avg) auto-populates the competitive benchmark fields
- [ ] DataForSEO demand signal renders in the "Expected Volume" section
- [ ] Currency conversion updates all price display fields within 1 second of country change

### Phase 3 Verification  
- [ ] Van Westendorp alert fires correctly when "Too Expensive" < market average
- [ ] Alert is dismissible but cannot be ignored (user must acknowledge to proceed)
- [ ] All 3 alert types trigger correctly with mock data

### Report Verification (Investor Grade)
- [ ] The `competitiveIntelligence` block appears in Claude's prompt (check server logs)
- [ ] Claude's report references real competitor names from the scraped data
- [ ] Chart data for `competitive_price_scatter` uses scraped competitor prices, not estimates
- [ ] PDF renders without crashing when `competitiveIntelligence` data is present
- [ ] PDF renders correctly when `competitiveIntelligence` data is absent (fallback mode)

---

## 13. Error Handling Philosophy

**Golden rule: Intelligence should enhance, never block.**

Every single external API call — Scrapingdog, Apify, DataForSEO, AbstractAPI, Fixer.io — must have a graceful fallback that allows the user to continue manually. Never show a user-facing error from a third-party API. Log it internally, degrade gracefully, move on.

```typescript
// Pattern to use everywhere:
async function fetchWithFallback<T>(
  fetchFn: () => Promise<T>,
  fallback: T,
  timeoutMs: number = 10000
): Promise<T> {
  try {
    return await Promise.race([
      fetchFn(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      )
    ]);
  } catch (error) {
    console.error("[Intelligence fallback triggered]", error);
    return fallback;
  }
}
```

---

## 14. Summary: What the Agent Must Build

In priority order:

1. **`GET /api/intelligence/geolocate`** → AbstractAPI integration + VAT lookup table
2. **`POST /api/intelligence/prefill-product`** → Scrapingdog + Claude micro-extraction  
3. **New Question 0 UI** → "Enter your URL" first screen with loading states
4. **`POST /api/intelligence/competitors`** → Apify Google Search integration
5. **`POST /api/intelligence/scrape-pricing`** → Scrapingdog × N + Claude pricing extractor
6. **Competitor confirmation UI** → The table with checkboxes in the MindMap
7. **`POST /api/intelligence/demand`** → DataForSEO integration
8. **Demand signal UI** → Replace "Expected Volume" field with demand card
9. **`GET /api/intelligence/currency`** → Fixer.io integration + dynamic price display
10. **Van Westendorp validation logic** → Cross-reference alerts
11. **Update `EnrichedSessionData`** → Wire all intelligence data into the session object
12. **Update Claude prompt** → Add the Auto-Intelligence data block
13. **Rate limiting middleware** → Protect API budget per session/tier
14. **Update `PricingReportPDF.tsx`** → Use scraped competitor names in chart data

**Do not start item N+1 until item N is verified against the checklist in Section 12.**

---

*End of Brief. Total estimated implementation: 3–5 engineering days for a senior full-stack developer familiar with the existing codebase.*
