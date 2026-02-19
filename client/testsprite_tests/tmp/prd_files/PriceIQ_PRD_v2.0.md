

| PRODUCT REQUIREMENTS DOCUMENT PricePoint *The AI-Powered Intelligent Pricing Engine* Version 2.0  —  Updated with User Journey Classification & Premium Report Architecture Confidential — Internal Use Only |
| :---: |

| Document Owner | Product & Engineering Team |
| :---- | :---- |
| **Version** | v2.0 — Supersedes v1.0 |
| **Date** | February 2026 |
| **New in v2.0** | User Journey Classification System (Section 4), Premium Investor-Grade PDF Report Specification (Section 9), Monetisation Architecture (Section 10\) |

# **Table of Contents**

**1\.**  Executive Summary   .....................................................   3

**2\.**  Product Vision & Problem Statement   ....................................   3

**3\.**  Goals & Success Metrics   ...............................................   4

**4\.**  USER JOURNEY CLASSIFICATION — NEW IN V2.0   .............................   5

  4.1  The Two User Journey Types   .........................................   5

  4.2  Journey A: The Established Seller (Re-Pricing Mode)   ................   6

  4.3  Journey B: The New Launcher (First-Price Mode)   .....................   7

  4.4  Divergence Points in the Questionnaire   .............................   8

  4.5  Journey-Specific AI Prompting Strategy   .............................   9

**5\.**  Target Users & Personas   ...............................................   10

**6\.**  System Architecture Overview   ..........................................   11

**7\.**  Full Question Flow (All Branches)   .....................................   12

  7.1  Root — User Journey Classification   .................................   12

  7.2  Stage 1 — Product Classification   ...................................   12

  7.3  Stage 2A — Physical Product Deep Dive   ..............................   13

  7.4  Stage 2B — Service Deep Dive   .......................................   16

  7.5  Stage 2C — Digital Product Deep Dive   ...............................   18

  7.6  Stage 3 — Market Intelligence (Universal)   ..........................   19

  7.7  Stage 4 — Business Context & Goals   .................................   20

  7.8  Stage 5 — Distribution, Sales Channels & Legal   .....................   21

  7.9  Stage 6 — Psychological Pricing Preferences   ........................   21

**8\.**  AI Engine & Pricing Intelligence Layer   ................................   22

**9\.**  THE PREMIUM PDF REPORT — INVESTOR-GRADE SPECIFICATION   .................   24

  9.1  Report Philosophy & Positioning   ....................................   24

  9.2  Cover Page & Document Identity   .....................................   24

  9.3  Section-by-Section Report Structure   ................................   25

  9.4  Design Standards for the PDF Report   ................................   30

  9.5  Report Variants by Journey Type   ....................................   31

**10\.**  MONETISATION — THE PREMIUM REPORT AS A PAID PRODUCT   ..................   32

**11\.**  UX & Mind Map Design Specifications   ..................................   34

**12\.**  Data Model & Storage   .................................................   35

**13\.**  Non-Functional Requirements   ..........................................   36

**14\.**  Technology Stack   .....................................................   37

**15\.**  Phased Roadmap   .......................................................   38

**16\.**  Risk Register   ........................................................   39

**17\.**  Open Questions & Assumptions   .........................................   40

| SECTION 1 — EXECUTIVE SUMMARY |
| :---: |

PricePoint is an intelligent, AI-powered pricing engine delivered as an interactive mind-map web application. It guides entrepreneurs, founders, freelancers, and product creators through a structured interrogation of their costs, market, competition, and strategy — and produces a data-driven, analyst-quality pricing recommendation with the rigour of a seasoned finance consultant.

Version 2.0 introduces two critical additions: (1) a User Journey Classification system that tailors the entire experience to whether a user is re-pricing an existing product or launching a new one for the first time — fundamentally different problems requiring fundamentally different analysis; and (2) a full specification for the Premium Investor-Grade PDF Report — a paid, downloadable document of professional quality that users can present to investors, boards, financial reviewers, and management teams as official justification for their pricing strategy.

| Core Value Proposition PricePoint is not a calculator. It is an intelligent pricing strategist that combines the analytical rigour of a CFO, the market awareness of a product researcher, and the strategic instincts of a brand consultant — and it produces a document you can walk into any boardroom with. |
| :---- |

| SECTION 2 — PRODUCT VISION & PROBLEM STATEMENT |
| :---: |

## **2.1  The Problem**

| Problem | Business Impact |
| ----- | ----- |
| Pricing based on gut feel or copying competitors | Leaves money on the table or prices too high and kills demand |
| Ignoring hidden costs (taxes, platform fees, own labour, refunds) | Selling at apparent profit while operating at a real, silent loss |
| No framework for re-pricing an existing product | Established sellers undercharge for years because 'it's working' — missing massive margin improvement |
| No data-backed documentation to justify pricing to stakeholders | Founders cannot defend their price to investors, causing credibility damage in funding rounds |
| No differentiation between survival, growth, and premium strategies | Conflating minimum viable pricing with target pricing creates chronic underperformance |

## **2.2  The Vision**

PricePoint will be the world's most thorough, accessible, and credible pricing intelligence tool. It will feel like sitting across from a brilliant pricing consultant who not only tells you what to charge but hands you a polished, official document you can take into any room — investor pitch, board review, partner negotiation — and defend with confidence.

| SECTION 3 — GOALS & SUCCESS METRICS |
| :---: |

| \# | Goal | Definition of Done |
| :---: | ----- | ----- |
| **G1** | Accurate User Journey Routing | 100% of users are correctly categorised as Established Seller or New Launcher within the first 3 questions; routing accuracy verified by user-reported context |
| **G2** | Comprehensive Cost Coverage | Every pricing output accounts for 100% of cost categories relevant to product type |
| **G3** | Market-Grounded Recommendations | Recommended price sits within defensible range of real-world market data for ≥90% of product types tested |
| **G4** | Premium Report as a Paid Product | ≥25% of completed sessions result in a Premium Report purchase within 60 days of feature launch |
| **G5** | Investor-Grade Report Quality | ≥80% of Premium Report users rate the document 'professional enough to present to investors or senior management' in post-download survey |
| **G6** | Session Completion Rate | ≥75% of users who start a questionnaire complete it to the output screen |

| SECTION 4 — USER JOURNEY CLASSIFICATION  \[NEW IN V2.0\] |
| :---: |

| Why This Is the Most Important Gate in the Entire Application An established seller who has been charging $45 for two years needs an entirely different analysis from a founder about to launch their first product at an unknown price. One needs audit and optimisation. The other needs construction from scratch. Asking both the same questions in the same order is a fundamental product failure. This classification must happen before anything else. |
| :---- |

## **4.1  The Two User Journey Types**

| JOURNEY A: THE ESTABLISHED SELLER This user already has a product on the market. They have a price (even if set arbitrarily), they may have sales data, customer feedback, and real-world cost experience. Their core problem is: 'I'm not sure my current price is right — am I undercharging, overcharging, or leaving money on the table?' This journey focuses on AUDIT, COMPARISON, and OPTIMISATION. | JOURNEY B: THE NEW LAUNCHER This user has a product concept or a finished product that has never been sold at a price. They have no sales data, no market validation, and no real-world cost confirmation. Their core problem is: 'I don't know where to start — what should I charge for this?' This journey focuses on CONSTRUCTION, BENCHMARKING, and VALIDATION. |
| :---- | :---- |

## **4.2  Journey A — The Established Seller (Re-Pricing Mode)**

### **4.2.1  Root Classification Questions for Journey A**

| Q\# | Question | Input Type | Purpose |
| :---: | ----- | ----- | ----- |
| **R.A1** | Are you currently selling this product at an active price? | Yes, it is live and selling | Yes, but I paused sales | I sold it before but stopped | No, I have never sold this at a price | Confirms Journey A classification. The nuance matters: a paused product has historical data; a stopped product needs revival context. |
| **R.A2** | What is your current price for this product? | Numeric input (currency) | The anchor for the entire audit. Everything will be measured against this number. It is displayed throughout the session as 'Your Current Price'. |
| **R.A3** | How long have you been selling at this price without changing it? | Less than 3 months | 3–12 months | 1–3 years | More than 3 years | Price staleness indicator. A price unchanged for 3+ years is highly likely to be misaligned with current costs and market. Triggers a staleness flag in the report. |
| **R.A4** | How did you originally set this price? | I calculated my costs carefully | I guessed / used gut feel | I copied a competitor | My supplier or partner suggested it | I ran tests and this was the winner | I honestly don't remember | Pricing provenance. This is used to calibrate how much audit scrutiny to apply. A gut-feel price gets a full reconstruction; a tested price gets a validation check only. |
| **R.A5** | What is your approximate monthly sales volume at the current price? | Numeric input (units/clients/subscriptions per month) | 'I don't track this closely' option | Enables revenue modelling. 'Price × Volume \= Current Revenue' is calculated and displayed. The potential upside at revised prices is shown immediately after. |
| **R.A6** | Are you satisfied with your current profit margin, or do you suspect you are undercharging or overcharging? | I think I am undercharging | I think I am overcharging and losing customers | Margins feel okay but I want to verify | I genuinely don't know — that's why I'm here | Self-diagnosis. The AI uses this to confirm or challenge the user's instinct. If the user says 'I think I undercharge' and the data confirms it, the report makes that case powerfully. |
| **R.A7** | Have your costs changed significantly since you last set this price? (materials, labour, platform fees, shipping, taxes) | Yes — costs have gone up significantly | Yes — costs have come down | Roughly the same | I haven't tracked this | Cost drift detection. One of the most common causes of inadvertent margin erosion for established sellers. A 'costs up, price unchanged' combination is flagged as a Priority Warning. |
| **R.A8** | Has the competitive landscape changed since you set your price? (new competitors, competitor price changes, market shifts) | Yes — market is more competitive now | Yes — I now have less competition | Market seems similar | I don't monitor competitors closely | Market drift detection. Used to identify whether the original pricing rationale (e.g., 'I was the cheapest option') still holds, or whether repositioning is needed. |

