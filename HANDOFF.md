# PricePoint — PDF Tier Spec Implementation Handoff

> **Created**: 2026-03-29
> **Purpose**: Resume this implementation on another device. Give this file to Claude Code to continue.

---

## What We're Building

Implementing a comprehensive 3-tier PDF report specification:
- **Starter ($299)**: 8–10 pages (currently ~4 pages)
- **Founder Ready ($799)**: 18–22 pages (currently ~6 pages)
- **Investor Grade ($1,999)**: 32–38 pages (currently ~10 pages)

The user provided a detailed visual spec (screenshot) defining exactly which sections belong in each tier, what each section must contain, section numbering, and page count targets.

---

## Files Modified So Far

### 1. `server/src/utils/claude.ts` — COMPLETED
All Claude AI prompt updates are done:

- **Basic tier schema**: Added `van_westendorp_interpretation`, `cost_breakdown_narrative`, `gross_margin_commentary`, `cost_of_inaction` (string), expanded `next_steps` from 3→5
- **Professional tier schema**: Added `strategic_verdict` object, `market_analysis.tam_sam_narrative`, `market_analysis.positioning_map` array, `pricing_strategy.launch_vs_scale` object, `cost_of_inaction` object (headline_number, calculation, narrative), `monitoring_plan` array (3 structured metrics)
- **Investor tier Call 1 (narrative)**: Added `investment_thesis` (6-8 paragraphs), `key_findings_summary`, `market_analysis.market_timing_assessment`, `market_analysis.feature_price_mapping`, `competitive_moat_assessment` (expanded), `pricing_strategy.packaging_recommendation_detail`, `pricing_strategy.price_increase_strategy` with timeline, `investor_narrative.comparable_company_pricing` with detailed pricing, `investor_narrative.investor_questions_to_prepare` as Q&A pairs, `glossary` (20-25 terms), `cost_of_inaction` object
- **Investor tier Call 2 (data)**: Added `unit_economics.rule_of_40` object, `margin_erosion_audit` object with leakage_sources, `monitoring_plan`, expanded `financial_scenarios.scenarios` with monthly_customers/gross_profit/implied_cac_budget
- **Token limits**: Basic 8K→10K, Professional 14K→16K, Investor 8K→12K per call
- **System prompt tier calibration**: Updated with page count targets and new section expectations

### 2. `server/src/utils/pdfTemplate.ts` — PARTIALLY COMPLETED (~40%)

#### COMPLETED sections in pdfTemplate.ts:
1. **3 new SVG chart generators** (lines 519-603):
   - `generatePositioningMapSVG()` — scatter plot for competitor positioning
   - `generateRuleOf40GaugeSVG()` — gauge with threshold marker at 40
   - `generateMarginErosionBarSVG()` — horizontal bar for leakage sources

2. **New CSS classes** (added after line 1001):
   - `.toc-page`, `.toc-grid`, `.toc-group`, `.toc-item` — Table of Contents
   - `.verdict-card`, `.vc-headline`, `.vc-body`, `.vc-badge` — Strategic Verdict
   - `.inaction-callout`, `.ic-label`, `.ic-number`, `.ic-calc` — Cost of Inaction
   - `.thesis-content` — Investment Thesis (2-column)
   - `.glossary-grid`, `.glossary-item`, `.glossary-term`, `.glossary-def` — Glossary
   - `.qa-card`, `.qa-q`, `.qa-a` — Investor Q&A
   - `.metric-trigger-table` — Monitoring plan
   - `.timeline-item`, `.timeline-dot`, `.timeline-body` — Timeline steps
   - `.audit-table` — Input Audit table

