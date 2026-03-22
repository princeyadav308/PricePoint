# PricePoint MindMap: User Journeys & Question Flow

This document details the complete flow of questions across the PricePoint MindMap, branching intelligently based on user journey (Established vs. New Launcher) and product category (Physical, Service, Digital).

## 1. Journey Entry Points

The user is funneled into one of two distinct starting paths based on whether they are already selling the product.

### Journey A: Established Seller (Audit Mode)
**Objective**: Baseline current pricing performance and identify revenue leakage.

1. **Pricing Audit Context**
   - Is this product currently live and selling? (MCQ)
   - How long have you been selling at this price? (MCQ)
   - How did you originally set this price? (MCQ)
   - Approximate monthly sales volume? (Number)
   - Have your costs changed since you last set this price? (MCQ)
   - Has the competitive landscape changed since you set your price? (MCQ)
2. **Audit Baseline Verification**
   - What is your current active price for this product/service? (Number)
   - What is your current sentiment regarding this price? (MCQ)

*(Joins the main flow at “Product Classification”)*

### Journey B: New Launcher (Strategy Mode)
**Objective**: Build a robust, data-backed go-to-market pricing strategy from scratch.

1. **Launch Strategy Context**
   - Has this product ever been sold at any price? (MCQ)
   - How far along is the product? (MCQ)
   - Have you validated demand for this product? (MCQ)
   - Have you researched what similar products sell for? (MCQ)
   - Do you have a price in mind already? (MCQ)
   - What is your primary pricing fear? (MCQ)

*(Joins the main flow at “Product Classification”)*

---

## 2. Common Flow: Classification & Description

Once past the entry routing, all users answer base classification questions.

3. **Product Classification**
   - What type of product are you pricing? (Physical Product, Service, Digital Product)
   - Product Name (Text)
   - Where is your business based? (Country Select)
   - Currency (Currency Select)
4. **Describe Your Product**
   - Tell us about your product in detail. What problem does it solve? Who is it for? What makes it unique? (Text area)

---

## 3. Product-Type Deep Dives & Unit Economics

The questionnaire dynamically branches based on the **Product Type** selected in step 3.

### Path 1: Physical Product
**Physical Product Details**
   - Product Category (Select)
   - How do you produce or source this product? (MCQ)
   - Average time to produce ONE unit (hours) (Number)
   - Where do you sell or plan to sell? (Multi-select)
   - Expected return/refund rate (Slider)
**Unit Economics - Physical Product**
   - Cost to produce/deliver ONE unit (Table Breakdown: Raw Materials, Labor, Packaging, Shipping, Storage, etc.)

### Path 2: Service
**Service Details**
   - Service Category (Select)
   - Preferred billing model(s) (Multi-select)
   - Desired annual income from this service (Number)
   - Genuinely billable hours per week (Slider)
   - Years of verifiable experience (Slider)
**Unit Economics - Service**
   - Monthly operating cost breakdown (Table Breakdown: Software, Workspace, Equipment, Insurance, Marketing, etc.)

### Path 3: Digital Product
**Digital Product Details**
   - Digital product format (SaaS, E-book, App, etc.) (Select)
   - Preferred sales model (One-time, Subscription, etc.) (MCQ)
   - Total development cost to build the product (Number)
   - Distribution platforms (Multi-select)
   - Monthly churn rate (Slider)
**Unit Economics - Digital Product**
   - Monthly recurring costs breakdown (Table Breakdown: Hosting, CDN, APIs, Support, Security, Amortized Dev, etc.)

---

## 4. Multi-Branch Analysis (Simultaneous Insights)

After defining Unit Economics, the questions gather the variables that actually shape the price via three conceptual pillars. The nodes run simultaneously or sequentially depending on the UI flow.

### A. Market Research
- Number of Direct Competitors (Slider)
- Market Saturation Level (MCQ)
- Lowest competitor price you've found (Number)
- Highest competitor price you've found (Number)
- Who is your target customer? (Multi-select)
- How price-sensitive is your target customer? (MCQ)

### B. Product Value
- Most important features of your product (Multi-select)
- "Magic Moment" — What makes your product irreplaceable? (Text)
- Unique Selling Proposition Strength (Slider)
- Customer Retention / Repeat Purchase Rate (Slider)
- Brand Recognition Level (MCQ)
- How much premium would customers pay over competitors? (Slider)

### C. Financials
- Desired Profit Margin (Slider)
- Effective Tax Rate (Slider)
- Expected monthly sales volume (Number)
- Monthly revenue target (Number)
- What pricing strategy resonates with you? (Penetration, Value-based, Premium, etc.) (MCQ)
- When do you need to break even? (MCQ)
- What is the current demand status for this product? (MCQ)
- Estimated percentage of sales via discounts/promotions (Slider)
- What is your primary goal for this product right now? (Survival, Growth, Profit, Prestige) (MCQ)

---

## 5. Psychological & Distribution Constraints

After the three pillars above, the assessment narrows into presentation and external factors.

6. **Distribution & Legal**
   - Does your price need to be inclusive or exclusive of local sales tax (VAT/GST)? (MCQ)
   - Will you absorb cross-border fees and international taxes? (MCQ)
   - Required Wholesale / Reseller Margin (Slider)
   - What is your typical payment collection cycle? (MCQ)
   
7. **Psychological Pricing**
   - Preferred Pricing Presentation Style (Charm, Prestige, Exact) (MCQ)
   - Planned Tiering Strategy (Single, Good/Better/Best, Baser+Modular) (MCQ)
   - Are there any hard market constraints or price ceilings? (MCQ)

---

## 6. Convergence: Van Westendorp Price Sensitivity Meter

All paths converge here for the final four questions to algorithmically pinpoint the optimal price point and acceptable range.

8. **Price Sensitivity**
   - **Too Cheap**: At what price would you question this product's quality? (Slider)
   - **Bargain**: At what price is this product a great bargain? (Slider)
   - **Getting Expensive**: At what price does this product start getting expensive? (Slider)
   - **Too Expensive**: At what price is this product too expensive to consider? (Slider)
   
*(Data mapped, Price generated, and Insights delivered)*