### **4.2.2  Journey A — Additional Context Questions**

After the root classification, Journey A users answer the full standard cost questions (Section 7.3–7.5 depending on product type) plus these Journey-A-specific questions:

| Q\# | Question | Input Type | Purpose |
| :---: | ----- | ----- | ----- |
| **A.X1** | What customer feedback have you received about your price? Do customers mention price frequently? | Free text \+ sentiment selector: Never mentioned | Occasionally positive | Frequently cited as great value | Occasionally negative (too expensive) | Frequently cited as too expensive | Customer price sentiment is a real-world signal the AI uses to calibrate pricing headroom. If no one complains about price, there is almost always room to increase. |
| **A.X2** | What is your current conversion rate (approximate)? Of people who see the price, what % purchase? | Numeric input (%) | 'I don't have this data' | Common ranges: E-commerce: 1–4%, Service inquiries: 10–30% | Conversion rate is the most direct signal of price-demand fit. A very high conversion rate often indicates underpricing. A very low rate may indicate overpricing or weak value communication. |
| **A.X3** | Have you ever tested a higher or lower price? What happened? | Yes — tested higher, demand dropped | Yes — tested higher, demand stayed/grew | Yes — tested lower, demand increased significantly | Yes — tested lower, little change | No, I have never changed the price | I ran formal A/B price tests | Historical price elasticity data from the user's own experience. This is the most valuable real-world data in a re-pricing session and is explicitly highlighted in the report. |
| **A.X4** | What is your approximate customer lifetime value (LTV)? How many repeat purchases does a typical customer make? | Number of repeat purchases \+ frequency | 'One-time purchase product' | 'I don't know' | LTV fundamentally changes pricing strategy. A product with high repeat purchase rate can use a lower entry price to build the relationship. A one-time product must maximise at point of sale. |
| **A.X5** | If you increased your price by 10%, what do you believe would happen to your sales volume? | Drop by more than 20% | Drop by 10–20% | Drop by less than 10% | Stay about the same | Might actually increase (prestige effect) | I have no idea | User's self-assessed price elasticity. Combined with actual conversion data and market benchmarks to produce the AI's price elasticity estimate — a key output of the report. |

### **4.2.3  Journey A — AI Audit Output**

For Journey A, the AI performs a PRICING AUDIT: it compares the current price against the fully-loaded cost floor, the market range, the competitor landscape, and the user's own sales signals — then produces an explicit verdict on whether the current price is too low, optimal, or too high, with a specific recommended adjustment.

| Journey A: The Audit Verdict The AI must issue one of four verdicts with supporting arithmetic: (1) SIGNIFICANTLY UNDERPRICED — immediate increase recommended with specific target and justification; (2) MODERATELY UNDERPRICED — incremental increase strategy recommended; (3) OPTIMALLY PRICED — validation with monitoring recommendations; (4) OVERPRICED — repositioning or value-add strategy recommended. The verdict is a prominent, bold section header in the Premium Report. |
| :---- |

## **4.3  Journey B — The New Launcher (First-Price Mode)**

### **4.3.1  Root Classification Questions for Journey B**

| Q\# | Question | Input Type | Purpose |
| :---: | ----- | ----- | ----- |
| **R.B1** | Has this product ever been sold at any price, anywhere, by anyone? | No — this is a completely new product | I have given samples/trials but never charged | I did informal transactions but never had a formal price | It was sold by a previous owner/brand (I acquired it) | Confirms Journey B. The sub-categories capture important nuances — informal transactions provide soft market signals even without formal pricing history. |
| **R.B2** | How far along is the product? Is it ready to sell, or still in development? | Fully finished and ready to sell | Almost ready (1–4 weeks from launch) | In development (1–3 months from launch) | Early concept (3+ months from launch) | Launch horizon affects urgency and the confidence level of cost estimates. Products further from launch will have less precise costs — the report will note this and recommend a review at launch. |
| **R.B3** | Have you validated the demand for this product? Do you know people want to buy it? | Yes — I have paying pre-orders or deposits | Yes — strong verbal/survey interest but no money exchanged | Some informal interest but unverified | No demand validation at all — launching blind | Demand validation status is a critical risk factor. 'Launching blind' triggers a strong recommendation in the report to consider a soft-launch price test before committing to full pricing. |
| **R.B4** | Have you researched what similar products sell for in the market? | Yes — I have a good sense of the market price range | Somewhat — I have looked casually | No — I have no idea what the market charges | Market awareness baseline. If 'No', the system flags that competitor research is especially critical and the AI will perform a thorough market sweep during the session. |
| **R.B5** | Do you have a price in mind already? Or are you coming in completely open? | Yes — I have a specific price in mind (enter it) | Yes — a rough range (enter it) | Completely open — tell me what to charge | Anchoring detection. If the user has a number in mind, the report will explicitly validate or challenge it against the data. This is more valuable than being given a number from nowhere. |
| **R.B6** | What is your primary pricing fear? | I am scared of pricing too high and getting no buyers | I am scared of pricing too low and being seen as cheap | I want to start low and raise prices later | I want to start high and discount if needed | I have no strong preference — show me the data | Fear-based positioning is a common driver of bad first pricing. Surfaced explicitly in the report and addressed directly by the AI with data. The report will validate or reframe the concern. |

### **4.3.2  Journey B — AI Construction Output**

For Journey B, the AI performs a PRICING CONSTRUCTION: it builds the price recommendation from the ground up — starting from zero, establishing the cost floor, mapping the market landscape, applying the chosen strategy, and delivering three launch price options with explicit go-to-market recommendations for each.

| Journey B: First-Price Confidence The report for a New Launcher must give the user the confidence to walk into the market with a number they can defend. It must explain not only what to charge but why this price is rational, what risks they are accepting, and what signals to watch in the first 30/60/90 days to know whether to adjust. It is a launch playbook, not just a number. |
| :---- |

## **4.4  Divergence Points in the Questionnaire**

Beyond the root classification questions, the two journeys diverge at these specific points in the standard question flow:

| Question Stage | Journey A (Established Seller) | Journey B (New Launcher) |
| ----- | ----- | ----- |
| Cost Inputs | Validate costs against known actuals. System flags: 'Your costs have changed by X% since you likely set this price.' | Construct costs from scratch. The system prompts industry benchmarks for every category the user is uncertain about. |
| Competitor Research | 'How does your competitor landscape compare to when you set your price?' Trend analysis, not just a snapshot. | Full competitor sweep. System auto-populates competitor data and presents it as the anchor for the first-time price decision. |
| Sales Volume Questions | Actual sales data (units sold, revenue). Real performance against which recommended adjustments are modelled. | Projected/expected volume with pessimistic/realistic/optimistic scenarios. Sensitivity analysis at different price points. |
| Revenue Projections | 'At your recommended new price, here is the revenue impact vs. your current price at current volume.' | 'At each of the three recommended launch prices, here is projected revenue over months 1, 3, 6, and 12.' |
| Risk Assessment | Re-pricing risks: customer churn from price increase, perception damage from price decrease, competitive response. | Launch risks: insufficient demand validation, cost estimate uncertainty, market timing, competitive response to new entrant. |
| AI Verdict Label | AUDIT VERDICT: \[Underpriced / Optimal / Overpriced\] \+ Specific Adjustment | LAUNCH RECOMMENDATION: \[Survival / Growth / Premium Launch Price\] \+ 90-Day Monitoring Plan |
| Report Title | 'Pricing Audit & Optimisation Report — \[Product Name\]' | 'Pricing Strategy & Launch Recommendation Report — \[Product Name\]' |

## **4.5  Journey-Specific AI Prompting Strategy**

| AI Analysis Layer | Journey A Prompt Focus | Journey B Prompt Focus |
| ----- | ----- | ----- |
| Cost Analysis | 'The user's current price is \[X\]. Their fully-loaded cost is \[Y\]. Calculate the margin gap and flag if it is below industry standard.' | 'Build the fully-loaded cost from scratch. For each cost input below industry average, flag as potentially underestimated and show the benchmark.' |
| Market Positioning | 'Compare current price \[X\] to the market range \[floor–ceiling\]. Assess whether the user is positioned correctly given their stated quality level and differentiator.' | 'Establish market range from competitor data. Recommend positioning within that range based on product stage, differentiator, and business goal.' |
| Strategic Advice | 'Given sales performance, conversion rate, and customer feedback data, assess whether the current price is working and what the risk/reward of adjustment is.' | 'Given no sales history, construct a 90-day pricing hypothesis with specific signals the user should track to confirm or revise the price within the first quarter.' |
| Report Narrative | 'Write as a pricing auditor reviewing an existing business. The tone is: here is what the data reveals about your current price.' | 'Write as a launch strategist advising a first-time seller. The tone is: here is how to enter the market with confidence and a clear plan.' |