3. **New/restructured HTML sections** (lines 1120-1596):
   - `01 · COVER PAGE` — restructured with Document ID, removed metadata dump
   - `02 · TABLE OF CONTENTS` — NEW, tier-aware (single column for Basic, 2-column for Founder/Investor), section numbers match spec
   - `03 · INVESTMENT THESIS` — NEW, Investor only, 2-page thesis content in 2-column layout
   - `03/04 · EXECUTIVE SUMMARY` — restructured: bold headline, pricing verdict callout, stat cards, key findings (Investor)
   - `04 · STRATEGIC VERDICT CARD` — NEW, Founder+Investor, pullout card with headline/body/confidence badge + price comparison chart
   - `BASIC: Price Recommendation + Rationale` — separated from old combined page
   - `05 · VAN WESTENDORP VISUAL + INTERPRETATION` — moved to ALL TIERS (was Founder+ only), with interpretation text for Basic, WTP analysis for Founder+
   - `06 · COST BREAKDOWN + GROSS MARGIN` — NEW for all tiers, 2-column with KPI cards + donut chart + tier-specific narratives
   - `07 · BREAKEVEN TABLE` — restructured: added Gross Margin % column, Months to Recover Dev Investment column, highlight-row for Optimal, cost-of-inaction callout for Basic
   - `BASIC: Top Risks + Next Steps` — restructured with better spacing

#### NOT YET MODIFIED (old code still present, lines 1597-2212):
These sections still use the OLD structure and need to be replaced with the new spec:

**For Founder Ready ($799) — sections that need restructuring/adding:**
- `06 · Market Sizing (TAM/SAM)` — needs dedicated section (currently buried in Market Intelligence)
- `07 · Competitive Benchmark Table` — exists but needs restructuring
- `08 · Positioning Map Chart` — NEW, needs `generatePositioningMapSVG()` wired up
- `11 · LTV · CAC · Payback Analysis` — needs dedicated section (currently in Economics & Strategy)
- `12 · Revenue Scenario Table` — needs restructuring with new columns (monthly_customers, gross_profit, implied_cac_budget)
- `13 · Cost of Inaction` — NEW standalone callout section using `cost_of_inaction` object
- `14 · Price Recommendation + Rationale` — needs dedicated section for Founder tier
- `15 · Pricing Tier Architecture` — exists but needs own page
- `16 · Launch vs. Scale Pricing` — NEW section using `pricing_strategy.launch_vs_scale`
- `17 · 90-Day Monitoring Plan` — exists but needs restructuring to use `monitoring_plan` array from Claude
- `18 · Risk Matrix` — exists, needs minor restructuring
- `19 · 3-Phase Implementation Roadmap` — exists, needs own page
- `20 · Next Steps` — exists

**For Investor Grade ($1,999) — additional sections needed:**
- `07 · Market Timing Assessment` — NEW using `market_analysis.market_timing_assessment`
- `09 · Feature-to-Price Mapping` — NEW table using `market_analysis.feature_price_mapping`
- `10 · Competitive Moat Assessment` — NEW using `competitive_positioning.competitive_moat_assessment`
- `13 · LTV · CAC · Payback · Rule of 40` — needs `generateRuleOf40GaugeSVG()` wired up
- `15 · 12-Month Revenue Projection Chart` — exists, needs own page
- `16 · Margin Erosion + Leakage Audit` — NEW using `margin_erosion_audit` + `generateMarginErosionBarSVG()`
- `20 · Packaging Recommendation` — NEW using `pricing_strategy.packaging_recommendation_detail`
- `22 · Price Increase Strategy` — NEW using `pricing_strategy.price_increase_strategy.timeline`
- `24 · Pricing Defensibility Statement` — exists but needs own section
- `25 · Comparable Company Pricing` — NEW using `investor_narrative.comparable_company_pricing`
- `26 · Red Flags to Address` — exists but needs own section
- `27 · Investor Questions to Prepare For` — needs restructuring to Q&A format (question + prepared_answer)
- `29 · 4-Phase Roadmap (18 months)` — exists, extend to 4 phases
- `33 · Glossary of Pricing Terms` — NEW using `glossary` array

