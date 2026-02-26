import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { generatePricingReport } from './utils/claude';

// Import New Phase 4 routes
import reportRoutes from './routes/reports';
import webhookRoutes from './routes/webhooks';

import { prisma } from './lib/db';

// Load environment variables
dotenv.config();

const server: FastifyInstance = Fastify({
    logger: true,
});

server.register(cors, {
    origin: '*', // Allow all for dev
});

// Register domain routes
server.register(reportRoutes);
server.register(webhookRoutes);

// Root Route
server.get('/', async (request, reply) => {
    return { hello: 'world', system: 'PricePoint v2.0 API Phase 4' };
});

// ── Stripe Checkout Endpoint ───────────────────────────────────────
// ── (Old Stripe Checkout Removed - see routes/reports.ts for Dodo Checkout) ──

// ── Claude Generation Endpoint ───────────────────────────────────
server.post('/api/generate-report', async (request, reply) => {
    try {
        const { sessionData, pricingResult, appliedModifiers, tier } = request.body as any;

        // Secure Endpoint: Ensure core data exists
        if (!sessionData || !pricingResult) {
            return reply.status(400).send({ error: 'Missing sessionData or pricingResult' });
        }

        // Call our Claude API Wrapper with FULL session data
        const claudeReport = await generatePricingReport(
            sessionData,      // full Q&A dataset
            pricingResult,     // algorithm output
            appliedModifiers,  // MARKET_GRAVITY_APPLIED, etc.
            tier               // Basic/Professional/Investor
        );

        // Normally, we'd save this to `prisma.report.create(...)` but we return the payload to the frontend.
        return {
            success: true,
            claudeData: claudeReport,
        };

    } catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: 'Failed to generate report' });
    }
});
const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
        server.log.info(`Server running on http://127.0.0.1:3000`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();
