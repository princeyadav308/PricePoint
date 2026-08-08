# PricePoint Master Roadmap & Checklist

> **Last Updated**: 2026-08-07  
> **Current Phase**: Phase 7 — UX Polish: Report Generation Sequence 🚀 (In Progress)

---

## Phase 5.5 — Report Integrity Overhaul ✅

| # | Task | File(s) | Status | Notes |
|---|------|---------|--------|-------|
| 1 | Structured Logging System | `server/src/server.ts`, `server/src/utils/logger.ts` | ✅ | Implemented correlation ID tracking |
| 2 | Report Validator | `server/src/utils/reportValidator.ts` | ✅ | Hardened validation logic |
| 3 | Claude Prompt Hardening | `server/src/utils/claude.ts` | ✅ | Added "COST DATA HONESTY" rules |
| 4 | PDF Template Guards | `server/src/utils/pdfTemplate.ts` | ✅ | Added data guards for safety helpers |
| 5 | Premium Anchor vs PME Consistency | `server/src/utils/pdfTemplate.ts` | 🔨 | Working on naming consistency |
| 6 | KPI Card Text-overlap Fix | `server/src/utils/pdfTemplate.ts` | 🔨 | Resolving layout issues |
| 7 | Visual QA Pass (Manual) | Manual | ⬜ | Complete manual testing |
| 8 | **Database Migration: Report Schema Updates** | Prisma schema | ✅ | Added `claudeData`, `templateVersion`, `generationStatus` fields |
| 9 | **PDF Storage Utilities** | `server/src/lib/storage.ts` | ✅ | Implemented S3 bucket upload and signed URL generation |
| 10 | **Report Version Management** | `server/src/lib/reportVersion.ts` | ✅ | Version tracking with bump documentation |
| 11 | **Enhanced generate-report Endpoint** | `server/src/server.ts` | ✅ | Persists claudeData with schema versioning |
| 12 | **Enhanced generate-pdf Endpoint** | `server/src/server.ts` | ✅ | Added caching lock, atomic updates, storage integration |
| 13 | **Preview & CDN Fetch Updates** | `client/src/components/DraftConflictModal.tsx` | ✅ | Updated to handle new cached/fallback flows |

---

## Phase 6 — Crawl4AI Migration ✅

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

| # | Task | File(s) | Status | Dependencies |
|---|------|---------|--------|--------------|
| 1 | Add Generate-Report Animation State | `client/src/components/ReportEngine.tsx` | ⬜ | Requires backend progress endpoint |
| 2 | Create Blur-Filter PDF Preview component | `client/src/components/Preview.tsx` | ⬜ | Design assets pending |
| 3 | Update API to support progress stream | `server/src/routes/reports.ts` | ⬜ | Needs pagination endpoints |
| 4 | CSS Animations for "Thinking" state | `client/src/styles/animations.css` | ⬜ | Visual design handoff |
| 5 | Lock access to full download behind Paywall | `client/src/components/Paywall.tsx` | ⬜ | Authentication flow integration |
| 6 | Update project documentation | `application.md` | ⬜ | Pending review |
| 7 | End-to-end UX flow testing | Manual | ⬜ | QA process pending |

**Key Notes for Phase 7:**
- `APIFY_API_TOKEN` → removed (was for Google Search competitor discovery)
- `SCRAPINGDOG_API_KEY` → removed (was for HTML scraping)
- `CRAWL4AI_API_URL` → new (defaults to `http://localhost:11235`)
- Competitor discovery now crawls Google SERPs directly via Crawl4AI
- Product prefill & pricing scraping now use Crawl4AI instead of Scrapingdog
- All existing fallback behavior preserved (graceful degradation)

---

## Phase 8 — Testing & Release Preparation ⏳

| # | Task | Status |
|---|------|--------|
| 1 | Complete security audit of new caching flows | ⬜ |
| 2 | Run end-to-end PDF caching tests | ⬜ |
| 3 | Verify signed URL expiration logic | ⬜ |
| 4 | Update CI/CD pipelines with new migration scripts | ⬜ |
| 5 | Prepare release notes for v1.0.0 | ⬜ |
| 6 | Update design system documentation | ⬜ |

---

## Phase 9 — Legacy Cleanup ♻️

| # | Task | Status | Subtasks |
|---|------|--------|----------|
| 1 | Deprecate old `FetchFlow` module | 🔨 | Remove references from codebase |
| 2 | Remove unused Intelligence tests | ✅ | All tests pass without them |
| 3 | Delete legacy PDF generation code | ✅ | Cleaned up in PR #127 |
| 4 | Cleanup .env.example duplication | ✅ | Consolidated vars |
| 5 | Remove old session management utilities | ✅ | Migration complete |

---