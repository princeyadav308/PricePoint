import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { generatePricingReport } from './utils/claude';
import { validateReport } from './utils/reportValidator';
import puppeteer from 'puppeteer';
import { generateHTMLTemplate } from './utils/pdfTemplate';
import { v4 as uuidv4 } from 'uuid';
import { initLogger, getLogger, createRequestLogger, type ILogger, type StructuredLog } from './utils/logging';
import { randomUUID } from 'crypto';

// Import New Phase 4 routes
import reportRoutes from './routes/reports';
import webhookRoutes from './routes/webhooks';
import intelligenceRoutes from './routes/intelligence';
import userRoutes from './routes/user';

import { prisma } from './lib/db';
import { supabase } from './lib/supabase';

// Load environment variables
dotenv.config();

// Initialize logger
initLogger();
const logger = getLogger();

// Extend FastifyRequest with requestId and sessionId
declare module 'fastify' {
    interface FastifyRequest {
        id: string;
        requestId: string;
        sessionId?: string;
    }
}

const server: FastifyInstance = Fastify({
    logger: false, // We use our custom logger for more control
    genReqId: (req) => uuidv4(),
});

server.register(cors, {
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
});

// ── Request Correlation Middleware ───────────────────────────────────
server.addHook('onRequest', (request, _reply, done) => {
    request.requestId = (request.headers['x-request-id'] as string) || randomUUID();
    request.sessionId = (request.headers['x-session-id'] as string) || request.query?.sessionId as string;
    done();
});

// ── Request Logging (Start/End with Duration) ───────────────────────
server.addHook('preHandler', (request, reply, done) => {
    request.startTime = Date.now();
    (request as any).reply = reply;
    done();
});

server.addHook('onResponse', (request, reply, done) => {
    const durationMs = Date.now() - ((request as any).startTime || Date.now());
    const route = request.routerMethod + ' ' + request.url;

    const logContext: StructuredLog = {
        event: 'request.end',
        requestId: request.requestId,
        sessionId: request.sessionId,
        route,
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        durationMs
    };

    if (reply.statusCode >= 400) {
        logger.error(logContext);
    } else if (reply.statusCode >= 300) {
        logger.warn(logContext);
    } else {
        logger.info(logContext);
    }
    done();
});

// Register domain routes
server.register(reportRoutes);
server.register(webhookRoutes);
server.register(intelligenceRoutes);
server.register(userRoutes);

// Root Route
server.get('/', async (request, reply) => {
    const reqLogger = createRequestLogger(request.id, request.sessionId, 'GET /');
    reqLogger.info({
        event: 'health_check',
        requestId: request.id,
        sessionId: request.sessionId
    } as StructuredLog);

    return {
        hello: 'world',
        system: 'PricePoint v3.0 API',
        env: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString()
    };
});

