import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import dotenv from 'dotenv';
import { generatePricingReport } from './utils/claude';
import { validateReport } from './utils/reportValidator';
import puppeteer from 'puppeteer';
import { generateHTMLTemplate } from './utils/pdfTemplate';
import { integrateFastifyLogger, logger } from './utils/logger';
import crypto from 'crypto';

// Import New Phase 4 routes
import reportRoutes from './routes/reports';
import webhookRoutes from './routes/webhooks';
import intelligenceRoutes from './routes/intelligence';
import userRoutes from './routes/user';
import draftRoutes from './routes/drafts';

import { supabase } from './lib/supabase';
import { prisma } from './lib/db';
import * as reportVersion from './lib/reportVersion';
import { GenerationStatus } from '@prisma/client';
import { ensureBucket, uploadPdf, getSignedPdfUrl } from './lib/storage';

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
server.register(draftRoutes);

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

        const { documentId, sessionData, pricingResult, appliedModifiers, tier, intelligenceData } = request.body as any;

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

        // If documentId provided, persist claudeData + schema version to Report
        if (documentId) {
            await prisma.report.update({
                where: { documentId },
                data: {
                    claudeData: validatedReport,
                    templateVersion: reportVersion.CURRENT_TEMPLATE_VERSION,
                    generationStatus: GenerationStatus.complete,
                }
            });

            server.log.info({
                documentId,
                tier,
                journeyType,
                templateVersion: reportVersion.CURRENT_TEMPLATE_VERSION,
            }, 'Persisted Claude narrative to Report');
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

        const { documentId, claudeData, pricingResult, sessionData, tier, validationReport } = request.body as any;

        // Validate required data
        if (!claudeData || !sessionData) {
            return reply.status(400).send({ error: 'Missing required data: claudeData or sessionData' });
        }

        // If documentId provided, attempt atomic lock to prevent concurrent generation
        if (documentId) {
            // Check current status first
            const existingReport = await prisma.report.findUnique({
                where: { documentId },
                select: { generationStatus: true, templateVersion: true }
            });

            if (!existingReport) {
                return reply.status(404).send({ error: 'Report not found' });
            }

            // Atomic lock: try to claim "generating" status
            // Only succeeds if status is NOT already 'generating'
            // (The 5-min stale safety valve requires an updatedAt field — add to schema if needed in future)
            const lockResult = await prisma.report.updateMany({
                where: {
                    documentId,
                    generationStatus: { not: GenerationStatus.generating }
                },
                data: { generationStatus: GenerationStatus.generating }
            });

            if (lockResult.count === 0) {
                // Another process is generating this PDF
                server.log.warn({ documentId }, 'PDF generation already in progress for document');
                return reply.status(409).send({ error: 'Report is being generated' });
            }

            server.log.info({ documentId }, 'Acquired PDF generation lock');
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

        // If documentId provided, attempt to upload to Supabase Storage
        if (documentId) {
            try {
                // Ensure bucket exists
                await ensureBucket();

                // Upload PDF
                const verificationHash = crypto.randomBytes(16).toString('hex');
                const storagePath = await uploadPdf(documentId, verificationHash, pdf);

                // Update report with storage path, template version, and status
                await prisma.report.update({
                    where: { documentId },
                    data: {
                        pdfUrl: storagePath,
                        templateVersion: reportVersion.CURRENT_TEMPLATE_VERSION,
                        generationStatus: GenerationStatus.complete,
                        verificationHash,
                    }
                });

                server.log.info({ documentId, storagePath }, 'PDF uploaded to storage and report updated');
            } catch (storageError) {
                // Storage upload failed — serve PDF directly and mark as failed
                server.log.error({ documentId, err: storageError }, 'PDF storage upload failed, serving directly');
                await prisma.report.update({
                    where: { documentId },
                    data: { generationStatus: GenerationStatus.failed }
                }).catch(() => {}); // Don't throw on status update failure
            }
        }

        // Return PDF as binary response
        reply.type('application/pdf');
        reply.header('Content-Disposition', `attachment; filename="${sessionData?.answers?.projectName?.value || 'PricePoint'} Price Report.pdf"`);
        return reply.send(pdf);

    } catch (error) {
        server.log.error(error);

        // If documentId was provided, mark generation as failed
        const { documentId } = request.body as any;
        if (documentId) {
            await prisma.report.update({
                where: { documentId },
                data: { generationStatus: GenerationStatus.failed }
            }).catch(() => {});
        }

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