| SECTION 5 — TARGET USERS & PERSONAS |
| :---: |

| Dimension | The Maker (A) | The Freelancer (A/B) | The Builder (B) | The Founder (A/B) |
| ----- | ----- | ----- | ----- | ----- |
| **Profile** | Artisan, Etsy seller, D2C brand, handmade goods | Consultant, designer, developer, coach | SaaS founder, indie dev, course creator | Early-stage startup, seeking investment |
| **Journey Type** | Often A — selling but knows margins are off | Often A/B — re-pricing or quoting a new client | Often B — launching a new product or tier | A or B — needs the Premium Report for investor credibility |
| **Primary Pain** | Underpricing \+ not counting own labour | Race-to-bottom fear; cannot justify premium rate | Uncertain on model; scared of wrong launch price | Needs a professional document to show due diligence on pricing |
| **Premium Report Use** | Buyer confidence: 'This product is correctly priced' | Client pitch: 'This rate is market-validated' | Investor deck appendix; pricing methodology proof | Board presentation; due diligence evidence package |

| SECTION 6 — SYSTEM ARCHITECTURE OVERVIEW |
| :---: |

| \# | Layer | Component | Responsibility |
| :---: | ----- | ----- | ----- |
| **1** | UI Layer | Mind Map Interface | Interactive animated mind map. Progressive node expansion. Journey type selection at root. Handles all question types: single select, multi-select, free text, numeric, slider. |
| **2** | Journey Engine | Classification Router | Analyses root answers to determine Journey A vs B. Sets the session context flag that influences every downstream question, calculation, and report template. Cannot be overridden mid-session without restarting. |
| **3** | Question Engine | Branching Logic Processor | Rule-based question sequencer. Conditional skipping, validation, and dynamic sub-question injection. Journey-aware: different question sets, different wording, different benchmarks for A vs B. |
| **4** | Data Layer | Enrichment Service | Real-time API calls: market pricing, competitor databases, tax tables, platform fee registry, exchange rates, labour benchmarks, industry margin databases. All results cached and versioned. |
| **5** | AI Engine | Pricing Intelligence Core | LLM integration. Receives full structured session \+ journey type context. Performs cost audit (A) or cost construction (B), market analysis, competitive positioning, strategy application, risk identification. |
| **6** | Report Layer | Premium PDF Generator | Produces the investor-grade PDF from a structured template populated with AI outputs, cost data, market charts, and the three-tier recommendation. Paywalled. Branded. Versioned. Downloadable. |
| **7** | Payment Layer | Premium Report Commerce | Handles Premium Report purchase. Stripe integration. One-time purchase per report. Generates a unique secure download link. Enables report re-generation at updated prices (re-purchase model). |

| SECTION 7 — FULL QUESTION FLOW (ALL BRANCHES) |
| :---: |

## **7.1  Root — User Journey Classification (First Screen)**

This is the very first interaction. No product type, no costs — nothing — before this is answered. The root classification is the mandatory first node of the mind map.

| Q\# | Question | Options | Route |
| :---: | ----- | ----- | ----- |
| **ROOT.1** | Welcome to PricePoint. Before we begin, tell us about your situation. | I already sell this product and want to check/fix the price | I have a new product and need to set a price for the first time | Option 1 → Journey A questions (R.A1 onwards) | Option 2 → Journey B questions (R.B1 onwards) |

| Design Note This question must be presented with warmth and clarity — not as a technical gate but as a conversational opener. The two options should be written in plain, empathetic language. The mind map root node should display both paths visually so the user understands there are two distinct journeys before selecting. |
| :---- |

## **7.2  Stage 1 — Product Classification**

Shown after the Journey type is determined. Product type selection branches into three major sub-trees.

| Q\# | Question | Input Type | Notes |
| :---: | ----- | ----- | ----- |
| **Q1.1** | What type of product are you pricing? | Physical Product | Service | Digital Product | Root branch selector. Determines which of three deep-dive branches (2A, 2B, 2C) loads next. |
| **Q1.2** | Give your product a working name or description. | Free text (required) | Displayed in report header and throughout the mind map as context anchor. |
| **Q1.3** | In which country is your business based? | Searchable dropdown | Triggers tax rate lookup, VAT/GST logic, currency defaults, labour cost benchmarks. |
| **Q1.4** | In which countries/regions do you plan to sell? | Multi-select dropdown | Triggers multi-region compliance and platform availability logic. |
| **Q1.5** | What currency for this analysis? | Single select (auto-suggested) | All financial outputs in this currency. |

## **7.3  Stage 2A — Physical Product Deep Dive**

| Q\# | Question | Input Type | Why We Ask / Journey Notes |
| :---: | ----- | ----- | ----- |
| **Q2A.1** | What category best describes your physical product? | Single select: Apparel, Food & Beverage, Electronics, Home Goods, Health & Beauty, Crafts/Handmade, Sporting Goods, Industrial, Other | Loads category-specific cost benchmarks and market data. Journey A: used to validate existing costs. Journey B: used to suggest typical cost ranges for unknowns. |
| **Q2A.2** | How do you produce or source this product? | Make myself | Outsource manufacturing | Buy wholesale/resell | Dropship | Private-label | Determines cost structure. Each source type has fundamentally different COGS logic. |
| **Q2A.3** | Raw material / purchase cost per unit? | Numeric input (currency) | Core COGS. Journey A: compare to what they paid when the price was set — inflation flag if significant difference. |
| **Q2A.4** | Time spent producing ONE unit (if applicable)? | Hours:minutes \+ 'Not applicable' | Labour is the most frequently forgotten cost. For Journey A, this question includes: 'Has this changed since you set your price?' |
| **Q2A.5** | Hourly rate for that labour? | Numeric input | 'Use local minimum wage' auto-fill | Labour cost \= Q2A.4 × Q2A.5. Shown only if Q2A.4 has a value. |
| **Q2A.6** | Packaging cost per unit? | Numeric input. If 0: warning prompt. | If 0: 'Are you sure? Packaging is a common blind spot.' Journey A: flag if costs have risen since price was set. |
| **Q2A.7** | Inbound shipping/freight per unit? (import duty, customs broker, freight-in) | Sub-fields: Freight per unit, Import duty %, Customs broker fee (amortised) | Import costs are often fixed at time of supplier agreement. Journey A: flag if supplier prices/shipping rates have changed. |
| **Q2A.8** | Storage/holding cost per unit per month? | Yes/No. If Yes: rate \+ avg months in storage | Holding cost highlights dead-stock losses. Journey B: benchmarked against category average holding times. |
| **Q2A.9** | Outbound shipping cost per unit to the customer? | Numeric input | 'I offer free shipping' toggle | Free shipping toggle adds cost to COGS automatically with a callout: 'Free shipping is never free — it is cost absorbed into your price.' |
| **Q2A.10** | Monthly overhead \+ monthly unit volume? | Two numeric inputs | Overhead per unit \= overhead ÷ units. Journey A: compare actual volume vs volume when price was originally set. |
| **Q2A.11** | Monthly marketing / advertising spend for this product? | Numeric input | 'Not spending on marketing' | Marketing cost per unit \= ad spend ÷ units. Journey A: compare to marketing spend at time of original pricing. |
| **Q2A.12** | Which selling platforms do you use or plan to use? | Multi-select: Amazon, Etsy, eBay, Shopify, WooCommerce, Instagram, Own website, Wholesale, Trade shows | Auto-loads current platform fees from database. User can review and override. Fee database updated weekly. |
| **Q2A.13** | Expected return/refund rate (%)? | Numeric \+ industry benchmark auto-suggestion | Journey A: use actual refund rate from sales history. Journey B: pre-populate with category average and note it is an estimate. |
| **Q2A.14** | Licences, certifications, or compliance fees? | Yes/No. If Yes: type \+ annual cost | Amortised annual licence cost divided by annual units. Legal/compliance costs are chronically forgotten. |
| **Q2A.15** | Product liability insurance annual premium? | Yes/No/Planning. If Yes: annual premium | If 'No' for a physical product: risk flag in report recommending insurance review. |
| **Q2A.16** | Payment processor used? | Yes/No. Select processor — fee auto-filled | Stripe, PayPal, Square etc. Typically 1.5–3.5% per transaction. Auto-populated from fee database. |
| **Q2A.17** | Any other recurring costs not mentioned? (tools, software, photography, QA testing) | Free text \+ monthly cost | Open-ended catch-all. Users commonly remember items here. Fed into 'Other costs' in the breakdown. |

## **7.4  Stage 2B — Service Deep Dive**

