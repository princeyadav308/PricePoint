# Graph Report - PricePoint  (2026-08-04)

## Corpus Check
- 88 files · ~77,893 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 672 nodes · 914 edges · 51 communities (40 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.55)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fbfaf6c8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Client App and Shell
- Question Config and Currency
- Server Dependencies
- Client Core Dependencies
- Server API Routes
- Client UI Dependencies
- PDF Chart Generators
- Client TS Configuration
- Pricing Engine & Layout
- Market Intelligence State
- Report PDF Engine
- Server Scripts
- Server TS Configuration
- Intelligence Routes
- Client Node Config
- Mindmap Stage Node
- Email Utilities
- Mindmap to Session
- Apple Test Script
- Dodo Products JS
- Dodo Products TS
- Claude Test Script
- Dodo ID Test
- Dodo Test MJS
- Dodo Test TS
- ResultNode.tsx
- server.ts
- PricePoint MindMap: User Journeys & Question Flow
- reportValidator.ts
- PricePoint v2 — Locked Design System
- PricePoint Brand Guidelines
- QuestionNode.tsx
- PricePoint v2.0 — Design System & Immutable Rules
- crawl4ai_server.py
- 2. Your specific Journey Data & Calculations
- currency.ts
- agent-browser
- devDependencies
- PricePoint Master Roadmap & Checklist
- React + TypeScript + Vite
- graphify.md
- graphify.md