**For ALL TIERS — closing sections that need adding/restructuring:**
- `Full Input Audit` — NEW, clean 2-column table from `sessionData.answers`, parse unit economics into line items
- Sources & References — exists, keep as-is
- Methodology Appendix — exists, keep as-is
- Legal Disclaimer + Verification Seal — exists, keep as-is

---

## Implementation Strategy

The old sections (lines 1597-2212) use a flat structure with `${!isBasic ? ...}` conditionals. The NEW approach should:

1. **Break the Founder+Investor Market Intelligence page** (lines 1597-1659) into separate sections:
   - Market Sizing (TAM/SAM) page
   - Competitive Benchmark page (with horizontal bar chart)
   - Positioning Map page (Founder+, using new SVG)
   - Market Timing page (Investor only)
   - Feature-to-Price Mapping page (Investor only)
   - Competitive Moat page (Investor only)

2. **Break the Economics & Strategy page** (lines 1663-1853) into separate sections:
   - LTV · CAC · Payback page (with Rule of 40 for Investor)
   - Revenue Scenario Table page
   - Cost of Inaction page (standalone callout)
   - Price Recommendation + Rationale page
   - Pricing Tier Architecture page
   - Launch vs Scale page (NEW)
   - Packaging Recommendation page (Investor only)
   - Price Increase Strategy page (Investor only)

