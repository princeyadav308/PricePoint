import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';
import crypto from 'crypto';

/**
 * Verify Dodo webhook signature using HMAC-SHA256.
 * Returns true if valid or if running in dev without a secret configured.
 */
function verifyDodoSignature(rawBody: string, signature: string | undefined, secret: string | undefined): boolean {
    if (!secret) {
        // No secret configured — allow in dev, reject in production
        if (process.env.NODE_ENV === 'production') return false;
        return true;
    }
    if (!signature) return false;

    const expected = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

    // Check buffer lengths match before timingSafeEqual to avoid crash
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (sigBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

export default async function (server: FastifyInstance) {

    // Need raw body for HMAC verification
    server.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
        try {
            const json = JSON.parse(body as string);
            // Stash raw body for signature verification
            (req as any).rawBody = body;
            done(null, json);
        } catch (err: any) {
            done(err, undefined);
        }
    });

    // ──────────────────────────────────────────────────────────
    // 4. Webhook Receiver from Dodo Payments
    // ──────────────────────────────────────────────────────────
    server.post('/api/webhooks/dodo', async (request, reply) => {
        try {
            const signature = request.headers['dodo-signature'] as string | undefined;
            const webhookSecret = process.env.DODO_WEBHOOK_SECRET;
            const rawBody = (request as any).rawBody || JSON.stringify(request.body);

            // Verify HMAC signature
            if (!verifyDodoSignature(rawBody, signature, webhookSecret)) {
                server.log.warn('Webhook signature verification failed');
                return reply.status(401).send({ error: 'Invalid signature' });
            }

            const rawPayload = request.body as any;

            // Extract Dodo metadata
            const eventType = rawPayload.type || (rawPayload.data && rawPayload.data.status);
            const metadata = rawPayload.data?.metadata || rawPayload.metadata;

            if (eventType === 'payment.succeeded' || eventType === 'succeeded' || eventType === 'paid') {
                const documentId = metadata?.documentId;
                if (!documentId) {
                    server.log.warn('Webhook received without documentId in metadata');
                    return reply.send({ received: true });
                }

                // IMPORTANT: Transition the Report Status to 'Paid' securely on the backend
                // Idempotency check: skip if already paid
                const existingReport = await prisma.report.findUnique({
                    where: { documentId },
                    select: { paymentStatus: true }
                });

                if (existingReport?.paymentStatus === 'Paid') {
                    server.log.info(`Report ${documentId} already marked as PAID, skipping duplicate webhook.`);
                    return reply.send({ received: true, alreadyProcessed: true });
                }

                await prisma.report.update({
                    where: { documentId },
                    data: { paymentStatus: 'Paid' }
                });

                server.log.info(`Report ${documentId} successfully marked as PAID via webhook.`);
            }

            // Return 200 immediately to acknowledge receipt
            return reply.send({ received: true });

        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Webhook processing failed' });
        }
    });

}