| Q\# | Question | Input Type | Why We Ask / Journey Notes |
| :---: | ----- | ----- | ----- |
| **Q2B.1** | Service category? | Creative/Design, Tech/Dev, Consulting, Education/Coaching, Legal/Financial, Health/Wellness, Trades/Labour, Events, Other | Loads industry rate benchmarks. Journey A: compare current rate to market. Journey B: market rates as the anchor for construction. |
| **Q2B.2** | Preferred billing model? | Hourly | Flat Project Fee | Retainer | Day Rate | Value-Based | Per Deliverable | Key branching question. Different models require entirely different calculations and report structures. |
| **Q2B.3** | Desired annual personal income from this business? | Numeric input | Journey A: 'Is your current rate actually achieving this?' Journey B: backward-pricing starting point. |
| **Q2B.4** | Annual business operating expenses? | Multi-field: software, equipment, memberships, office, phone, internet | Business expenses must be recovered before owner income is realised. |
| **Q2B.5** | Specialist tools/software for service delivery? | Itemised list with monthly/annual cost | Design tools, dev software, CRM, video tools — COGS for service businesses. |
| **Q2B.6** | Self-employment tax / national insurance rate? | Auto-suggested from country | Limited company option | Custom entry | Most frequently forgotten cost by freelancers. Auto-populated from regional tax database. |
| **Q2B.7** | Working weeks per year? | Numeric input. Auto-suggest: 46 weeks with explanation | Journey A: reveals whether current rate assumption of 52 weeks is causing chronic income shortfall. |
| **Q2B.8** | Genuinely billable hours per week? (exclude admin, marketing, business dev) | Numeric. Auto-suggest: 60–70% of working hours by service type | Most eye-opening question: most solopreneurs assume 40 billable hours; reality is 24–28. |
| **Q2B.9** | Freelance platforms / agency commission? | Platform selection \+ commission % auto-filled from database | Upwork 5–20%, Fiverr 20%, Toptal variable. Must be factored in to achieve target income net of fees. |
| **Q2B.10** | Professional indemnity / liability insurance annual premium? | Numeric | 'Not insured' | 'Do not need' | If 'Not insured': risk flag suggesting estimated coverage cost is modelled into pricing. |
| **Q2B.11** | Average bad-debt / unpaid invoice rate? | Numeric % | 'Use industry benchmark' | Bad debt is a real cost. Journey A: use actual unpaid % from business records. Journey B: benchmark provided. |
| **Q2B.12** | Years of verifiable experience in this field? | Numeric | 'Less than 1 year' | Experience is a pricing multiplier. Benchmarked against industry rate databases. |
| **Q2B.13** | Portfolio strength and certifications? | Strong portfolio & certs | Some evidence | Word-of-mouth | Just starting | Specialist credentials are a pricing multiplier. AI uses this to adjust premium positioning. |
| **Q2B.14** | Competitor rate range for comparable service? | Low range \+ high range inputs | 'Look it up' AI search button | 'Look it up' triggers real-time AI search for average rates by service category and region. |

## **7.5  Stage 2C — Digital Product Deep Dive**

| Q\# | Question | Input Type | Why We Ask / Journey Notes |
| :---: | ----- | ----- | ----- |
| **Q2C.1** | Digital product format? | SaaS, Mobile App, E-book, Online Course, Template/Asset, Plugin, API/Data Service, Music/Audio, Photography Pack, Other | Determines cost structure (recurring vs one-time) and relevant competitor databases. |
| **Q2C.2** | Preferred sales model? | One-time purchase | Monthly subscription | Annual subscription | Freemium \+ upgrade | Pay-what-you-want | Per seat licence | Per organisation licence | Unlocks entirely different calculation paths. LTV-based for subscriptions; break-even per unit for one-time. |
| **Q2C.3** | Total development cost to build the product? | Breakdown: own time (hours × value), contractor fees, design costs, third-party libraries | Primary upfront investment. System calculates break-even unit volume at each price point. |
| **Q2C.4** | Monthly recurring infrastructure costs? | Multi-field: hosting, CDN, database, email, analytics, monitoring, third-party APIs | Per-user infra cost is critical for SaaS. Does cost scale linearly or sublinearly with users? |
| **Q2C.5** | Ongoing product/maintenance cost per month? | Numeric \+ common suggestions: bug fixes, security, content updates, support hours | Invisible recurring cost. Often forgotten: 'it's finished' is never truly finished. |
| **Q2C.6** | Distribution platforms? | Own website (Gumroad, Paddle, LemonSqueezy), App Store, Google Play, Udemy, Teachable, Thinkific, Envato, ProductHunt, Steam, Shopify App Store | Platform fees auto-loaded. Apple App Store 30%/15%, Udemy 37%–63% etc. User can override. Source and date stamped. |
| **Q2C.7** | Monthly churn rate for subscription models? | Numeric % | 'Use benchmark' | LTV \= Monthly Price / Churn Rate. Most important variable for subscription pricing. Industry benchmarks loaded by product category. |
| **Q2C.8** | Customer acquisition cost (CAC)? | Numeric | 'Organic only' | 'Calculate from ad budget' | LTV must be ≥ 3× CAC. If ratio is below this, a BUSINESS VIABILITY WARNING is issued. |
| **Q2C.9** | Third-party licences or API fees embedded in the product? | Yes/No. Itemise with monthly cost | Licence fees are a per-user cost that is invisible until you are in violation or operating at a loss. |
| **Q2C.10** | Refund policy? | 30-day / 14-day / 7-day / No refunds / Conditional | Refund rate for digital: 3–8% for courses, 1–3% for software. Provision is a cost against effective revenue. |

## **7.6 — 7.9  Universal Question Stages (Summary Reference)**

Stages 3–6 apply to all product types and both journey types, with journey-specific wording and benchmarks as documented in Section 4.4. The full question tables for these stages are maintained in the companion specification appendix. Summary:

| Stage | Key Questions Covered | Journey Differentiation |
| ----- | ----- | ----- |
| Stage 3: Market Intelligence | Target customer type & demographics, pain severity, price sensitivity, top 3 competitors \+ prices, competitive self-assessment, differentiator, floor and ceiling price estimates | Journey A: 'Has the competitive landscape changed since you set your price?' Journey B: Full competitor sweep with AI-powered search. |
| Stage 4: Business Goals | Primary goal (survive/grow/prestige/test), target margin, expected sales volume, existing demand status, promotional intent | Journey A: Models revenue impact of price change at current volume. Journey B: Three scenario projections (pessimistic/realistic/optimistic) at each of the three launch price options. |
| Stage 5: Distribution & Legal | Sales channels, VAT/GST obligation, international tax, wholesale/reseller margins, payment collection cycle | Journey A: Validates current channel mix against updated pricing. Journey B: Recommends channel strategy given launch price. |
| Stage 6: Psychological Pricing | Pricing presentation style (charm/prestige/round), tiering plan, exclusivity importance, hard constraints | Journey A: Notes current psychological format and assesses whether it aligns with brand position. Journey B: Recommends psychological format for market entry. |

| SECTION 8 — AI ENGINE & PRICING INTELLIGENCE LAYER |
| :---: |

## **8.1  Three-Phase AI Processing**

| Phase | Timing | What Happens |
| ----- | ----- | ----- |
| **Phase 1: Enrichment** | During questionnaire | At key question nodes, the system makes real-time calls to: market pricing APIs, competitor databases, regional tax tables, platform fee registry, exchange rate APIs, labour benchmark databases, and industry margin databases. Results are cached and displayed as live data hints within relevant question nodes. |
| **Phase 2: Synthesis** | Post-completion | LLM receives a full structured session as context. Performs: COGS calculation and audit (A) or construction (B), market ceiling identification, competitive positioning, strategy filter application, risk flag generation, Journey A audit verdict or Journey B launch recommendation, three-tier price computation, psychological rounding. |
| **Phase 3: Narrative** | Report generation | LLM generates: executive summary narrative (2–3 paragraphs), journey-type-specific analyst commentary, risk flag explanations, competitive context narrative, strategic rationale for each of the three price points, 90-day monitoring plan (Journey B) or re-pricing implementation plan (Journey A). |

## **8.2  External Data Sources**

| Data Source | What It Provides | Refresh Cadence |
| ----- | ----- | ----- |
| Market Pricing API | Real-time price range for comparable products/services by category and region from major marketplaces | Live / real-time query per session |
| Competitor Database | Searchable product/service database aggregated from Amazon, Etsy, Upwork, Gumroad, G2, Capterra, App Store | Daily aggregation, 24h cache per session |
| Regional Tax Table | VAT/GST rates, SE tax rates, corporate thresholds by country and state/province | Monthly update \+ change monitoring |
| Platform Fee Registry | Current fee structures for 40+ selling platforms (Amazon FBA, Etsy, Shopify, App Stores, Udemy, Gumroad, Stripe etc.) | Weekly verification vs official platform pages |
| Labour Benchmark Database | Industry median hourly rates by role and region for service provider rate validation | Quarterly update from industry salary surveys |
| Industry Margin Database | Typical gross and net margin ranges by product/service category for benchmark comparison | Quarterly update |
| Exchange Rate API | Real-time exchange rates for multi-currency comparison | Live |

## **8.3  Mandatory Warning Conditions**

