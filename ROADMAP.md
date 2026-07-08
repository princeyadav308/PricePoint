# PricePoint — Master Roadmap & Checklist

> **Last Updated**: 2026-07-08  
> **Current Phase**: Phase 5 ~95% Complete — PDF Tier Spec ✅ + Intelligence Frontend ✅  
> **Next Task**: Competitor confirmation UI polish + deployment prep (Phase 6)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Done & working |
| 🔨 | In progress / partially done |
| ⬜ | Not started |
| 🔑 | Blocked (missing API key / dependency) |
| 🐛 | Has known bugs |

---

## 1 · Core Platform (Phase 1–3) — ✅ COMPLETE

Everything below shipped and is working in the current codebase.

### 1.1 · Frontend Foundation
- [x] **Vite + React 18 + TypeScript** scaffold (`client/`)
- [x] **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- [x] **Dark mode** toggle (CSS class strategy)
- [x] **Routing** — React Router v7 (App.tsx switches `LandingView` ↔ `MindMap`)
- [x] **Supabase Auth** — Google OAuth sign-in, session hydration on mount
- [x] **Header / Footer** layout components (absolute overlays)
- [x] **Landing page** (`LandingView.tsx` — 28KB, full marketing page)

### 1.2 · MindMap Engine
- [x] **React Flow** canvas with custom node types
- [x] **Dagre auto-layout** (`useAutoLayout.ts`) — every node addition re-layouts
- [x] **Node types**: `RootNode`, `JourneyNode`, `StageNode (classificationNode)`, `QuestionNode`, `ResultNode`
- [x] **Animated edges** (custom `animatedEdge` type with color variants)
- [x] **Journey selection** — "Audit Existing Price" vs "Set Launch Price" (dims the other)
- [x] **Question config system** (`questions.config.ts` — 40KB) — all questions defined as a typed config tree
- [x] **Branching flow** — `spawnBranches()` for parallel question paths (Market Research, Distribution, Psychological)
- [x] **Convergence** — `spawnConvergence()` merges 3 branches into Van Westendorp with Strict Coordinate Anchoring
- [x] **Result node** — `spawnResult()` runs pricing engine and renders Trinity Quote

### 1.3 · Pricing Engine
- [x] **`pricingEngine.ts`** — full calculation engine (survival/best/premium prices)
- [x] **Van Westendorp PSM** analysis (PMC, OPP, IPP, PME)
- [x] **Cost-plus base** + value multiplier calculations
- [x] **Applied modifiers** (market gravity, distribution, psychological anchoring)

### 1.4 · State Management (Zustand)
- [x] **`useMindMapStore`** — nodes, edges, journey selection, expand/submit/branch/converge/result actions
- [x] **`useSessionStore`** — answers dict, current user (from Supabase), setAnswer/setUser
- [x] **`useIntelligenceStore`** — async intelligence data (geo, prefill, competitors, pricing, demand, VW alerts)

### 1.5 · Backend Foundation
- [x] **Fastify** server with TypeScript + `ts-node` + `nodemon`
- [x] **Prisma ORM** — PostgreSQL with `Lead`, `Session`, `Report` models
- [x] **Supabase** server-side client (`lib/supabase.ts`)
- [x] **CORS** enabled (origin: `*` for dev)

---

## 2 · Payment & Report Pipeline (Phase 4) — ✅ COMPLETE

### 2.1 · Payment Flow
- [x] **Report initialization** (`POST /api/reports/initialize`) — creates Lead + Session + pending Report with `documentId`
- [x] **Dodo Payments checkout** (`POST /api/checkout`) — maps tier → Dodo product ID, creates checkout URL
- [x] **Webhook receiver** (`POST /api/webhooks/dodo`) — marks report as `Paid` on payment success
- [x] **Proactive polling** (`GET /api/reports/status/:documentId`) — checks Dodo API if webhook hasn't fired (localhost fallback)
- [x] **Success page** (`Success.tsx`) — polls status, triggers report generation on payment confirmation

