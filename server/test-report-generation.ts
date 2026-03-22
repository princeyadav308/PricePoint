/**
 * test-report-generation.ts
 * 
 * End-to-end test for the PricePoint report generation pipeline.
 * Uses real-shaped MindMap mock data with currency strings and __NA__ markers.
 * 
 * Usage: npx tsx test-report-generation.ts
 */

import 'dotenv/config';

const SERVER_URL = 'http://127.0.0.1:3000';

// ── Mock data shaped exactly like real MindMap answers ──────────
const mockSessionData = {
    journeyType: 'new_launcher',
    currency: 'INR (₹)',
    answers: {
        product_name: { value: 'CloudSync Pro' },
        product_description: { value: 'AI-powered cloud backup and sync tool for small businesses' },
        industry: { value: 'Technology / SaaS' },
        country: { value: 'India' },
        currency: { value: 'INR (₹)' },
        target_audience: { value: 'Small and medium businesses with 10-100 employees' },
        business_model: { value: 'Subscription (Monthly)' },
        product_type: { value: 'Digital / SaaS' },

        // Van Westendorp pricing psychology
        bargain: { value: '299' },
        good_value: { value: '799' },
        getting_expensive: { value: '1499' },
        too_expensive: { value: '2999' },

        // Competitor pricing
        competitor_price_low: { value: '₹199' },
        competitor_price_mid: { value: '₹699' },
        competitor_price_high: { value: '₹1999' },
        competitor_names: { value: 'Dropbox Business, Google Workspace, Zoho WorkDrive' },
        competitor_count: { value: '3' },

        // Unit economics — raw JSON arrays with currency strings
        ue_physical: { value: '__NA__' },
        ue_service: { value: JSON.stringify([
            { key: 'Cloud Hosting', value: '₹120' },
            { key: 'API Costs', value: '₹45' },
            { key: 'Support Staff', value: '₹80' }
        ])},
        ue_digital: { value: JSON.stringify([
            { key: 'Storage per user', value: '₹30' },
            { key: 'CDN bandwidth', value: '₹15' }
        ])},
        desired_margin: { value: '65' },
        expected_volume: { value: '500' },

        // Market position
        unique_selling_point: { value: 'AI-powered deduplication reduces storage costs by 40%' },
        differentiation_level: { value: 'High' },
        brand_strength: { value: 'Moderate' },

        // __NA__ markers to test sanitisation
        current_price: { value: 'NA' },
        launch_timeline: { value: 'Q2 2026' },
        revenue_target: { value: 'N/A' },
    }
};

const mockPricingResult = {
    budget: 499,
    recommended: 799,
    premium: 1499,
    analysis: {
        costPlusBase: 362,
        valueMultiplier: 2.2,
        totalUnitCost: 290,
        vanWestendorp: {
            pmc: 299,
            opp: 649,
            ipp: 899,
            pme: 1499,
            floor: 299,
            ceiling: 1499
        }
    },
    appliedModifiers: ['MARKET_GRAVITY_APPLIED', 'COMPETITOR_ANCHOR']
};

import { generatePricingReport } from './src/utils/claude';

// ... (keep mock session data)

async function testReportGeneration() {
    console.log('═══════════════════════════════════════');
    console.log('PricePoint Report Generation Test (Direct)');
    console.log('═══════════════════════════════════════');
    
    try {
        console.log('[1/3] Generating report directly via Claude 4.5 Sonnet API ...');
        const startTime = Date.now();
        
        const data = await generatePricingReport(
            mockSessionData,
            mockPricingResult,
            mockPricingResult.appliedModifiers,
            'Professional',
            'new_launcher',
            null
        );

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[2/3] Generation completed in ${elapsed}s`);

        console.log('[3/3] Validating response structure ...');
        console.log('');
        
        const cd = data;
        if (!cd) {
            console.error('❌ FAIL: claudeData is missing from response');
            process.exit(1);
        }

        // Validate core fields exist
        const checks: [string, any][] = [
            ['report_meta', cd.report_meta],
            ['executive_summary', cd.executive_summary],
            ['executive_summary.headline', cd.executive_summary?.headline],
            ['executive_summary.summary', cd.executive_summary?.summary],
            ['executive_summary.pricing_verdict', cd.executive_summary?.pricing_verdict],
            ['market_analysis', cd.market_analysis],
            ['unit_economics', cd.unit_economics],
            ['pricing_strategy', cd.pricing_strategy],
            ['competitive_positioning', cd.competitive_positioning],
            ['risk_matrix', cd.risk_matrix],
            ['implementation_roadmap', cd.implementation_roadmap],
            ['next_steps', cd.next_steps],
        ];

        let passed = 0;
        let failed = 0;
        for (const [name, value] of checks) {
            if (value !== undefined && value !== null) {
                console.log(`  ✅ ${name}`);
                passed++;
            } else {
                console.log(`  ❌ ${name} — MISSING`);
                failed++;
            }
        }

        // Check for hardcoded $ symbols (should use ₹)
        const jsonStr = JSON.stringify(cd);
        const dollarMatches = (jsonStr.match(/\$\d/g) || []).length;
        if (dollarMatches > 0) {
            console.log(`  ⚠️  Found ${dollarMatches} hardcoded $ symbols in response (expected ₹)`);
        } else {
            console.log(`  ✅ No hardcoded $ symbols — currency handling correct`);
        }

        // Check for __NA__ leaks
        if (jsonStr.includes('__NA__')) {
            console.log(`  ❌ Found __NA__ markers in response — sanitisation failed`);
            failed++;
        } else {
            console.log(`  ✅ No __NA__ markers — sanitisation working`);
            passed++;
        }

        console.log('');
        console.log('═══════════════════════════════════════');
        console.log(`Results: ${passed} passed, ${failed} failed`);
        console.log('═══════════════════════════════════════');

        if (failed > 0) {
            console.log('');
            console.log('Full Claude response (for debugging):');
            console.log(JSON.stringify(cd, null, 2).substring(0, 2000) + '\n...(truncated)');
        }

    } catch (err) {
        console.error('❌ Network error:', err);
        process.exit(1);
    }
}

testReportGeneration();