| Trigger Condition | Severity | Action in App \+ Report |
| ----- | :---: | ----- |
| Recommended / current price \< fully-loaded COGS | **CRITICAL** | Red banner in app. Blocks report generation until the user acknowledges. The report opens with a full-page CRITICAL LOSS WARNING section. |
| Gross margin below industry benchmark for category | **HIGH** | Orange flag in app. Prominent warning section in report with comparison to industry standard and remediation options. |
| LTV:CAC ratio below 3:1 (digital/subscription products) | **HIGH** | Business sustainability flag. The report section explains the LTV:CAC framework and shows what price would achieve a 3:1 ratio. |
| Journey A: costs have risen significantly since price was set | **HIGH** | Journey-A-specific flag: 'Your costs have increased by an estimated X% while your price has not changed. Your actual margin is Y, not what you originally planned.' |
| Journey A: price unchanged for 3+ years | **MEDIUM** | Price staleness advisory: 'A price unchanged for 3+ years is very likely out of step with current costs and market rates. This audit is highly recommended.' |
| Journey B: no demand validation | **MEDIUM** | Launch risk advisory: 'Without demand validation, your recommended price is a hypothesis. We strongly suggest a soft-launch test before committing to full-scale pricing.' |
| Billable hours insufficient for desired income (service providers) | **HIGH** | Income gap alert: 'Even at 100% billable capacity, your current rate produces income of \[X\], below your target of \[Y\].' |

| SECTION 9 — THE PREMIUM PDF REPORT: INVESTOR-GRADE SPECIFICATION  \[NEW IN V2.0\] |
| :---: |

## **9.1  Report Philosophy & Positioning**

| What this document must be The Premium Report is not a printout of the app's results. It is an official business document — structured, sourced, explained, and formatted to the standard of a consulting deliverable. It must be legible and credible to a person who has never heard of PricePoint. An investor reading page one should understand immediately: this pricing decision was made with rigour, data, and strategic intent. |
| :---- |

The Premium Report serves three distinct audiences simultaneously: (1) The user themselves — to understand and act on their pricing. (2) Internal stakeholders — team members, co-founders, partners who need to understand the pricing rationale. (3) External audiences — investors, boards, banks, retailers, or distributors who need confidence that the pricing was professionally determined.

| Dimension | Standard (Free) Output | Premium Report (Paid) |
| ----- | ----- | ----- |
| Format | In-browser interactive display | Professionally designed PDF document, branded, paginated, print-ready |
| Content Depth | Summary card with three price points and brief rationale | Full 5-30 page analytical document with charts, tables, methodology notes, and narrative sections |
| Data Attribution | Data sources noted briefly | Every data point attributed with source name, date retrieved, and methodology note |
| Audience | User only | Presentable to investors, boards, partners, retailers, banks, management teams |
| Branding | PricePoint interface branding | PricePoint brand cover \+ user's business name/logo integration \+ document ID \+ verification seal |
| Methodology Section | Not included | Full methodology appendix explaining how every number was arrived at |
| Legal Disclaimer | Standard tooltip | Full legal disclaimer page with scope-of-analysis statement and advisory limitations |

## **9.2  Cover Page & Document Identity**

The cover page establishes the document's authority and professional standing immediately. Every design and content decision on the cover page must signal 'this is a serious document.'

| Cover Element | Specification |
| ----- | ----- |
| Document Title | Journey A: 'Pricing Audit & Optimisation Report' | Journey B: 'Pricing Strategy & Market Entry Report' |
| Sub-Title | \[Product Name\] — Prepared by PricePoint Intelligence Engine |
| Business Name Field | User's business name as entered during session, large and prominent — makes it feel like it was produced for them specifically |
| User Logo Field | Optional: user uploads logo during checkout; embedded in top-right of cover. If no logo: business name only. This personalisation is a key perceived-value driver. |
| PricePoint Branding | PricePoint wordmark \+ tagline in lower-left. Co-branding style: 'Powered by PricePoint' (not dominant, but present and credible) |
| Document ID | Auto-generated unique report reference number (e.g., PIQ-2026-A-0047823) printed on cover and footer of every page. Enables verification. |
| Date of Analysis | Session completion date. Data validity note: 'Market data accurate as of \[date\]. Recommend re-analysis if market conditions change materially.' |
| Prepared For Statement | 'This report was prepared exclusively for \[Business Name\]. It reflects market conditions and business data as provided at the time of analysis.' |
| Classification Stamp | 'COMMERCIAL IN CONFIDENCE' stamp — reinforces that this is an official business document, not a consumer tool printout |
| Colour Scheme | Navy and white primary palette with gold accent for report type badge (AUDIT or STRATEGY). Matches PricePoint brand but elevated — darker, more authoritative than the app UI. |

## **9.3  Section-by-Section Report Structure**

The report is divided into clearly numbered sections with a printed table of contents. The following table specifies every section, its content, approximate length, and its primary audience.

### **PART 1 — EXECUTIVE MATERIALS**

| \# | Section Title | Content | Pages | Primary Audience |
| :---: | ----- | ----- | :---: | ----- |
| **01** | Cover Page | Document title, product name, business name/logo, PricePoint branding, document ID, date, prepared-for statement, classification stamp | 1 | All audiences |
| **02** | Table of Contents | Numbered sections with page references. Professional legal/consulting document style. | 1 | All audiences |
| **03** | Executive Summary | One-page overview of: product being analysed, analysis type (Audit vs Strategy), key finding (underpriced/optimal/overpriced or first-price recommendation), the three recommended price points in a prominent visual box, and the top strategic recommendation in plain English. This page must be fully self-contained — an investor who reads only this page gets the essential story. | 1 | Investors, executives |
| **04** | Scope of Analysis | What was analysed, what was not. Data provided by user vs data sourced externally. Key assumptions. Limitations of the analysis. Advisory disclaimer. This section is required for use in investor and compliance contexts. | 1 | Investors, legal review |

### **PART 2 — PRODUCT & BUSINESS CONTEXT**

| \# | Section Title | Content | Pages | Primary Audience |
| :---: | ----- | ----- | :---: | ----- |
| **05** | Product Profile | Full description of the product being priced: name, type (physical/service/digital), category, production/delivery method, target market, countries of sale, currency, journey type (Audit or Launch). Reads as an analyst's product brief. | 1–2 | All audiences |
| **06** | Target Market Analysis | Customer type and demographic profile as provided. Pain severity and problem-solution fit. Price sensitivity classification with reasoning. Customer lifetime value estimate (or range). Journey A: current customer profile compared to original assumptions. Journey B: target customer hypothesis and validation status. | 1–2 | All audiences |
| **07** | Business Context | Current business stage, primary strategic goal (survival/growth/prestige/market entry), sales channel overview, tax and legal context, key commercial constraints or opportunities. Frames why the pricing strategy recommendation is appropriate for this specific business at this specific point in time. | 1 | Investors, management |

### **PART 3 — COST INTELLIGENCE**

| \# | Section Title | Content | Pages | Primary Audience |
| :---: | ----- | ----- | :---: | ----- |
| **08** | Complete Cost Structure | Itemised table of EVERY cost input. Columns: Cost Item | Amount (per unit/per month/annual) | Allocation Method | Per-Unit Amount | Source (User-provided / System-calculated / Industry benchmark). Totalled to show Fully-Loaded Cost Per Unit. No cost category may be omitted — even $0 entries are shown with a note. | 2–3 | User, finance review |
| **09** | Cost Composition Chart | Pie chart (or stacked bar) showing the % contribution of each cost category to the total. Top 3 cost drivers highlighted with commentary. Journey A: comparison chart showing cost structure NOW vs estimated structure WHEN price was set. Journey B: comparison showing user's costs vs industry benchmark costs for the category. | 1 | All audiences |
| **10** | Cost Benchmark Analysis | Comparison of user's cost structure against industry benchmarks for the product category. Flags any cost items that are significantly above or below benchmark, with interpretation. Journey A: highlights cost drift since original pricing. Journey B: identifies likely underestimated costs for a new entrant. | 1–2 | User, investors |
| **11** | Floor Price Determination | Explicit calculation of the Survival (Floor) Price: Fully-Loaded Cost Per Unit \+ Minimum Viable Margin (%) \= Floor Price. Minimum margin percentage and the reasoning for it. Clear statement: 'This product cannot be sustainably priced below \[Floor Price\]. Any price below this results in a net loss per unit sold.' | 1 | All audiences |

### **PART 4 — MARKET INTELLIGENCE**

| \# | Section Title | Content | Pages | Primary Audience |
| :---: | ----- | ----- | :---: | ----- |
| **12** | Competitive Landscape Overview | Named competitor analysis table: Competitor Name | Product/Service Description | Price | Positioning (economy/mid/premium) | Key Differentiator vs User's Product | Source & Date. Minimum 3 competitors. AI-sourced where user did not provide names. Journey A: flags how the competitive landscape has changed since the price was set. | 2–3 | Investors, user |
| **13** | Market Price Range Chart | Visual chart (horizontal bar or bell curve) showing: Market Low (cheapest comparable product found), Market Median (middle of the range), Market High (most expensive comparable), and a marker for WHERE THE USER'S PRODUCT SITS. For Journey A: current price marker. For Journey B: three recommended price markers. This is one of the most powerful visuals in the report. | 1 | All audiences |
| **14** | Competitive Positioning Assessment | Narrative section: How does the product compete on price? Is it positioned as economy, value, mid-market, or premium? Is that positioning supported by the product's actual quality and differentiator? Where is the pricing power? What would justify a premium over the market median? Journey A: is the current positioning intentional and defensible? Journey B: what is the recommended entry position and why? | 1–2 | Investors, user |
| **15** | Market Ceiling Determination | Explicit identification of the Market Price Ceiling — the highest price a customer will accept before seeking alternatives. Based on: willingness-to-pay data, highest competitor price, user's stated customer price sensitivity, pain severity, and differentiator quality assessment. Stated as: 'The market ceiling for this product, given the competitive context and target customer, is estimated at \[range\].' | 1 | All audiences |

