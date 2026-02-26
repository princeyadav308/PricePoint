import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';
import { supabase } from '../lib/supabase';

export default async function (server: FastifyInstance) {

    // ──────────────────────────────────────────────────────────
    // 1. Initialize Report (Freezes state & gets Document ID)
    // ──────────────────────────────────────────────────────────
    server.post('/api/reports/initialize', async (request, reply) => {
        try {
            // VERIFY AUTH TOKEN FIRST (Production Hardening)
            const authHeader = request.headers.authorization;
            let user: any = null;

            if (process.env.NODE_ENV !== 'production' && (!authHeader || authHeader.includes('test-bypass'))) {
                // Allow TestSprite bypass only in non-production environments
                user = { email: 'test_sprite@example.com' };
            } else {
                if (!authHeader || !authHeader.startsWith('Bearer ')) {
                    return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
                }

                const token = authHeader.split(' ')[1];
                const { data, error: authError } = await supabase.auth.getUser(token);
                if (authError || !data.user) {
                    server.log.warn(`Unauthorized initialization attempt: ${authError?.message}`);
                    return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
                }
                user = data.user;
            }

            const { sessionData, pricingResult, tier } = request.body as any;

            if (!sessionData || !tier || !pricingResult) {
                return reply.status(400).send({ error: 'Missing sessionData, tier, or pricingResult' });
            }

            // Create or find a Lead using the verified user's secure token email
            const email = user.email || sessionData.user?.email || `guest_${Date.now()}@example.com`;

            let lead = await prisma.lead.findUnique({ where: { email } });
            if (!lead) {
                lead = await prisma.lead.create({ data: { email } });
            }

            // Attach the pricingResult to rawData so it survives page redirects!
            const finalData = { ...sessionData, pricingResult };

            // Create the Session record
            const session = await prisma.session.create({
                data: {
                    leadId: lead.id,
                    journeyType: sessionData.journeyType || 'Pricing Strategy',
                    rawData: finalData, // Store combined state + result
                }
            });

            // Create the Pending Report record
            const report = await prisma.report.create({
                data: {
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
            let dodoProductId = '';

            if (report.tier === 'Investor') {
                dodoProductId = 'pdt_0NZCXcODTdlz8fl8RizBV';
            } else if (report.tier === 'Professional') {
                dodoProductId = 'pdt_0NZCXcMlZ0lBdlm6Cw6Dm';
            } else {
                dodoProductId = 'pdt_0NZCXcL3mqpymcvIytXm7';
            }

            // Call Dodo Payments API natively
            const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || 'test_apikey';

            // Default to India billing so UPI is available.
            // Card payments work globally regardless of billing country.
            const billing = clientBilling || {
                city: "Mumbai",
                country: "IN",
                state: "MH",
                street: "PricePoint HQ",
                zipcode: "400001"
            };

            const customer = clientCustomer || {
                email: "customer@pricepoint.app",
                name: "PricePoint Customer"
            };

            const response = await fetch('https://test.dodopayments.com/checkouts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${dodoApiKey}`
                },
                body: JSON.stringify({
                    billing,
                    customer,
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
                    return_url: returnUrl || `http://localhost:5173/success?documentId=${report.documentId}`
                })
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
                return { paymentStatus: report.paymentStatus, sessionData: report.session?.rawData };
            }

            // If it is pending, proactively check Dodo Payments (especially useful for localhost without webhooks)
            if (report.stripeCheckoutId) {
                try {
                    const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY || '';
                    const checkoutId = report.stripeCheckoutId;

                    // Query the Dodo checkouts endpoint
                    const checkRes = await fetch(`https://test.dodopayments.com/checkouts/${checkoutId}`, {
                        headers: { 'Authorization': `Bearer ${dodoApiKey}` }
                    });

                    if (checkRes.ok) {
                        const dodoData: any = await checkRes.json();
                        // Dodo uses `payment_status` NOT `status`
                        const paymentStatus = String(dodoData.payment_status || '').toLowerCase();
                        server.log.info(`Dodo checkout ${checkoutId} → payment_status: "${paymentStatus}"`);

                        if (['paid', 'succeeded', 'completed', 'complete'].includes(paymentStatus)) {
                            await prisma.report.update({
                                where: { documentId },
                                data: { paymentStatus: 'Paid' }
                            });
                            server.log.info(`✅ Report ${documentId} marked as PAID via proactive polling.`);
                            return { paymentStatus: 'Paid', sessionData: report.session?.rawData as any };
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

            return { paymentStatus: report.paymentStatus, sessionData: report.session?.rawData as any };
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch status' });
        }
    });
}
