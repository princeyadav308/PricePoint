import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';
import { supabase } from '../lib/supabase';
import crypto from 'crypto';

const DODO_API_BASE = process.env.DODO_API_URL;
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

// Dodo product IDs from environment variables
const DODO_PRODUCT_IDS = {
    Investor: process.env.DODO_PRODUCT_ID_INVESTOR,
    Professional: process.env.DODO_PRODUCT_ID_PROFESSIONAL,
    Basic: process.env.DODO_PRODUCT_ID_BASIC,
};

// Generate cryptographically secure document ID
function generateDocumentId(): string {
    return crypto.randomBytes(32).toString('hex');
}

export default async function (server: FastifyInstance) {

    // Helper: verify auth token and return user
    async function verifyAuth(request: any): Promise<{ user: any } | { error: string }> {
        const authHeader = request.headers.authorization;
        
        // Allow test bypass only in non-production with a secret token
        if (process.env.NODE_ENV !== 'production' && authHeader === `Bearer ${process.env.TEST_BYPASS_SECRET || 'test-bypass'}`) {
            return { user: { id: 'test-user-id', email: 'test_sprite@example.com' } };
        }

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { error: 'Missing or invalid Authorization header' };
        }

        const token = authHeader.split(' ')[1];
        const { data, error: authError } = await supabase.auth.getUser(token);
        if (authError || !data.user) {
            return { error: 'Unauthorized: Invalid token' };
        }
        return { user: data.user };
    }

    // ──────────────────────────────────────────────────────────
    // 1. Initialize Report (Freezes state & gets Document ID)
    // ──────────────────────────────────────────────────────────
    server.post('/api/reports/initialize', async (request, reply) => {
        try {
            // VERIFY AUTH TOKEN FIRST (Production Hardening)
            const authResult = await verifyAuth(request);
            if ('error' in authResult) {
                return reply.status(401).send({ error: authResult.error });
            }
            const user = authResult.user;

            const { sessionData, pricingResult, tier, intelligenceData } = request.body as any;

            if (!sessionData || !tier || !pricingResult) {
                return reply.status(400).send({ error: 'Missing sessionData, tier, or pricingResult' });
            }

            // Create or find a Lead using the verified user's secure token email
            const email = user.email || sessionData.user?.email || `guest_${Date.now()}@example.com`;
            const supabaseUserId = user.id || null;

            let lead = await prisma.lead.findUnique({ where: { email } });
            if (!lead) {
                lead = await prisma.lead.create({ data: { email, supabaseUserId } });
            } else if (supabaseUserId && !lead.supabaseUserId) {
                // Backfill supabaseUserId if not yet stored
                lead = await prisma.lead.update({ where: { email }, data: { supabaseUserId } });
            }

            // Attach the pricingResult and intelligenceData to rawData so it survives page redirects!
            const finalData = { ...sessionData, pricingResult, intelligenceData: intelligenceData || null };

            // Create the Session record
            const session = await prisma.session.create({
                data: {
                    leadId: lead.id,
                    journeyType: sessionData.journeyType || 'Pricing Strategy',
                    rawData: finalData, // Store combined state + result + intelligence
                }
            });

            // Create the Pending Report record with cryptographically random documentId
            const report = await prisma.report.create({
                data: {
                    documentId: generateDocumentId(),
                    sessionId: session.id,
                    tier: tier,
                    paymentStatus: 'Pending', // Will be marked 'Paid' by webhook or proactive polling
                }
            });

            return {
                success: true,
                documentId: report.documentId,
                sessionId: session.id
            };

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to initialize report record' });
        }
    });

    // ──────────────────────────────────────────────────────────
    // 2. Dodo Payments Checkout (Generates the Paywall URL)
    // ──────────────────────────────────────────────────────────
    server.post('/api/checkout', async (request, reply) => {
        try {
            const { documentId, returnUrl, billing: clientBilling, customer: clientCustomer } = request.body as any;

            if (!documentId) {
                return reply.status(400).send({ error: 'Missing documentId' });
            }

            const report = await prisma.report.findUnique({ where: { documentId } });
            if (!report) {
                return reply.status(404).send({ error: 'Report not found' });
            }

            // Map to the generated Dodo Payments Products
            const dodoProductId = DODO_PRODUCT_IDS[report.tier as keyof typeof DODO_PRODUCT_IDS];
            if (!dodoProductId) {
                return reply.status(500).send({ error: `No Dodo product ID configured for tier: ${report.tier}` });
            }

            // Call Dodo Payments API natively
            const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;
            if (!dodoApiKey) {
                return reply.status(500).send({ error: 'Dodo API key not configured' });
            }

            // Build checkout body — only include billing/customer if frontend provides them.
            // Dodo's hosted checkout page will collect user details and auto-detect
            // eligible payment methods (card, UPI, etc.) based on user's actual location.
            // NOTE: Our products are USD-priced. UPI only works with INR products,
            // so Dodo will correctly hide UPI for USD products.
            const checkoutBody: any = {
                metadata: {
                    documentId: report.documentId,
                    tier: report.tier
                },
                payment_link: true,
                product_cart: [
                    {
                        product_id: dodoProductId,
                        quantity: 1
                    }
                ],
                return_url: returnUrl || `${APP_URL}/success?documentId=${report.documentId}`
            };

            // Forward billing/customer only if provided by frontend
            if (clientBilling) checkoutBody.billing = clientBilling;
            if (clientCustomer) checkoutBody.customer = clientCustomer;

            const response = await fetch(`${DODO_API_BASE}/checkouts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${dodoApiKey}`
                },
                body: JSON.stringify(checkoutBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`Dodo API Error: ${errorData}`);
            }

            const dodoSession: any = await response.json();

            // Update Report with the transaction ID
            await prisma.report.update({
                where: { documentId },
                data: { stripeCheckoutId: dodoSession.session_id || dodoSession.payment_id || dodoSession.id } // reusing the stripeCheckoutId field temporarily
            });

            return { url: dodoSession.checkout_url || dodoSession.payment_link };

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to create Dodo checkout session' });
        }
    });

    // ──────────────────────────────────────────────────────────
    // 3. Status Polling Endpoint (Used by Success.tsx)
    // ──────────────────────────────────────────────────────────
    server.get('/api/reports/status/:documentId', async (request, reply) => {
        try {
            // Optional auth: validate token if provided, but allow unauthenticated access for backwards compatibility
            const authHeader = request.headers.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                const { error: authError } = await supabase.auth.getUser(token);
                if (authError) {
                    // Log but don't block - polling is read-only
                    server.log.warn(`Polling request with invalid token: ${authError.message}`);
                }
            }

            const { documentId } = request.params as { documentId: string };
            const report = await prisma.report.findUnique({
                where: { documentId },
                include: { session: true }
            });

            if (!report) {
                return reply.status(404).send({ error: 'Report not found' });
            }

            // If it's already Paid or Failed, just return it
            if (report.paymentStatus !== 'Pending') {
                return { paymentStatus: report.paymentStatus, sessionData: report.session?.rawData, tier: report.tier };
            }

            // If it is pending, proactively check Dodo Payments (especially useful for localhost without webhooks)
            if (report.stripeCheckoutId) {
                try {
                    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || '';
                    const checkoutId = report.stripeCheckoutId;

                    // Query the Dodo checkouts endpoint
                    const checkRes = await fetch(`${DODO_API_BASE}/checkouts/${checkoutId}`, {
                        headers: { 'Authorization': `Bearer ${dodoApiKey}` }
                    });

                    if (checkRes.ok) {
                        const dodoData: any = await checkRes.json();
                        // Dodo uses `payment_status` NOT `status`
                        const paymentStatus = String(dodoData.payment_status || '').toLowerCase();
                        server.log.info(`Dodo checkout ${checkoutId} → payment_status: "${paymentStatus}"`);

                        if (['paid', 'succeeded', 'completed', 'complete'].includes(paymentStatus)) {
                            // Extract payment amount from Dodo response
                            const paidAmount = dodoData.total_amount ? parseFloat(dodoData.total_amount) / 100 : dodoData.amount ? parseFloat(dodoData.amount) : null;
                            const paidCurrency = dodoData.currency || 'USD';

                            await prisma.report.update({
                                where: { documentId },
                                data: { paymentStatus: 'Paid', amountPaid: paidAmount, currency: paidCurrency }
                            });
                            server.log.info(`✅ Report ${documentId} marked as PAID via proactive polling.`);
                            return { paymentStatus: 'Paid', sessionData: report.session?.rawData as any, tier: report.tier };
                        } else if (['failed', 'cancelled', 'expired'].includes(paymentStatus)) {
                            await prisma.report.update({
                                where: { documentId },
                                data: { paymentStatus: 'Failed' }
                            });
                            return { paymentStatus: 'Failed' };
                        }
                        // If still pending, fall through and return 'Pending'
                    }
                } catch (dodoError) {
                    server.log.warn(`Failed to proactively poll Dodo Payments for ${documentId}: ${dodoError}`);
                }
            }

            return { paymentStatus: report.paymentStatus, sessionData: report.session?.rawData as any, tier: report.tier };
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch status' });
        }
    });
}
