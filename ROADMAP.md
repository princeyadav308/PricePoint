# PricePoint Master Roadmap & Checklist

> **Last Updated**: 2026-08-04
> **Current Phase**: Phase 6 — Crawl4AI Migration (replacing Apify + Scrapingdog)

---

## Phase 5.5 — Report Integrity Overhaul ✅

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Structured Logging System | `server/src/server.ts`, `server/src/utils/logger.ts` | ✅ |
| 2 | Report Validator | `server/src/utils/reportValidator.ts` | ✅ |
| 3 | Claude Prompt Hardening | `server/src/utils/claude.ts` | ✅ |
| 4 | PDF Template Guards | `server/src/utils/pdfTemplate.ts` | ✅ |
| 5 | Premium Anchor vs PME Consistency | `server/src/utils/pdfTemplate.ts` | 🔨 |
| 6 | KPI Card Text-overlap Fix | `server/src/utils/pdfTemplate.ts` | 🔨 |
| 7 | Visual QA Pass (Manual) | Manual | ⬜ |

**Critical Systems Implemented**:
- Structured logging with correlation IDs
- Full implementation of report validator
- Claude prompt hardening with "COST DATA HONESTY" rules
- PDF template data guards

Remaining: Premium Anchor/PME naming consistency, KPI card rendering fixes

---

## Phase 6 — Crawl4AI Migration ✅

**Goal**: Replace all paid third-party scraping APIs (Apify, Scrapingdog) with [Crawl4AI](https://github.com/unclecode/crawl4ai), a free, open-source LLM-friendly web crawler. This eliminates API costs and centralizes all web scraping through a single self-hosted tool.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Python Sidecar Server & requirements | `server/scripts/crawl4ai_server.py`, `server/scripts/requirements.txt` | ✅ |
| 2 | TypeScript Client Utility | `server/src/utils/crawl4ai.ts` | ✅ |
| 3 | Refactor Competitor Discovery (Apify) | `server/src/routes/intelligence.ts` | ✅ |
| 4 | Refactor Prefill Scraping (Scrapingdog) | `server/src/routes/intelligence.ts` | ✅ |
| 5 | Refactor Pricing Scraping (Scrapingdog) | `server/src/routes/intelligence.ts` | ✅ |
| 6 | Environment Variables Cleanup | `server/.env`, `server/.env.example` | ✅ |

---

## Phase 7 — UX Polish: Report Generation Sequence 🚀 (In Progress)

**Goal**: Enhance the paywall psychology. Instead of immediately showing a static locked state or price columns, we will simulate the AI generating the report. After an animation sequence, the user will see a realistic but blurred preview of their PDF report. The paywall will then be presented to unlock the full document, increasing the perceived value of the product before asking for payment.

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1 | Add Generate-Report Animation State | `client/src/components/ReportEngine.tsx` | ⬜ |
| 2 | Create Blur-Filter PDF Preview component | `client/src/components/Preview.tsx` | ⬜ |
| 3 | Update API to support progress stream | `server/src/routes/report.ts` | ⬜ |
| 4 | CSS Animations for "Thinking" state | `client/src/styles/animations.css` | ⬜ |
| 5 | Lock access to full download behind Paywall | `client/src/components/Paywall.tsx` | ⬜ |
| 6 | Update project documentation | `application.md` | ⬜ |
| 7 | End-to-end UX flow testing | Manual | ⬜ |

**What's changing**:
- `APIFY_API_TOKEN` → removed (was for Google Search competitor discovery)
- `SCRAPINGDOG_API_KEY` → removed (was for HTML scraping)
- `CRAWL4AI_API_URL` → new (defaults to `http://localhost:11235`)
- Competitor discovery now crawls Google SERPs directly via Crawl4AI
- Product prefill & pricing scraping now use Crawl4AI instead of Scrapingdog
- All existing fallback behavior preserved (graceful degradation if Crawl4AI is down)
- **No frontend changes needed** — response shapes are identical