// ── Claude Generation Endpoint ───────────────────────────────────
server.post('/api/generate-report', async (request, reply) => {
    const reqLogger = createRequestLogger(request.id, request.sessionId, 'POST /api/generate-report');

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
            reqLogger.warn({
                event: 'validation.error',
                requestId: request.id,
                sessionId: request.sessionId,
                errorType: 'BadRequest',
                message: 'Missing sessionData or pricingResult'
            } as StructuredLog);
            return reply.status(400).send({ error: 'Missing sessionData or pricingResult' });
        }

        // Log generation start
        reqLogger.info({
            event: 'report.generation.start',
            requestId: request.id,
            sessionId: request.sessionId,
            tier: tier || 'Basic',
            journeyType: sessionData.journeyType
        } as StructuredLog);

        // Call our Claude API Wrapper with FULL session data + intelligence enrichment
        const claudeReport = await generatePricingReport(
            sessionData,          // full Q&A dataset
            pricingResult,        // algorithm output
            appliedModifiers,     // MARKET_GRAVITY_APPLIED, etc.
            tier,                 // Basic/Professional/Investor
            sessionData.journeyType, // established_seller / new_launcher
            intelligenceData,     // auto-intelligence data (optional)
            request.id,           // requestId for correlation
            request.sessionId     // sessionId for correlation
        );

        // ── Deterministic validation ──
        // Prompt rules reduce hallucination frequency; this validator IS the control.
        const { validatedReport, validationReport } = validateReport(
            claudeReport, pricingResult, sessionData, intelligenceData
        );

        // Log validation results
        if (validationReport.corrections.length > 0) {
            reqLogger.warn({
                event: 'validator.corrections',
                requestId: request.id,
                sessionId: request.sessionId,
                correctionsCount: validationReport.corrections.length
            } as StructuredLog);
            validationReport.corrections.forEach(c =>
                reqLogger.warn({
                    event: 'validator.correction',
                    requestId: request.id,
                    sessionId: request.sessionId,
                    field: c.field,
                    original: c.original,
                    corrected: c.corrected,
                    reason: c.reason
                } as StructuredLog)
            );
        }
        if (validationReport.strippedSections.length > 0) {
            reqLogger.warn({
                event: 'validator.stripped',
                requestId: request.id,
                sessionId: request.sessionId,
                strippedCount: validationReport.strippedSections.length
            } as StructuredLog);
            validationReport.strippedSections.forEach(s =>
                reqLogger.warn({
                    event: 'validator.strip',
                    requestId: request.id,
                    sessionId: request.sessionId,
                    section: s.section,
                    reason: s.reason
                } as StructuredLog)
            );
        }

        // High severity check - this is a production incident if it reaches a paying customer
        if (validationReport.highSeverityCount > 0) {
            reqLogger.error({
                event: 'validator.high_severity',
                requestId: request.id,
                sessionId: request.sessionId,
                highSeverityCount: validationReport.highSeverityCount,
                message: 'High-severity validation issues detected'
            } as StructuredLog);
        }

        reqLogger.info({
            event: 'report.generation.success',
            requestId: request.id,
            sessionId: request.sessionId,
            tier: tier || 'Basic'
        } as StructuredLog);

        return {
            success: true,
            claudeData: validatedReport,
            validationReport,
        };

    } catch (error: any) {
        reqLogger.error({
            event: 'report.generation.error',
            requestId: request.id,
            sessionId: request.sessionId,
            errorType: error.type || error.constructor.name,
            errorMessage: error.message || 'Unknown error',
            stack: error.stack,
            tier: (request.body as any)?.tier
        } as StructuredLog);
        return reply.status(500).send({ error: 'Failed to generate report' });
    }
});