## God Nodes (most connected - your core abstractions)
1. `generateHTMLTemplate()` - 23 edges
2. `useSessionStore` - 20 edges
3. `Logger` - 17 edges
4. `compilerOptions` - 16 edges
5. `PricePoint: Auto-Intelligence Upgrade` - 16 edges
6. `useMindMapStore` - 12 edges
7. `compilerOptions` - 11 edges
8. `PricePoint v2 — Locked Design System` - 11 edges
9. `useIntelligenceStore` - 10 edges
10. `getLogger()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `generateWaterfallSVG()` --indirect_call--> `start()`  [INFERRED]
  server/src/utils/pdfTemplate.ts → server/src/server.ts
- `Header()` --calls--> `useSessionStore`  [EXTRACTED]
  client/src/components/Layout/Header.tsx → client/src/store/useSessionStore.ts
- `App()` --calls--> `useMindMapStore`  [EXTRACTED]
  client/src/App.tsx → client/src/store/useMindMapStore.ts
- `JourneyBadge()` --calls--> `useSessionStore`  [EXTRACTED]
  client/src/components/JourneyBadge.tsx → client/src/store/useSessionStore.ts
- `QuestionNodeData` --references--> `StageConfig`  [EXTRACTED]
  client/src/components/MindMap/nodes/QuestionNode.tsx → client/src/data/questions.config.ts

## Import Cycles
- None detected.

## Communities (51 total, 11 thin omitted)

### Community 0 - "Client App and Shell"
Cohesion: 0.06
Nodes (47): App(), JourneyBadge(), LandingStep, LandingView(), Footer(), AnimatedEdge, COLOR_MAP, edgeTypes (+39 more)

### Community 1 - "Question Config and Currency"
Cohesion: 0.12
Nodes (16): AUDIT_BASELINE, BRANCH_FINANCIALS, BRANCH_MARKET_INTELLIGENCE, BRANCH_MARKET_RESEARCH, BRANCH_PRODUCT_VALUE, QuestionFieldType, STAGE_2A_PHYSICAL, STAGE_2B_SERVICE (+8 more)

### Community 2 - "Server Dependencies"
Cohesion: 0.04
Nodes (45): @anthropic-ai/sdk, axios, cors, dotenv, fastify, @fastify/cors, fastify-plugin, jsonwebtoken (+37 more)

### Community 3 - "Client Core Dependencies"
Cohesion: 0.07
Nodes (27): autoprefixer, devDependencies, autoprefixer, eslint, eslint-plugin-react-hooks, eslint-plugin-react-refresh, postcss, tailwindcss (+19 more)

### Community 4 - "Server API Routes"
Cohesion: 0.12
Nodes (18): prisma, supabase, DODO_PRODUCT_IDS, NOTE: Our products are USD-priced. UPI only works with INR products,, IMPORTANT: Transition the Report Status to 'Paid' securely on the backend, server, start(), buildIntelligenceBlock() (+10 more)

### Community 5 - "Client UI Dependencies"
Cohesion: 0.05
Nodes (36): dependencies, dagre, lucide-react, react, react-dom, @react-pdf/renderer, react-router-dom, reactflow (+28 more)

### Community 6 - "PDF Chart Generators"
Cohesion: 0.20
Nodes (25): arr(), CURRENCY_SYMBOLS, esc(), fmt(), fmtK(), formatAnswerValue(), generateBarChartSVG(), generateDonutChartSVG() (+17 more)

### Community 7 - "Client TS Configuration"
Cohesion: 0.09
Nodes (22): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+14 more)

### Community 8 - "Pricing Engine & Layout"
Cohesion: 0.16
Nodes (12): QuestionNodeData, JOURNEY_A_ROOT, JOURNEY_B_ROOT, StageConfig, VAN_WESTENDORP_QUESTIONS, MindMapState, { nodes: initialNodes, edges: initialEdges }, rawEdges (+4 more)

### Community 9 - "Market Intelligence State"
Cohesion: 0.13
Nodes (14): CompetitorConfirmationList, CompetitorPricingTable, MarketDemandCard, MarketIntelligencePanel, MarketPriceRangeSummary, AsyncStatus, Competitor, CompetitorPlan (+6 more)

### Community 10 - "Report PDF Engine"
Cohesion: 0.16
Nodes (15): BarChart(), BarChartProps, RevenueChart(), RevenueChartProps, WaterfallChart(), WaterfallChartProps, arr(), Col() (+7 more)

### Community 11 - "Server Scripts"
Cohesion: 0.12
Nodes (16): prisma, author, description, devDependencies, prisma, keywords, license, main (+8 more)

### Community 12 - "Server TS Configuration"
Cohesion: 0.12
Nodes (16): node_modules, compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, lib, module, outDir, resolveJsonModule (+8 more)

### Community 13 - "Intelligence Routes"
Cohesion: 0.06
Nodes (33): deduplicateAndFilter(), extractRootDomain(), getClaude(), getClientIp(), getTierPermissions(), intelligenceRoutes(), ipDailyLimiter, ReportTier (+25 more)

### Community 14 - "Client Node Config"
Cohesion: 0.20
Nodes (9): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include (+1 more)

### Community 15 - "Mindmap Stage Node"
Cohesion: 0.06
Nodes (31): 10. Rate Limiting & Cost Controls, 11. UX Flow for the New "Question 0" Experience, 12. Verification Checklist, 13. Error Handling Philosophy, 14. Summary: What the Agent Must Build, 1. Mission Statement, 2. Current Architecture (What Exists Today), 3. Target Architecture (What We're Building) (+23 more)

### Community 16 - "Email Utilities"
Cohesion: 0.60
Nodes (4): FROM_EMAIL(), getResend(), ReportEmailPayload, sendReportEmail()

### Community 33 - "ResultNode.tsx"
Cohesion: 0.14
Nodes (16): AuthModal(), AuthModalProps, Header(), HeaderProps, MANDATORY_CATEGORIES, ResultNode, ResultNodeData, supabase (+8 more)

### Community 34 - "server.ts"
Cohesion: 0.18
Nodes (13): fastify, FastifyRequest, logger, server, createRequestLogger(), getLogger(), ILogger, initLogger() (+5 more)

### Community 35 - "PricePoint MindMap: User Journeys & Question Flow"
Cohesion: 0.12
Nodes (15): 1. Journey Entry Points, 2. Common Flow: Classification & Description, 3. Product-Type Deep Dives & Unit Economics, 4. Multi-Branch Analysis (Simultaneous Insights), 5. Psychological & Distribution Constraints, 6. Convergence: Van Westendorp Price Sensitivity Meter, A. Market Research, B. Product Value (+7 more)

### Community 36 - "reportValidator.ts"
Cohesion: 0.20
Nodes (15): buildPlaceholderMap(), buildProvenanceMap(), Correction, correctNumericFields(), CURRENCY_SYMBOLS, fmt(), getCurrencySymbol(), ProvenanceLevel (+7 more)

### Community 37 - "PricePoint v2 — Locked Design System"
Cohesion: 0.13
Nodes (14): 10. What Is Forbidden, 1. Color Palette, 2. Typography, 3. Shadow System, 4. Hover & Transition Rules, 5. Border Radius, 6. Mind Map — Node Rules, 7. Mind Map — Edge Rules (+6 more)

### Community 38 - "PricePoint Brand Guidelines"
Cohesion: 0.13
Nodes (14): 1. Design System philosophy, 2. Typography, 3. Color Palette, 4. Visual Effects & Shadows, 5. Shape & Corner Radiuses, 6. Logo & Brand Mark, 7. Component Best Practices, Base Backgrounds (Critical for Neumorphism) (+6 more)

### Community 39 - "QuestionNode.tsx"
Cohesion: 0.13
Nodes (6): CONVERGENCE_BRANCHES, ICON_MAP, UnitEconRow, PRODUCT_TYPE_TO_DEEP_DIVE, QuestionField, UnitEconomicsRow

### Community 40 - "PricePoint v2.0 — Design System & Immutable Rules"
Cohesion: 0.20
Nodes (9): 📋 Approved Copy, 🎨 Color Tokens, 🧩 Component Registry, 🚫 Immutable Constraints, 📐 Layout Architecture, PricePoint v2.0 — Design System & Immutable Rules, 🔲 Shadow System (CSS Custom Properties), 🔤 Typography (+1 more)

### Community 41 - "crawl4ai_server.py"
Cohesion: 0.24
Nodes (9): crawl(), do_crawl(), get_crawler(), health(), Crawl4AI Sidecar Server for PricePoint ======================================= A, Synchronous crawl endpoint (mirrors Crawl4AI Docker API).      Request body:, Get or create the AsyncWebCrawler singleton., Crawl one or more URLs and return results. (+1 more)

### Community 42 - "2. Your specific Journey Data & Calculations"
Cohesion: 0.22
Nodes (8): 1. What Are the 3 Pricing Categories?, 2. Your specific Journey Data & Calculations, 3. The Final Assembly (Why Your Entry Price is Higher than your Optimal Price), A. The Van Westendorp Inputs (Price Sensitivity), B. The Unit Economics Inputs (Costs), C. The Value / Market Inputs (Multiplier), 🚨 Critical AI Analysis of Your Data, PricePoint: session Analysis & Pricing Breakdown

### Community 43 - "currency.ts"
Cohesion: 0.33
Nodes (5): SliderField(), COUNTRY_CURRENCY_MAP, CURRENCY_SYMBOLS, getCurrencyFromAnswers(), getCurrencySymbol()

### Community 44 - "agent-browser"
Cohesion: 0.33
Nodes (5): agent-browser, Observability Dashboard, Specialized skills, Start here, Why agent-browser

### Community 45 - "devDependencies"
Cohesion: 0.50
Nodes (3): devDependencies, typescript, typescript

### Community 46 - "PricePoint Master Roadmap & Checklist"
Cohesion: 0.50
Nodes (3): Phase 5.5 — Report Integrity Overhaul ✅, Phase 6 — Crawl4AI Migration 🚀 (In Progress), PricePoint Master Roadmap & Checklist

## Knowledge Gaps
- **294 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+289 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Server Dependencies` to `Server Scripts`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **Why does `Logger` connect `Intelligence Routes` to `Server API Routes`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Client App and Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.05608322026232474 - nodes in this community are weakly interconnected._
- **Should `Question Config and Currency` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `Server Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.044444444444444446 - nodes in this community are weakly interconnected._
- **Should `Client Core Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.07407407407407407 - nodes in this community are weakly interconnected._