3. **Break the Risk & Implementation page** (lines 1858-1947) into:
   - 90-Day Monitoring Plan page (using Claude's monitoring_plan array)
   - Risk Matrix page
   - Implementation Roadmap page
   - Next Steps page

4. **Restructure the Investor-only pages** (lines 1951-2139):
   - Financial Scenarios page (keep)
   - Revenue Projection page (keep)
   - Pricing Defensibility page (NEW standalone)
   - Comparable Company Pricing page (NEW with detailed pricing)
   - Red Flags page (NEW standalone)
   - Investor Questions page (NEW with Q&A cards)
   - Audit Findings page (keep, audit journey only)

5. **Add new closing sections** (before Sources & References):
   - Full Input Audit page (ALL tiers)
   - Glossary page (Investor only)

---

## Spec Reference — Section Numbers by Tier

### Starter ($299) — 13 sections, 8-10 pages
01 Cover | 02 TOC | 03 Exec Summary | 04 Price Rec | 05 Van Westendorp | 06 Cost Breakdown | 07 Breakeven | 08 Risks | 09 Next Steps | 10 Input Audit | 11 Methodology | 12 Legal | 13 Verification

### Founder Ready ($799) — 23 sections, 18-22 pages
01 Cover | 02 TOC | 03 Exec Summary | 04 Strategic Verdict | 05 Van Westendorp | 06 TAM/SAM | 07 Competitive Benchmark | 08 Positioning Map | 09 Cost Breakdown | 10 Breakeven | 11 LTV/CAC/Payback | 12 Revenue Scenarios | 13 Cost of Inaction | 14 Price Rec | 15 Pricing Tiers | 16 Launch vs Scale | 17 Monitoring Plan | 18 Risk Matrix | 19 Roadmap | 20 Next Steps | 21 Input Audit | 22 Methodology | 23 Legal + Seal

### Investor Grade ($1,999) — 34 sections, 32-38 pages
01 Cover | 02 TOC | 03 Investment Thesis (2pg) | 04 Exec Summary | 04b Key Findings | 05 Van Westendorp | 06 TAM/SAM/SOM | 07 Market Timing | 08 Competitive Benchmark | 09 Feature-Price Mapping | 10 Competitive Moat | 11 Cost Breakdown | 12 Breakeven | 13 LTV/CAC/Payback/Rule of 40 | 14 Revenue Scenarios | 15 Revenue Projection (12mo chart) | 16 Margin Erosion | 17 Cost of Inaction | 18 Price Rec | 19 Pricing Tiers | 20 Packaging Rec | 21 Launch vs Scale | 22 Price Increase Strategy | 23 Monitoring Plan | 24 Defensibility | 25 Comparable Companies | 26 Red Flags | 27 Investor Questions (Q&A) | 28 Risk Matrix | 29 4-Phase Roadmap | 30 Next Steps | 31 Input Audit | 32 Methodology | 33 Glossary | 34 Legal + Seal

---

## Key Design Rules from the Spec

- **Table of Contents**: Section numbers must match report. Two columns for longer tiers. Visual divider between groups.
- **Executive Summary**: Max 1 page. Never spills to page 2. 3 paragraphs: situation, key finding, recommended action. Verdict box.
- **Breakeven Table**: 3 rows (Entry/Optimal/Premium). 4 columns: Price, Gross Margin %, Customers to cover monthly costs, Months to recover dev investment.
- **Full Input Audit**: Clean two-column table. Left: label. Right: human-readable value. Parse unit economics JSON into line items. Replace `__NA__` with "Not provided".
- **Revenue Scenario Table**: 3 columns (Conservative/Base/Optimistic). Rows: Price, Monthly customers, MRR, ARR, Gross profit, Implied CAC budget. Key assumption under each column.
- **Cost of Inaction**: Callout box. One bold number. One sentence. Maximum impact.
- **90-Day Monitoring Plan**: 3 metrics. For each: what to measure, threshold trigger, specific action with numbers.
- **Investor Questions**: 5-7 Q&A pairs (question + prepared answer).
- **Glossary**: 20-25 pricing terms in plain English.

---

## Files to Reference

- **Full approved plan**: `C:\Users\Captain\.claude\plans\breezy-skipping-hopcroft.md`
- **Memory file**: `C:\Users\Captain\.claude\projects\c--Users-Captain-Desktop-Captain-personal-projects-PricePoint\memory\MEMORY.md`
- **Spec screenshot**: User provided as image in the conversation (not saved as file — refer to the tier structure above)
- **Claude prompts**: `server/src/utils/claude.ts` (481 lines, COMPLETE)
- **PDF template**: `server/src/utils/pdfTemplate.ts` (2212 lines, ~40% done)

---

## How to Resume

1. Read this file (`HANDOFF.md`)
2. Read `server/src/utils/pdfTemplate.ts` starting from line ~1597 to see the OLD sections that need replacing
3. Continue editing `pdfTemplate.ts` — replace the old Founder+Investor sections (lines 1597-2139) with the new per-spec structure described above
4. Add the Full Input Audit section before Sources & References (for all tiers)
5. Add the Glossary section (Investor only) before Legal Disclaimer
6. Run `npm run build` in the `server/` directory to verify TypeScript compilation
7. Test each tier's PDF generation
8. Delete this `HANDOFF.md` file when done

---

## Important Implementation Notes

- All data fields referenced in the template come from `claudeData` (aliased as `d`) which is the JSON response from Claude
- Pricing engine data comes from `pricingResult` (aliased as `pr`): `pr.budget`, `pr.recommended`, `pr.premium`, `pr.analysis.vanWestendorp`, `pr.analysis.costPlusBase`, `pr.analysis.valueMultiplier`, `pr.analysis.totalUnitCost`
- Session data comes from `sessionData.answers` (aliased as `answers`)
- Currency symbol is `cs`, Voya colors are `V` (alias for `VOYA`)
- Tier flags: `isBasic`, `isFounder`, `isInvestor`
- Page wrappers: `pageStart('Section Name')` and `pageEnd`
- Every section should gracefully fallback with `txt()`, `num()`, `arr()` helpers when data is missing
- Use `esc()` for all user-visible text to prevent XSS
- Each new page section should use `page-break-after: always` (handled by `.voya-page` class via `pageStart`/`pageEnd`)
- Some sections can share a page (e.g., Cost of Inaction is a small callout that could follow Revenue Scenarios)
- The 3 new SVG generators (`generatePositioningMapSVG`, `generateRuleOf40GaugeSVG`, `generateMarginErosionBarSVG`) are defined but NOT YET USED in the template — they need to be wired into the appropriate sections
