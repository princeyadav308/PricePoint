import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { generatePricingReport } from './utils/claude';
import { validateReport } from './utils/reportValidator';
import puppeteer from 'puppeteer';
import { generateHTMLTemplate } from './utils/pdfTemplate';
import { integrateFastifyLogger, logger } from './utils/logger';

// Import New Phase 4 routes
import reportRoutes from './routes/reports';
import webhookRoutes from './routes/webhooks';
import intelligenceRoutes from './routes/intelligence';
import userRoutes from './routes/user';

import { supabase } from './lib/supabase';

// Load environment variables
dotenv.config();

const server: FastifyInstance = Fastify({
    logger: true,
});

// Integrate Fastify's Pino logger with our structured logger
integrateFastifyLogger(server.log);

server.register(cors, {
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
});

// Register domain routes
server.register(reportRoutes);
server.register(webhookRoutes);
server.register(intelligenceRoutes);
server.register(userRoutes);

// Root Route
server.get('/', async (request, reply) => {
    return { hello: 'world', system: 'PricePoint v3.0 API', env: process.env.NODE_ENV || 'development' };
});

// ── Stripe Checkout Endpoint ───────────────────────────────────────
// ── (Old Stripe Checkout Removed - see routes/reports.ts for Dodo Checkout) ──

// ── Claude Generation Endpoint ───────────────────────────────────
server.post('/api/generate-report', async (request, reply) => {
    try {
        // Authenticate request (bypass in non-production)
        const authHeader = request.headers.authorization;
        if (process.env.NODE_ENV === 'production') {
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
            }
            const token = authHeader.split(' ')[1];
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (authError || !user) {
                return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
            }
        }

        const { sessionData, pricingResult, appliedModifiers, tier, intelligenceData } = request.body as any;

        // Secure Endpoint: Ensure core data exists
        if (!sessionData || !pricingResult) {
            return reply.status(400).send({ error: 'Missing sessionData or pricingResult' });
        }

        // Extract journeyType from session data
        const journeyType = sessionData.journeyType || 'new_launcher';

        // Call our Claude API Wrapper with FULL session data + intelligence enrichment
        const claudeReport = await generatePricingReport(
            sessionData,          // full Q&A dataset
            pricingResult,        // algorithm output
            appliedModifiers,     // MARKET_GRAVITY_APPLIED, etc.
            tier,                 // Basic/Professional/Investor
            journeyType,          // established_seller / new_launcher
            intelligenceData      // auto-intelligence data (optional)
        );

        // ── Deterministic validation — the actual gate ──
        // Prompt rules reduce hallucination frequency; this validator IS the control.
        const { validatedReport, validationReport } = validateReport(
            claudeReport, pricingResult, sessionData, intelligenceData
        );

        // Log all corrections and stripped sections for observability
        if (validationReport.corrections.length > 0) {
            server.log.warn(`[Validator] ${validationReport.corrections.length} corrections applied to Claude output`);
            validationReport.corrections.forEach(c =>
                server.log.warn(`  → CORRECTED ${c.field}: ${c.reason}`)
            );
        }
        if (validationReport.strippedSections.length > 0) {
            server.log.warn(`[Validator] ${validationReport.strippedSections.length} sections stripped from Claude output`);
            validationReport.strippedSections.forEach(s =>
                server.log.warn(`  → STRIPPED ${s.section}: ${s.reason}`)
            );
        }

        // Return validated report — not raw Claude output
        return {
            success: true,
            claudeData: validatedReport,
            validationReport,
        };

    } catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate report' });
    }
});

// ── Puppeteer PDF Generation Endpoint ───────────────────────────────────
server.post('/api/generate-pdf', async (request, reply) => {
    let browser = null;
    let page = null;
    try {
        // Authenticate request (bypass in non-production)
        const authHeader = request.headers.authorization;
        if (process.env.NODE_ENV === 'production') {
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
            }
            const token = authHeader.split(' ')[1];
            const { data: { user }, error: authError } = await supabase.auth.getUser(token);
            if (authError || !user) {
                return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
            }
        }

        const { claudeData, pricingResult, sessionData, tier, validationReport } = request.body as any;

        // Validate required data
        if (!claudeData || !sessionData) {
            return reply.status(400).send({ error: 'Missing required data: claudeData or sessionData' });
        }

        // Generate HTML from template — pass validation metadata for provenance dots
        const htmlContent = generateHTMLTemplate({
            claudeData,
            pricingResult,
            sessionData,
            tier: tier || 'Basic',
            validationReport: validationReport || null
        });

        // Launch Puppeteer
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();

        // Set content and wait for fonts to load
        await page.setContent(htmlContent, {
            waitUntil: 'networkidle0'
        });

        // Generate PDF with footer and margins
        const pdf = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '0', bottom: '25mm', left: '0' },
            displayHeaderFooter: true,
            headerTemplate: '<span></span>',
            footerTemplate: `
                <div style="width: 100%; padding: 0 48px; font-family: 'Source Sans 3', 'Inter', sans-serif; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #D1D5DB; padding-top: 8px; font-size: 9px; color: #6B7280;">
                    <span>PricePoint Intelligence Report</span>
                    <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
                </div>
            `,
        });

        // Return PDF as binary response
        reply.type('application/pdf');
        reply.header('Content-Disposition', `attachment; filename="PricePoint_Report_${sessionData?.answers?.projectName?.value || 'Document'}.pdf"`);
        return reply.send(pdf);

    } catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate PDF' });
    } finally {
        // Always clean up page and browser resources
        if (page) {
            try { await page.close(); } catch { /* ignore close errors */ }
        }
        if (browser) {
            try { await browser.close(); } catch { /* ignore close errors */ }
        }
    }
});
const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        await server.listen({ port, host: '0.0.0.0' });
        server.log.info(`Server running on http://127.0.0.1:${port}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
