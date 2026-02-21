import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { generatePricingReport } from './utils/claude';

// Load environment variables
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock', {
    // API version managed implicitly by SDK
});

const prisma = new PrismaClient();

const server: FastifyInstance = Fastify({
    logger: true,
});

server.register(cors, {
    origin: '*', // Allow all for dev
});

// Root Route
server.get('/', async (request, reply) => {
    return { hello: 'world', system: 'PricePoint v2.0 API' };
});

// ── Stripe Checkout Endpoint ───────────────────────────────────────
server.post('/api/checkout', async (request, reply) => {
    try {
        const { reportTier } = request.body as { reportTier: string };

        // Pricing logic based on Tier
        let price = 0;
        let productName = 'PricePoint Basic Report';
        if (reportTier === 'Investor') {
            price = 99900; // $999.00
            productName = 'PricePoint Investor-Grade Report';
        } else if (reportTier === 'Professional') {
            price = 49900; // $499.00
            productName = 'PricePoint Professional Report';
        } else {
            price = 14900; // $149.00
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: productName,
                            description: 'Comprehensive data-driven pricing thesis.',
                        },
                        unit_amount: price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `http://localhost:5173/report-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:5173/analysis`,
        });

        return { url: session.url, sessionId: session.id };
    } catch (error) {
        server.log.error(error);
        return reply.status(500).send({ error: 'Failed to create Stripe checkout session' });
    }
});

// ── Claude Generation Endpoint ───────────────────────────────────
server.post('/api/generate-report', async (request, reply) => {
    try {
        const { sessionData, pricingResult, appliedModifiers } = request.body as any;

        // Secure Endpoint: Ensure pricing result exists
        if (!pricingResult) {
            return reply.status(400).send({ error: 'Missing pricingResult' });
        }

        // Call our Claude API Wrapper
        const claudeReport = await generatePricingReport(pricingResult, appliedModifiers);

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