// ── Puppeteer PDF Generation Endpoint ───────────────────────────────────
server.post('/api/generate-pdf', async (request, reply) => {
    const reqLogger = createRequestLogger(request.id, request.sessionId, 'POST /api/generate-pdf');
    let browser: any = null;
    let page: any = null;
    let startTime = Date.now();

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
            reqLogger.warn({
                event: 'pdf.validation.error',
                requestId: request.id,
                sessionId: request.sessionId,
                errorType: 'BadRequest',
                message: 'Missing required data: claudeData or sessionData'
            } as StructuredLog);
            return reply.status(400).send({ error: 'Missing required data: claudeData or sessionData' });
        }

        // ── PDF Render Start ───────────────────────────────────────────────
        reqLogger.info({
            event: 'pdf.render.start',
            requestId: request.id,
            sessionId: request.sessionId,
            tier: tier || 'Basic',
            hasValidationReport: !!validationReport
        } as StructuredLog);

        // Generate HTML from template
        const htmlContent = generateHTMLTemplate({
            claudeData,
            pricingResult,
            sessionData,
            tier: tier || 'Basic',
            validationReport: validationReport || null
        });

        // ── Puppeteer Browser Launch ───────────────────────────────────────
        try {
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            reqLogger.debug({
                event: 'pdf.browser.launch.success',
                requestId: request.id,
                sessionId: request.sessionId
            } as StructuredLog);
        } catch (err: any) {
            reqLogger.error({
                event: 'pdf.browser.launch.failed',
                requestId: request.id,
                sessionId: request.sessionId,
                errorType: err.type || err.constructor.name,
                errorMessage: err.message
            } as StructuredLog);
            throw err;
        }

        // ── Page Creation ───────────────────────────────────────────────
        try {
            page = await browser.newPage();
            reqLogger.debug({
                event: 'pdf.page.create.success',
                requestId: request.id,
                sessionId: request.sessionId
            } as StructuredLog);

            // Forward browser console messages and page errors to our logger
            page.on('console', (msg: any) => {
                const type = msg.type();
                if (type === 'error' || type === 'warning') {
                    reqLogger.warn({
                        event: 'pdf.browser.console',
                        requestId: request.id,
                        sessionId: request.sessionId,
                        level: type,
                        message: msg.text(),
                        source: msg.location()?.url || 'unknown'
                    } as StructuredLog);
                }
            });

            page.on('pageerror', (err: any) => {
                reqLogger.error({
                    event: 'pdf.page.error',
                    requestId: request.id,
                    sessionId: request.sessionId,
                    errorType: err.constructor?.name || 'Error',
                    errorMessage: err.message,
                    stack: err.stack
                } as StructuredLog);
            });

            page.on('requestfailed', (req: any) => {
                reqLogger.warn({
                    event: 'pdf.request.failed',
                    requestId: request.id,
                    sessionId: request.sessionId,
                    url: req.url(),
                    errorCode: req.failure()?.errorText
                } as StructuredLog);
            });
        } catch (err: any) {
            reqLogger.error({
                event: 'pdf.page.create.failed',
                requestId: request.id,
                sessionId: request.sessionId,
                errorType: err.type || err.constructor.name,
                errorMessage: err.message
            } as StructuredLog);
            throw err;
        }

        // ── Set Content with Timeout ─────────────────────────────────────
        const pdfTimeoutMs = 30000;
        try {
            await page.setContent(htmlContent, {
                waitUntil: 'networkidle0',
                timeout: pdfTimeoutMs
            });
            reqLogger.debug({
                event: 'pdf.content.set',
                requestId: request.id,
                sessionId: request.sessionId,
                contentLength: htmlContent.length
            } as StructuredLog);
        } catch (err: any) {
            if (err instanceof Error && err.cause?.code === 'ERR_TIMEOUT') {
                reqLogger.error({
                    event: 'pdf.render.timeout',
                    requestId: request.id,
                    sessionId: request.sessionId,
                    timeoutMs: pdfTimeoutMs,
                    errorType: 'TimeoutError',
                    errorMessage: err.message
                } as StructuredLog);
            } else {
                reqLogger.error({
                    event: 'pdf.content.set.failed',
                    requestId: request.id,
                    sessionId: request.sessionId,
                    errorType: err.type || err.constructor.name,
                    errorMessage: err.message
                } as StructuredLog);
            }
            throw err;
        }

        // ── Generate PDF with Timeout ────────────────────────────────────
        try {
            const pdf: Buffer = await page.pdf({
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
                timeout: pdfTimeoutMs
            });

            // ── Output Validation ────────────────────────────────────────
            const pdfSizeKb = pdf.length / 1024;
            const MIN_VALID_PDF_SIZE_KB = 50;

            if (pdfSizeKb < MIN_VALID_PDF_SIZE_KB) {
                reqLogger.error({
                    event: 'pdf.export.invalid_size',
                    requestId: request.id,
                    sessionId: request.sessionId,
                    sizeKb: Math.round(pdfSizeKb),
                    minValidSizeKb: MIN_VALID_PDF_SIZE_KB,
                    message: 'Generated PDF is suspiciously small — likely empty or corrupt'
                } as StructuredLog);
                return reply.status(500).send({
                    error: 'Generated PDF appears corrupt or empty — please retry',
                    details: { sizeKb: Math.round(pdfSizeKb), minExpectedKb: MIN_VALID_PDF_SIZE_KB }
                });
            }

            const durationMs = Date.now() - startTime;

            reqLogger.info({
                event: 'pdf.render.success',
                requestId: request.id,
                sessionId: request.sessionId,
                tier: tier || 'Basic',
                pdfSizeKb: Math.round(pdfSizeKb),
                durationMs,
                contentLength: htmlContent.length
            } as StructuredLog);

            // Return PDF as binary response
            reply.type('application/pdf');
            reply.header('Content-Disposition',
                `attachment; filename="PricePoint_Report_${sessionData?.answers?.projectName?.value || 'Document'}.pdf"`
            );
            return reply.send(pdf);

        } catch (err: any) {
            if (err instanceof Error && err.cause?.code === 'ERR_TIMEOUT') {
                reqLogger.error({
                    event: 'pdf.export.failed',
                    requestId: request.id,
                    sessionId: request.sessionId,
                    errorType: 'TimeoutError',
                    errorMessage: err.message,
                    timeoutMs: pdfTimeoutMs,
                    durationMs: Date.now() - startTime
                } as StructuredLog);
            } else {
                reqLogger.error({
                    event: 'pdf.export.failed',
                    requestId: request.id,
                    sessionId: request.sessionId,
                    errorType: err.type || err.constructor.name,
                    errorMessage: err.message,
                    stack: err.stack
                } as StructuredLog);
            }
            throw err;
        }

    } catch (error: any) {
        const durationMs = Date.now() - startTime;
        reqLogger.error({
            event: 'pdf.generation.error',
            requestId: request.id,
            sessionId: request.sessionId,
            errorType: error.type || error.constructor.name,
            errorMessage: error.message || 'Unknown error',
            stack: error.stack,
            durationMs,
            tier: (request.body as any)?.tier
        } as StructuredLog);
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

// ── Global Error Handler ───────────────────────────────────────────────
server.setErrorHandler((error, request, reply) => {
    const reqLogger = createRequestLogger(request.id, request.sessionId, request.url);
    const statusCode = reply.statusCode || 500;

    reqLogger.error({
        event: 'unhandled.error',
        requestId: request.id,
        sessionId: request.sessionId,
        route: request.routerMethod + ' ' + request.url,
        method: request.method,
        url: request.url,
        statusCode,
        errorType: error.constructor.name,
        errorMessage: error.message,
        stack: error.stack
    } as StructuredLog);

    // In production, never leak internal error details to clients
    if (process.env.NODE_ENV === 'production') {
        reply.status(statusCode).send({ error: 'Internal server error' });
    } else {
        reply.status(statusCode).send({ error: error.message });
    }
});

// ── Process-Level Safety Nets ──────────────────────────────────────────
process.on('uncaughtException', (error: unknown) => {
    logger.fatal({
        event: 'process.uncaught_exception',
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorMessage: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        pid: process.pid
    } as StructuredLog);
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    logger.fatal({
        event: 'process.unhandled_rejection',
        errorType: reason instanceof Error ? reason.constructor.name : typeof reason,
        errorMessage: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: String(promise),
        pid: process.pid
    } as StructuredLog);
    process.exit(1);
});

// ── Graceful Shutdown ──────────────────────────────────────────────────
process.on('SIGTERM', () => {
    logger.info({ event: 'process.sigterm', pid: process.pid } as StructuredLog);
    process.exit(0);
});
process.on('SIGINT', () => {
    logger.info({ event: 'process.sigint', pid: process.pid } as StructuredLog);
    process.exit(0);
});

const start = async () => {
    try {
        const port = Number(process.env.PORT) || 3000;
        await server.listen({ port, host: '0.0.0.0' });
        logger.info({
            event: 'server.start',
            port,
            env: process.env.NODE_ENV || 'development',
            logLevel: process.env.LOG_LEVEL || 'info'
        } as StructuredLog);
    } catch (err: any) {
        logger.fatal({
            event: 'server.start_failed',
            errorType: err.constructor.name,
            errorMessage: err.message,
            stack: err.stack
        } as StructuredLog);
        process.exit(1);
    }
};

start();