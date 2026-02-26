import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';

export default async function (server: FastifyInstance) {

    // ──────────────────────────────────────────────────────────
    // 4. Webhook Receiver from Dodo Payments
    // ──────────────────────────────────────────────────────────
    server.post('/api/webhooks/dodo', async (request, reply) => {
        try {
            const signature = request.headers['dodo-signature'];
            if (!signature) {
                return reply.status(400).send({ error: 'Missing Signature' });
            }

            // In production, we'd verify the hmac signature using the Dodo Webhook Secret
            // For now, assume payload is valid JSON from Dodo
            const rawBody = request.body as any;

            // Extract Dodo metadata
            // Dodo webhooks usually follow a payload structure: { "data": { "metadata": { "documentId": "..." }, "status": "succeeded" }, "type": "payment.succeeded" }
            const eventType = rawBody.type || (rawBody.data && rawBody.data.status);
            const metadata = rawBody.data?.metadata || rawBody.metadata;

            if (eventType === 'payment.succeeded' || eventType === 'succeeded' || eventType === 'paid') {
                const documentId = metadata?.documentId;
                if (!documentId) {
                    server.log.warn('Webhook received without documentId in metadata');
                    return reply.send({ received: true });
                }

                // IMPORTANT: Transition the Report Status to 'Paid' securely on the backend
                await prisma.report.update({
                    where: { documentId },
                    data: { paymentStatus: 'Paid' } // This unlocks the /generate-narrative route
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