### 2.2 · Claude Report Generation
- [x] **Claude API integration** (`utils/claude.ts` — 38KB) — full prompt engineering
- [x] **`POST /api/generate-report`** — sends enriched session data to Claude, returns structured JSON
- [x] **3-tier prompts**: Basic (10K tokens), Professional (16K tokens), Investor (12K × 2 calls)
- [x] **Journey-type-aware** prompts (established_seller vs new_launcher)
- [x] **Intelligence-enriched prompts** — Claude receives auto-scraped competitive data + demand signals as "higher trust than user estimates"

### 2.3 · PDF Generation
- [x] **Puppeteer** server-side PDF generation (`POST /api/generate-pdf`)
- [x] **React-PDF** client-side rendering (`PricingReportPDF.tsx` — 52KB)
- [x] **`pdfTemplate.ts`** (163KB) — full HTML template with cover page, TOC, charts, and all report sections
- [x] **3 SVG chart generators** — Positioning Map, Rule of 40 Gauge, Margin Erosion Bar
- [x] **ChartEngine.tsx** — client-side chart rendering (13KB)

### 2.4 · User Account
- [x] **Auth modal** (`AuthModal.tsx`) — Google OAuth + email magic link
- [x] **Profile page** (`ProfilePage.tsx`) — user info, report history, re-download PDFs
- [x] **User routes**: `GET /api/user/profile`, `GET /api/user/reports`, `GET /api/user/reports/:documentId`
- [x] **Email delivery** (`utils/email.ts` — Resend integration) — `POST /api/reports/send-email`

---

## 3 · PDF Tier Spec Expansion — ✅ COMPLETE

> Ref: `HANDOFF.md` (now obsolete — all work completed)

### 3.1 · Claude Prompts — ✅ COMPLETE
- [x] Basic tier schema: `van_westendorp_interpretation`, `cost_breakdown_narrative`, `gross_margin_commentary`, `cost_of_inaction` (string), expanded `next_steps` (3→5)
- [x] Professional tier schema: `strategic_verdict`, `tam_sam_narrative`, `positioning_map`, `launch_vs_scale`, `cost_of_inaction` (object), `monitoring_plan` (3 metrics)
- [x] Investor tier Call 1: `investment_thesis` (6-8 paragraphs), `key_findings_summary`, `market_timing_assessment`, `feature_price_mapping`, `competitive_moat_assessment`, `packaging_recommendation_detail`, `price_increase_strategy`, `comparable_company_pricing`, `investor_questions_to_prepare`, `glossary`, `cost_of_inaction`
- [x] Investor tier Call 2: `rule_of_40`, `margin_erosion_audit`, expanded `financial_scenarios`
- [x] Token limits adjusted: Basic 8K→10K, Pro 14K→16K, Investor 8K→12K/call

### 3.2 · PDF Template — New Sections Done
- [x] Cover page restructured (Document ID, clean layout)
- [x] Table of Contents (tier-aware, 1-column Basic, 2-column Founder/Investor)
- [x] Investment Thesis (Investor only, 2-page, 2-column layout)
- [x] Executive Summary restructured (bold headline, verdict callout, stat cards, key findings)
- [x] Strategic Verdict Card (Founder+Investor, pullout card with confidence badge)
- [x] Van Westendorp Visual + Interpretation (moved to ALL tiers)
- [x] Cost Breakdown + Gross Margin (all tiers, 2-column with donut chart)
- [x] Breakeven Table restructured (Gross Margin % column, Months to Recover column, Cost of Inaction callout for Basic)
- [x] Basic: Top Risks + Next Steps (restructured spacing)

### 3.3 · PDF Template — Remaining Sections — ✅ COMPLETE

**Founder Ready sections:**
- [x] Market Sizing (TAM/SAM) — dedicated page
- [x] Competitive Benchmark — own page with horizontal bar chart
- [x] Positioning Map Chart — `generatePositioningMapSVG()` wired
- [x] LTV · CAC · Payback Analysis — dedicated section
- [x] Revenue Scenario Table — restructured with new columns (`monthly_customers`, `gross_profit`, `implied_cac_budget`)
- [x] Cost of Inaction — standalone callout section using `cost_of_inaction` object
- [x] Price Recommendation + Rationale — dedicated section for Founder tier
- [x] Pricing Tier Architecture — own page
- [x] Launch vs. Scale Pricing — section using `launch_vs_scale`
- [x] 90-Day Monitoring Plan — restructured to use `monitoring_plan` array from Claude
- [x] Risk Matrix — restructured
- [x] 3-Phase Implementation Roadmap — own page
- [x] Next Steps — kept