### **PART 5 — THE PRICING RECOMMENDATION**

| \# | Section Title | Content | Pages | Primary Audience |
| :---: | ----- | ----- | :---: | ----- |
| **16** | Journey A: Audit Verdict  OR  Journey B: Launch Recommendation | JOURNEY A — AUDIT VERDICT: Bold, prominent section. One of four verdicts (Significantly Underpriced / Moderately Underpriced / Optimally Priced / Overpriced) with: the gap between current price and recommended price, the arithmetic behind the verdict, and the annual revenue impact of adopting the recommendation. | JOURNEY B — LAUNCH RECOMMENDATION: The rationale for the recommended first price including: why this price is appropriate for the stage of the business, how it positions the product in the market, and what it signals to the target customer. | 2 | ALL — this is the centrepiece |
| **17** | Three-Tier Price Recommendation | THREE CLEARLY LABELLED TIERS presented as a visual table or card layout: | TIER 1 — SURVIVAL PRICE: Fully-Loaded Cost \+ 10% buffer. Definition of use case. When to use this price. Risk of sustained use at this level. Arithmetic shown in full. | TIER 2 — GROWTH PRICE (RECOMMENDED): Fully-Loaded Cost \+ industry-standard margin. Market positioning. Expected volume/revenue trade-off. Why this is the recommended default. | TIER 3 — PREMIUM / MAXIMUM PROFIT PRICE: Fully-Loaded Cost \+ maximum justifiable margin targeting 80th–95th market percentile. Conditions required to sustain this price. Differentiator justification. | Each tier includes: the price (formatted per psychological preference), gross margin %, gross profit per unit, and monthly/annual revenue at projected volume. | 2–3 | All audiences |
| **18** | Revenue Projections | At each of the three price tiers, a projection table showing: Monthly revenue at pessimistic/realistic/optimistic sales volume. Annual revenue. Gross profit at each scenario. Break-even unit volume. Journey A additionally shows: current revenue vs projected revenue at recommended price, and cumulative additional revenue over 12 months from adopting the recommendation. | 1–2 | Investors, user |
| **19** | Strategy Rationale & Analyst Commentary | 2–3 paragraphs of AI-generated narrative written in the voice of a senior pricing analyst. Explains: why the recommended tier is preferred, how it sits within the competitive landscape, what strategic goal it serves, and what the user would be giving up by choosing a higher or lower tier. This is NOT bullet points — it is coherent, professional prose. | 1 | All audiences |

### **PART 6 — RISK, IMPLEMENTATION & MONITORING**

| \# | Section Title | Content | Pages | Primary Audience |
| :---: | ----- | ----- | :---: | ----- |
| **20** | Risk Assessment | Structured table of pricing risks identified by the AI analysis. Columns: Risk Description | Likelihood | Impact | Mitigation Recommendation. Journey A risks include: customer churn from price increase, competitive response, brand perception risk. Journey B risks include: demand uncertainty, cost underestimation, competitive entry response, positioning mismatch. All active warning flags from Section 8.3 appear here with full explanations. | 1–2 | User, investors |
| **21** | Journey A: Re-Pricing Implementation Plan  OR  Journey B: Launch Pricing Plan | JOURNEY A — RE-PRICING PLAN: Step-by-step implementation guide. Immediate actions (update price, notify customers?). Communication strategy (how to justify the change to customers). Timeline (phase-in vs immediate change recommendation). Monitoring checkpoints at 30, 60, 90 days. | JOURNEY B — LAUNCH PRICING PLAN: Launch sequence recommendation. Introductory/promotional strategy if applicable. When and why to review the price (specific triggers). 30/60/90-day key metrics to watch. Signs that the price should be raised or lowered. | 2 | User, operations |
| **22** | Psychological Pricing Recommendations | Application of the user's stated psychological pricing preference to each of the three tier prices. Explanation of why the format was chosen. Visual example of how the price should be displayed (e.g., '$49' vs '$49.99' vs '$49.95'). Note on anchoring strategy if multiple tiers are offered. | 1 | User, marketing team |
| **23** | Tax & Compliance Notes | Summary of relevant tax obligations based on business country and sale regions. VAT/GST treatment recommendation. Platform fee summary at each price point (showing effective take-home per unit per platform). Note: clearly labelled as indicative only — user must consult qualified tax advisor. | 1 | User, accountant |

### **PART 7 — APPENDICES**

| \# | Section Title | Content | Pages | Primary Audience |
| :---: | ----- | ----- | :---: | ----- |
| **A** | Methodology & Data Sources | Full methodology disclosure. How each recommendation was calculated. Which data sources were used for which data points, with last-updated dates. LLM analysis disclosure statement. Statistical confidence notes where applicable. This appendix is the document's 'show your work' section — essential for investor and due diligence audiences. | 2–3 | Investors, audit |
| **B** | Glossary of Terms | Definitions of all financial and pricing terms used in the report (COGS, gross margin, LTV, CAC, price elasticity, floor price, ceiling price, etc.). Ensures the document is accessible to non-financial readers. | 1 | All audiences |
| **C** | Full Cost Input Record | Complete, unabridged record of every answer submitted by the user in the session, formatted as a data table. Serves as an audit trail and allows the user or a third party to verify any calculation in the report by tracing it back to the raw input. | 2–3 | Audit, due diligence |
| **D** | Legal Disclaimer & Advisory Limitations | Full legal disclaimer page. Statement that PricePoint provides decision-support analysis only and does not constitute financial, legal, tax, or investment advice. Recommendation to seek qualified professional advice for tax, legal, and investment decisions. Statement that market data is sourced from third-party databases and may not be exhaustive. | 1 | Legal, compliance |
| **E** | Report Verification Page | Final page. Document ID, generation timestamp, session hash, PricePoint engine version, data source versions used. QR code linking to a PricePoint report verification URL (where the recipient can confirm the report is authentic and unaltered). This page enables the document to be used in formal contexts. | 1 | Investors, legal |

## **9.4  Design Standards for the PDF Report**

| Design Element | Specification | Rationale |
| ----- | ----- | ----- |
| Page Size | A4 (210 × 297mm) — international standard for business documents | A4 is the professional standard in all markets outside North America. US Letter is an acceptable alternate output. |
| Margins | 25mm top/bottom, 20mm left, 20mm right. Header and footer zones 15mm each. | The wider left margin provides a natural reading gutter and space for annotation if printed. |
| Typography | Headings: Inter Bold. Body: Inter Regular. Data tables: Inter Medium. Accent callouts: Inter SemiBold. Base size: 10pt body, 14pt H2, 18pt H1, 24pt section titles. | Inter is optimised for both screen and print at small sizes. A consistent weight system creates a clear hierarchy without needing colour. |
| Colour Usage | Primary: Navy \#0A1628 (headings, borders). Accent: PricePoint Blue \#0057B8 (section markers, key numbers). Highlight: Gold \#B8860B (Journey A badge), Teal \#00897B (Journey B badge). Data tables: alternating \#F8FAFC / white rows. | The Navy conveys authority and seriousness. Blue and gold/teal provide visual distinction between the two journey report types. The limited colour palette maintains a premium feel. |
| Charts & Graphs | All charts rendered as high-resolution SVG (vector). Minimum 3 charts required: (1) Cost Composition pie/bar, (2) Market Price Range positioning chart, (3) Revenue projection comparison. Charts use the same colour palette as the document. No chart is included without a written interpretation beneath it. | Vector charts are infinitely scalable and print-crisp. Written interpretation ensures no reader is left to interpret data alone — essential for investor audiences. |
| Running Header | Left: PricePoint logo (small). Centre: Section title (current section). Right: Document ID. Blue bottom border. | Running header allows any page to be identified in context if printed and separated from the main document. |
| Running Footer | Left: Report title \+ journey type. Centre: 'Confidential — \[Business Name\]'. Right: Page X of Y. | A confidentiality stamp on every page protects the user's business information if the document is shared. |
| Three-Tier Recommendation Box | Full-width three-column layout for Sections 17\. Each tier in a clearly bordered card. Tier 2 (Growth) is slightly elevated visually — larger border, blue background accent — to indicate the recommendation. All prices in large, bold type as the visual centrepiece. | This is the most important single element in the report. It must be immediately scannable, visually memorable, and unambiguous about which price is recommended. |
| Verdict Callout (Journey A) | Full-width banner in Section 16 with: verdict text in 24pt bold, current price vs recommended price side-by-side, annual revenue impact in large type with upward arrow. Background: verdict-appropriate colour (red/amber/green/blue). | The audit verdict is the single most impactful moment in the Journey A report. It must deliver an immediate, visceral response that motivates action. |

## **9.5  Report Variants by Journey Type**

While the two journey reports share the same document structure, they differ in content emphasis, tone, language, and specific sections as summarised below:

| Dimension | Journey A — Pricing Audit Report | Journey B — Pricing Strategy Report |
| ----- | ----- | ----- |
| Report Badge Colour | Gold badge: 'PRICING AUDIT' | Teal badge: 'PRICING STRATEGY' |
| Centrepiece Section | Section 16: The Audit Verdict — how does the current price compare to what it should be? | Section 16: The Launch Recommendation — what is the right price to enter the market with? |
| Revenue Analysis | Current revenue vs projected revenue at recommended price. Cumulative revenue gain over 12 months from acting on the recommendation. | Projected revenue at each of three launch prices across pessimistic/realistic/optimistic scenarios. |
| Key Charts | Cost structure now vs when price was set (change chart), Market position of current price vs recommended price, Revenue impact of adjustment | Cost construction from scratch, Market entry position chart showing three recommended tiers within the market range, 12-month revenue projection at each tier |
| Implementation Section | Re-pricing plan: immediate steps, customer communication, phase-in vs immediate change, 30/60/90-day review checkpoints | Launch pricing plan: sequence, intro offer strategy, 30/60/90-day monitoring KPIs, specific triggers for price revision |
| Tone of Analyst Voice | Auditor: objective, evidence-based, occasionally challenging. 'The data suggests your current pricing is X. Here is why.' | Launch strategist: advisory, confidence-building, forward-looking. 'Here is how to enter this market with a price you can defend and adjust.' |

| SECTION 10 — MONETISATION: THE PREMIUM REPORT AS A PAID PRODUCT  \[NEW IN V2.0\] |
| :---: |

| Core Monetisation Principle The in-app experience — the mind map, the questionnaire, the AI analysis, the three-tier price display — is free. The value is established before any money is asked for. The Premium Report is the premium tier: a paid, downloadable, investor-grade PDF that converts the session's insights into an official business document. Users pay for the document because they have already experienced the intelligence behind it. |
| :---- |

## **10.1  Freemium Flow Architecture**

The free-to-paid conversion moment must be positioned at peak value — after the user has completed the full session and seen their three-tier price recommendation in the app, but before they can access the premium report format.

| Step | Experience | Detail |
| :---: | ----- | ----- |
| **1** | Free: One Complete Session | User completes all questionnaire stages at no cost. The mind map, question flow, data enrichment, and AI analysis are entirely free. No credit card required at any point in this phase. |
| **2** | Free: In-App Results | User sees the three-tier price recommendation in the app interface — Survival, Growth, and Maximum Profit prices with the brief analyst summary card. This is the proof of value. The user now understands PricePoint has produced real insight. |
| **3** | Paywall: Premium Report Upsell | After the in-app results are shown, a premium report preview is displayed — a blurred or watermarked first page of the PDF with visible but unreadable content below. A clear CTA: 'Download your complete Pricing Intelligence Report — formatted for investors and stakeholders.' Price displayed. Single-click purchase. |
| **4** | Purchase: Stripe Checkout | One-time payment. Stripe embedded checkout. Options: (a) One-time report download, (b) Report \+ 30-day re-generation rights (re-run the analysis with updated inputs and download a revised report). User email captured for delivery. |
| **5** | Report Generation & Delivery | Report generated within 60 seconds of payment confirmation. Delivered as: (a) Immediate browser download, (b) Email link (backup), (c) Saved to user account under 'My Reports' if registered. Unique Document ID assigned. Report stored for 12 months. |
| **6** | Post-Purchase: Verification Link | User receives a report verification URL (a PricePoint-hosted page) they can share with investors or partners to confirm the report is genuine, unmodified, and generated by PricePoint's intelligence engine. This verification feature is a key value proposition for the investor-use case. |

## **10.2  Pricing Tiers for the Premium Report**

| Feature | Basic Report | Professional Report | Investor Pack |
| ----- | :---: | :---: | :---: |
| **Suggested Price** | $99 – $299 | $499 – $799 | $899 – $1,999 |
| Full PDF Report (all 7 parts) | Yes | Yes | Yes |
| User's company logo on cover | No | Yes | Yes |
| Report verification page \+ URL | Yes | Yes | Yes |
| Report re-generation rights (30 days) | No | No | Yes — 2 re-generations |
| DOCX editable version | No | Yes | Yes |
| Total Page | 5 | 10 | 20-30 |
| Priority AI re-analysis support | No | No | Yes — 1 session |
| **Best For** | Individual founders wanting a personal pricing reference | Founders sharing pricing decisions with co-founders and teams | Founders in fundraising, pitching to investors, or seeking retail distribution |

## 

## 

## **10.3  Future Monetisation Expansions (Roadmap)**

* Subscription Model: Monthly/annual subscription for unlimited sessions \+ unlimited reports at a flat monthly fee — positioned for agencies, consultants, and power users who price multiple products.

* Agency White-Label: Agencies and consultants can generate reports under their own branding (replacing 'PricePoint' branding with their own). Premium B2B pricing.

* API Access: Developers and platforms can integrate the PricePoint pricing engine via API, paying per call or per report generated programmatically.

* Report Bundles: Pre-paid bundles of 5 or 10 reports at a discounted rate — for entrepreneurs launching multiple products or needing periodic pricing reviews.

* Investor/VC Package: Institutional tier where VC firms or accelerators purchase bulk report credits for portfolio companies.

| SECTION 11 — UX & MIND MAP DESIGN SPECIFICATIONS |
| :---: |

## **11.1  Updated Mind Map Flow with Journey Classification**

The journey classification is the first and most prominent node in the mind map. The design must communicate that there are two distinct paths before the user selects one.

* Root Node: Displayed as a large central node labelled 'PricePoint' with a pulsing animation indicating it is the starting point.

* Journey Split Visual: Two large visible branch nodes extend from the root immediately — 'I already sell this' (Journey A, blue) and 'I am launching new' (Journey B, teal). Both are visible but inactive until the root question is answered. This makes the journey architecture transparent.

* On Selection: The selected journey branch illuminates and expands. The unselected branch dims and collapses. All subsequent nodes grow from the selected branch.

* Journey Badge: A persistent badge in the top-left of the mind map canvas shows which journey the user is on throughout the session ('AUDIT MODE' or 'STRATEGY MODE'). This prevents confusion during long sessions.

* Stage Nodes: Six stage nodes branch from the journey node: Product Classification, Product Deep Dive (type-specific), Market Intelligence, Business Goals, Distribution & Legal, Psychological Pricing.

* Smart Prompts: For Journey A users, key question nodes display a 'vs when you set your price' comparison prompt. For Journey B users, uncertain fields display 'Use industry benchmark' buttons prominently.

* Premium Report Preview: After all nodes are completed, a final node labelled 'Your Pricing Report' appears with a shimmer animation. Clicking it reveals the in-app results and the premium report upsell.

## **11.2  Key UX Requirements**

* Progressive disclosure: Never show the next stage until the current one is complete. The mind map must feel like it is growing in response to the user's inputs.

* Auto-save: Session state saved every 30 seconds. Recoverable from any device via session link.

* Smart validation: Every numeric input validated against reasonable ranges. Out-of-range inputs trigger a gentle prompt: 'This is higher/lower than typical for \[category\]. Are you sure?'

* Inline help: Every question node has an expandable info icon explaining why PricePoint is asking this question and how it affects the recommendation.

* Mobile: Mind map collapses to vertical card-by-card flow on mobile. Progress indicator (steps X of Y) replaces the visual map on small screens.

| SECTION 12 — DATA MODEL & STORAGE |
| :---: |

## **12.1  Session Data Schema**

Each session generates a structured JSON document. Key entities added in v2.0:

* journey\_type: 'established\_seller' | 'new\_launcher'

* journey\_a\_context: current\_price, time\_at\_price, original\_pricing\_method, monthly\_volume, satisfaction\_level, cost\_change\_since\_pricing, market\_change\_since\_pricing, customer\_price\_feedback, conversion\_rate, price\_test\_history, ltv\_estimate, own\_price\_elasticity\_estimate

* journey\_b\_context: prior\_sales\_history, product\_readiness, demand\_validation\_status, market\_research\_done, price\_in\_mind, pricing\_fear

* ai\_output (extended): journey\_type, audit\_verdict (A only), audit\_verdict\_label, current\_price\_vs\_recommended, annual\_revenue\_impact\_of\_change (A only), launch\_recommendation\_rationale (B only), monitoring\_plan, survival\_price, growth\_price, premium\_price, cost\_breakdown\_table, market\_data\_summary, risk\_flags, confidence\_score

* report (new entity): report\_id, document\_id, tier, purchase\_timestamp, generation\_timestamp, download\_url, verification\_url, expiry, user\_logo\_url, re\_generation\_count

## **12.2  Data Retention & Privacy**

* Session data retained for 12 months for registered users. Unregistered: 7 days via session link.

* Premium Reports stored for 12 months after purchase. User can download again within this window.

* GDPR/CCPA: Full data export and deletion available. AI provider data processed under DPA with no training use.

* Report verification data (Document ID, session hash, generation metadata) retained indefinitely for verification purposes only. Contains no personal or financial data.

| SECTION 13 — NON-FUNCTIONAL REQUIREMENTS |
| :---: |