**Investor Grade additional sections:**
- [x] Market Timing Assessment — using `market_timing_assessment`
- [x] Feature-to-Price Mapping — table using `feature_price_mapping`
- [x] Competitive Moat Assessment — using `competitive_moat_assessment`
- [x] LTV · CAC · Payback · Rule of 40 — `generateRuleOf40GaugeSVG()` wired
- [x] 12-Month Revenue Projection Chart — own page
- [x] Margin Erosion + Leakage Audit — `generateMarginErosionBarSVG()` wired
- [x] Packaging Recommendation — using `packaging_recommendation_detail`
- [x] Price Increase Strategy — with timeline
- [x] Pricing Defensibility Statement — own section
- [x] Comparable Company Pricing — table
- [x] Red Flags to Address — own section
- [x] Investor Questions (Q&A) — Q&A cards format
- [x] 4-Phase Roadmap (18 months) — extended from 3 phases
- [x] Glossary of Pricing Terms — using `glossary` array

**All Tiers — Closing sections:**
- [x] Full Input Audit page — clean 2-column table from session data
- [x] Wire 3 SVG generators into their respective sections

---

## 4 · Auto-Intelligence Upgrade (Phase 5) — ✅ ~95% COMPLETE

> Ref: `new changes in the application.md` — full spec

### 4.1 · Backend Intelligence Endpoints — ✅ COMPLETE
All 6 endpoints are built in `server/src/routes/intelligence.ts` (730 lines):

- [x] **`GET /api/intelligence/geolocate`** — AbstractAPI IP geolocation + VAT lookup table
- [x] **`POST /api/intelligence/prefill-product`** — Scrapingdog scrape → Claude extraction (multi-tier: Scrapingdog → direct fetch fallback)
- [x] **`POST /api/intelligence/competitors`** — Apify Google Search → filtered competitor list (tier-gated)
- [x] **`POST /api/intelligence/scrape-pricing`** — Scrapingdog per URL → Claude pricing extraction (tier-gated, max 5)
- [x] **`POST /api/intelligence/demand`** — DataForSEO search volume + competition + CPC (tier-gated)
- [x] **`GET /api/intelligence/currency`** — ExchangeRate-API (open.er-api.com, free, no key needed)

### 4.2 · Backend Infrastructure — ✅ COMPLETE
- [x] **`fetchWithFallback`** utility — generic async wrapper with timeout + graceful fallback
- [x] **VAT rates JSON** (`data/vatRates.json` — 62 countries)
- [x] **Rate limiters** (in-memory, `rate-limiter-flexible`):
  - IP daily limiter (20 calls/day)
  - Session scrape limiter (5 scrapes/session)
  - Session demand limiter (3 queries/session)
  - Session pre-fill limiter (10 attempts/session)
- [x] **Tier-based gating** — Basic/Founder/Investor permissions matrix
- [x] **URL deduplication** + user-domain rejection utility
- [x] **Lazy Claude client** — singleton reuse

### 4.3 · API Keys Status
- [x] `ANTHROPIC_API_KEY` — ✅ Configured
- [x] `ABSTRACTAPI_GEOLOCATION_KEY` — ✅ Configured (geolocation works)
- [x] `SCRAPINGDOG_API_KEY` — ✅ Configured (scraping works)
- [ ] `APIFY_API_TOKEN` — 🔑 **NOT SET** (competitor discovery won't work)
- [ ] `DATAFORSEO_LOGIN` — 🔑 **NOT SET** (demand analysis won't work)
- [ ] `DATAFORSEO_PASSWORD` — 🔑 **NOT SET** (demand analysis won't work)
- [ ] `FIXER_API_KEY` — 🔑 **NOT SET** (currency endpoint uses free ExchangeRate-API instead, so not blocking)

### 4.4 · Frontend Intelligence Store — ✅ COMPLETE
- [x] **`useIntelligenceStore.ts`** (339 lines) — full Zustand store with:
  - `runGeolocate()` — async geolocation
  - `runPreFill(urlOrName)` — async product pre-fill (URL detection heuristic)
  - `runCompetitorDiscovery(keyword, category, geography, tier)` — async competitor search
  - `runPriceScraping(urls, tier, userDomain)` — async price extraction + `computeMarketRange()`
  - `runDemandAnalysis(keyword, country, tier)` — async demand signal
  - `confirmCompetitors(selected)` — user confirms from discovered list
  - `validateVanWestendorp(sliders, marketData)` — 3 alert types (Confidence, Positioning, Race-to-Bottom)
  - `resetIntelligence()` — full state reset

### 4.5 · Frontend Intelligence UI Components — ✅ ~90% COMPLETE
- [x] **`MarketIntelligencePanel.tsx`** (435 lines) — Competitor Pricing Table + Market Demand Card + shimmer loading states + status badges
- [x] **Wire `MarketIntelligencePanel` into `QuestionNode.tsx`** — rendered inside `market_research` stage node (L1005-1008)
- [x] **Question 0 — "Enter your URL"** (`ProductIntelEntry.tsx`, 405 lines)
  - [x] New entry UI: URL input field + "Analyse My Product →" button + "Continue manually" link
  - [x] Loading state: progress indicators for scraping/geolocation
  - [x] Pre-fill results: editable fields with ✨ "Auto-detected" labels
- [x] **Geo-detection badge** — fires on app load (`App.tsx`), `LandingView`, and `MindMap` mount; `GeoBadge` component in `ProductIntelEntry`
- [ ] **Competitor confirmation UI** — checkbox list from discovered competitors + "Add manually" input (store method `confirmCompetitors()` exists, no UI yet)
- [ ] **Demand signal card** — replace "Expected Volume" field with demand card
- [ ] **Currency pill** on price inputs — "GBP £" with auto-conversion tooltip
- [x] **Van Westendorp validation alerts** — inline alert cards after slider submission (L1010-1020)
- [x] **Auto-fill from intelligence** — geo country/currency/VAT, product name/description, competitor prices auto-populate form fields (L528-615)
- [x] **Auto-trigger competitor discovery + demand analysis** — fires on `product_classification` submit (L707-721)

### 4.6 · Intelligence → Report Pipeline Integration — ✅ COMPLETE
- [x] **`ResultNode.tsx`** — gathers all intelligence from `useIntelligenceStore` (geo, preFill, competitors, pricing, demand, vwAlerts) and sends to `reports/initialize` (L146-177)
- [x] **Enriched session data** flowing to `POST /api/generate-report` with auto-intelligence blocks — server stores intelligence in `rawData` alongside session data (`reports.ts` L52)
- [x] **Claude prompt** consuming intelligence data as ground truth — `buildIntelligenceBlock()` in `claude.ts` (L180-260) injects competitor, demand, geo, VW alert data
- [x] **PDF template** rendering competitor names from scraped data in charts — all chart generators wired

### 4.7 · Prototype / Testing Scripts
- [x] **`test_apple.js`** — sandbox script testing Scrapingdog + direct fetch + Claude extraction on apple.com

---

## 5 · Deployment & Production Hardening — ⬜ NOT STARTED

- [ ] **Environment configuration** — production `.env` with all API keys
- [ ] **Dodo Payments** — switch from test (`test.dodopayments.com`) to live
- [ ] **CORS hardening** — restrict to production domain (currently `origin: '*'`)
- [ ] **Webhook signature verification** — validate `dodo-signature` HMAC
- [ ] **HTTPS enforcement**
- [ ] **Rate limiting** — move from in-memory to Redis for multi-instance
- [ ] **Error monitoring** — Sentry or equivalent
- [ ] **Logging** — structured logging to external service
- [ ] **CI/CD pipeline** — build, test, deploy
- [ ] **Domain & hosting** setup (Netlify / Vercel for frontend, Railway / Render for backend)
- [ ] **Database migrations** — production Prisma migration strategy
- [ ] **SEO** — meta tags, OG images, sitemap

---

## 6 · Future Roadmap — ⬜ PLANNED

- [ ] **Multi-currency PDF rendering** — all prices in user's local currency
- [ ] **Report versioning** — user can re-run analysis and compare
- [ ] **Team accounts** — share reports across org
- [ ] **Dashboard** — analytics over generated reports
- [ ] **A/B price testing** — integrate with Stripe/Dodo to run live experiments
- [ ] **White-label** — custom branding for agencies

---

## Quick Reference — What to Work On Next

### 🎯 Immediate Priority (Current Sprint)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Wire `MarketIntelligencePanel` into MindMap `market_research` stage | `QuestionNode.tsx` | ✅ |
| 2 | Build "Question 0" URL entry screen | `ProductIntelEntry.tsx` | ✅ |
| 3 | Fire `runGeolocate()` on app load, show badge | `App.tsx` + `LandingView.tsx` + `MindMap.tsx` | ✅ |
| 4 | Fire `runPreFill()` on URL submit, show pre-filled fields | `ProductIntelEntry.tsx` + `LandingView.tsx` | ✅ |
| 5 | Build competitor confirmation UI (checkboxes) | New component in MindMap | ⬜ |
| 6 | Intelligence data in report pipeline | `ResultNode.tsx` → `reports.ts` → `claude.ts` | ✅ |
| 7 | Complete PDF Tier Spec (remaining ~60%) | `pdfTemplate.ts` (2685 lines) | ✅ |
| 8 | Get `APIFY_API_TOKEN` for competitor discovery | `.env` | 🔑 |
| 9 | Get `DATAFORSEO_LOGIN/PASSWORD` for demand analysis | `.env` | 🔑 |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT (Vite + React 18 + Tailwind v4)   :5173            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ Landing  │  │ MindMap  │  │ Success / Profile Pages  │  │
│  │ View     │  │ Engine   │  │ (report gen + download)  │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
│  Zustand Stores: useMindMapStore | useSessionStore          │
│                  useIntelligenceStore                        │
├─────────────────────────────────────────────────────────────┤
│  SERVER (Fastify + TypeScript + Prisma)   :3000             │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ /api/intel │  │ /api/      │  │ /api/user/*          │  │
│  │ ligence/*  │  │ reports/*  │  │ /api/webhooks/dodo   │  │
│  │ (6 endpts) │  │ checkout   │  │ /api/generate-report │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
│  Utils: claude.ts | pdfTemplate.ts | email.ts               │
│  Lib: Prisma (PostgreSQL) | Supabase Auth                   │
├─────────────────────────────────────────────────────────────┤
│  EXTERNAL SERVICES                                          │
│  Supabase (Auth + DB) | Dodo Payments | Anthropic Claude    │
│  AbstractAPI | Scrapingdog | Apify | DataForSEO | Resend    │
└─────────────────────────────────────────────────────────────┘
```

---

## File Index

| Layer | Key File | Size | Purpose |
|-------|----------|------|---------|
| Client | `App.tsx` | 2KB | Root component, auth hydration, view switching |
| Client | `LandingView.tsx` | 28KB | Marketing / landing page |
| Client | `MindMap.tsx` | 8KB | React Flow canvas wrapper |
| Client | `QuestionNode.tsx` | 50KB | Main question rendering node (largest component) |
| Client | `ResultNode.tsx` | 37KB | Trinity Quote + tier selector + checkout trigger |
| Client | `MarketIntelligencePanel.tsx` | 23KB | Competitor pricing table + demand card |
| Client | `PricingReportPDF.tsx` | 53KB | React-PDF client-side report renderer |
| Client | `ChartEngine.tsx` | 13KB | Client-side chart rendering |
| Client | `questions.config.ts` | 41KB | All question definitions (config tree) |
| Client | `pricingEngine.ts` | 10KB | Price calculation algorithm |
| Client | `useIntelligenceStore.ts` | 13KB | Intelligence async state (Zustand) |
| Client | `useMindMapStore.ts` | 13KB | MindMap state (Zustand) |
| Server | `server.ts` | 6KB | Fastify server entry, route registration |
| Server | `intelligence.ts` | 31KB | All 6 intelligence endpoints |
| Server | `reports.ts` | 12KB | Report init, checkout, status polling |
| Server | `user.ts` | 10KB | Profile, report history, email |
| Server | `webhooks.ts` | 2KB | Dodo payment webhook |
| Server | `claude.ts` | 38KB | Claude API prompt engineering (3 tiers) |
| Server | `pdfTemplate.ts` | 163KB | Full HTML-to-PDF template |
| Server | `email.ts` | 7KB | Resend email integration |
| Server | `schema.prisma` | 1KB | Lead, Session, Report models |