| Category | Requirement | Specification |
| ----- | ----- | ----- |
| Performance | Mind map render | Initial load \< 2.5s on 4G. Node expansion \< 300ms. |
| Performance | AI report generation | Complete in-app result within 15s. Premium PDF generated within 60s of purchase. |
| Performance | Premium PDF generation | PDF generation \< 45s including all charts. Progress indicator shown. Email backup within 5 minutes. |
| Reliability | Uptime | 99.5% uptime SLA. Scheduled maintenance off-peak with 48h notice. |
| Reliability | Report delivery | 100% of paid reports delivered (browser \+ email). If generation fails, auto-retry 3x then alert user with full refund option. |
| Security | Report access | Premium Report download links are signed, single-use, and expire after 12 months. Re-download requires re-authentication. |
| Security | Payment | Stripe handles all card data. PricePoint is PCI-DSS compliant by design (no card data touches PricePoint servers). |
| Scalability | Concurrent sessions | 10,000 concurrent sessions at launch; horizontally scalable to 100,000. |
| Localisation | Languages | V1: English. V2: Spanish, French. V3: German, Hindi, Portuguese, Arabic. |

| SECTION 14 — TECHNOLOGY STACK |
| :---: |

| Layer | Recommended Tech | Notes / Rationale |
| ----- | ----- | ----- |
| Frontend | React \+ TypeScript \+ Vite | React ecosystem maturity, TypeScript for safety at scale |
| Mind Map Engine | React Flow \+ custom SVG animations | React Flow provides node/edge primitives. Custom SVG for journey-split animations. |
| State Management | Zustand \+ React Query | Zustand for session state; React Query for server data and caching |
| Backend | Node.js \+ Fastify (or Next.js API routes) | Fastify for high-throughput API. Next.js for monorepo simplicity. |
| Database | PostgreSQL \+ Redis | Postgres for sessions/users/reports; Redis for caching enrichment data and rate-limiting AI calls |
| AI Engine | Anthropic Claude API (Sonnet 4.5) | Best-in-class analytical reasoning, JSON mode for structured outputs. Separate system prompts per journey type. |
| PDF Generation | Puppeteer (headless Chrome) \+ custom HTML/CSS template | Pixel-perfect PDF from a styled HTML template. Charts rendered as SVG, embedded inline. Preferred over pdfkit for design fidelity. |
| Chart Rendering | Recharts or Chart.js (server-side rendering via jsdom) | Server-side chart generation ensures PDF charts are consistent regardless of client environment. |
| Payment | Stripe (Payments \+ Billing) | Stripe Checkout for one-time purchases. Stripe Billing for future subscription tier. Stripe webhooks for report generation triggers. |
| Auth | Clerk or NextAuth.js | OAuth2 (Google, Apple). Session tokens. Report access tied to authenticated user account. |
| File Storage | AWS S3 or Cloudflare R2 | Generated PDFs and user logos stored with signed URL access. TTL-based expiry enforcement. |
| Report Verification | Cloudflare Workers KV (or Redis) | Stores document ID → session hash mappings for verification endpoint. Lightweight, globally fast, indefinite retention. |
| External APIs | SerpAPI / Brave (competitor research), ExchangeRate-API, TaxJar (US), Vatstack (EU), custom scrapers (platform fees) | All external data cached. Graceful degradation to static benchmarks on API failure. |
| Analytics | PostHog (self-hosted option) | Session replay critical for debugging mind map UX. GDPR-friendly. Funnel analysis for conversion optimisation. |

| SECTION 15 — PHASED ROADMAP |
| :---: |

| Phase | Timeline | Key Deliverables | Exit Criteria |
| ----- | :---: | ----- | ----- |
| **Phase 0: Foundation** | Wk 1–4 | Tech scaffolding, static mind map prototype, both journey paths in the question engine (no AI), basic cost calculator | Internal demo: both journeys flow end to end with working cost arithmetic |
| **Phase 1: MVP** | Wk 5–10 | Full question flow (all branches, both journeys), AI report generation (basic), static competitor benchmarks, three-tier price output, Journey A audit verdict, Journey B launch recommendation, Basic PDF report (no charts) | 10 beta users complete full session; ≥80% rate output useful |
| **Phase 2: Premium Report Launch** | Wk 11–18 | Full PDF with charts, user logo integration, document ID \+ verification URL, Stripe payment integration, report delivery (download \+ email), report storage and re-download, journey-specific report variants | First paid report generated. ≥20% report conversion rate from completed sessions. |
| **Phase 3: Intelligence** | Wk 19–26 | Live competitor price search, platform fee auto-population (40+ platforms), regional tax auto-suggestion, full risk warning system, DOCX export (Investor Pack), report re-generation feature | 65% session completion; 4.0/5 CSAT on Premium Report; competitor data accuracy ≥85% |
| **Phase 4: Scale** | Mo 7–12 | Subscription tier, agency white-label, API access, Spanish \+ French localisation, price monitoring alerts (Journey A: notify when competitor prices change materially), mobile-optimised mind map | Revenue targets met; agency partner programme launched; 500 MAU |

| SECTION 16 — RISK REGISTER |
| :---: |

| Risk | Likelihood | Impact | Mitigation |
| ----- | :---: | :---: | ----- |
| Journey misclassification: user selects wrong journey type | Low | High | Allow journey type change at any point before the final output screen, with a confirmation dialog explaining what will change. Clear question wording in plain language. |
| Premium Report does not feel worth the price | Medium | High | Show a blurred/watermarked preview before purchase. Show page count and section list. Display testimonials from users who've used the report with investors. Offer 100% satisfaction guarantee (re-generation or refund). |
| Competitor data API unreliable or rate-limited | Medium | High | Multi-source strategy with 24h cache fallback. Static benchmark fallback with transparency note. Never block report generation on missing competitor data. |
| Journey A users resist the audit verdict (underpriced by a lot) | High | Medium | Frame verdict as an opportunity, not a failure. Show revenue uplift potential prominently. Include a 'Why this happens and how to fix it' narrative before the recommendation. |
| PDF generation fails post-payment | Low | Critical | Auto-retry 3× then alert user. Email backup delivery within 5 minutes. Full refund offered automatically if delivery fails after 10 minutes. Session data preserved so re-generation is possible. |
| Tax rate data becomes outdated | High | Medium | Monthly automated sync. Prominent disclaimer that tax data is indicative only and requires professional verification. Legal disclaimer in report Appendix D. |
| AI produces confident but wrong recommendation for niche product | Medium | High | AI confidence score shown in report. Low-confidence outputs add advisory language. Methodology appendix in report shows all data sources. User can always override recommendations in the app. |
| Report used for misleading investors (user falsifies cost inputs) | Low | High | Report states clearly that all financial inputs were user-provided and unverified. Scope-of-analysis section in report. Legal disclaimer Page D. PricePoint bears no liability for fraudulent misrepresentation. |

| SECTION 17 — OPEN QUESTIONS & ASSUMPTIONS |
| :---: |

## **17.1  Open Questions**

| \# | Open Question | Options / Decision Needed |
| :---: | ----- | ----- |
| **OQ1** | Can a user change their journey type mid-session? | Option A: Yes, with full confirmation dialog and restart from the journey gate. Option B: No — session is journey-locked, new session required. Recommendation: Option A with warning about data loss. |
| **OQ2** | Should Journey A users be able to see the Journey B reconstruction as a comparison?', i.e. 'What would we charge if we were setting this price from scratch today?' | This is a powerful feature but significantly adds to report complexity and generation time. Recommended for Phase 3 as an optional 'What if I repriced from scratch?' module. |
| **OQ3** | What is the primary monetisation model at launch — per-report or subscription? | Option A: Per-report (lower barrier, captures value at peak moment). Option B: Subscription (better LTV, but higher barrier to first purchase). Recommendation: Per-report at launch, subscription available in Phase 3\. |
| **OQ4** | Should the Premium Report include a 'share with investor' button that delivers a read-only version directly from PricePoint's servers? | High value for investor use case. Requires building a report-sharing/hosting infrastructure. Recommended for Phase 2 alongside the verification URL feature. |
| **OQ5** | How should PricePoint handle legal liability for the Premium Report being presented to investors? | Requires legal review. The report must clearly state it is analytical/decision-support only, not financial advice. User accepts terms before purchase. Appendix D disclaimer drafted by qualified legal counsel. |

## **17.2  Key Assumptions**

* The primary conversion mechanism is the free-to-paid gate at the output screen. Users who complete a session are highly motivated buyers.

* Journey A (Established Seller) will represent approximately 60% of users at launch, as established sellers have more acute pricing pain and clearer ROI from the Premium Report.

* The investor credibility of the Premium Report is sufficient to justify a $24–$49 price point for the Professional and Investor Pack tiers.

* The verification URL feature (report authenticity confirmation) will become a meaningful differentiator in the investor/fundraising use case and should be developed in Phase 2\.

* Users will provide honest cost inputs. The system validates against benchmarks but cannot and does not guarantee accuracy. The report's legal disclaimer makes this clear.

* The LLM selected for the AI engine will reliably produce structured, accurate pricing analysis at the session volumes projected. Prompt engineering investment is required to ensure consistent output quality across all product types and journey types.

*End of PricePoint Product Requirements Document v2.0*

*This document supersedes v1.0 and incorporates the User Journey Classification System and Premium Report Specification.*

**Confidential — Internal Use Only — Do Not Distribute**