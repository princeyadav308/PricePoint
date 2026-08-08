import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';
import { supabase } from '../lib/supabase';

// ============================================================
// Draft Save & Resume Routes
//
// POST /api/user/draft — Save/upsert a journey draft
// GET  /api/user/draft — Fetch the latest unfinished draft
// ============================================================

// Simple in-memory rate limiter: max 10 saves per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

function checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(userId);

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT_MAX) {
        return false;
    }

    entry.count++;
    return true;
}

export default async function (server: FastifyInstance) {

    // ── Helper: verify auth token ────────────────────────────
    async function verifyAuth(request: any): Promise<{ user: any } | { error: string }> {
        const authHeader = request.headers.authorization;
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
    // POST /api/user/draft — Save or update a journey draft
    //
    // Body: { sessionId, lastUpdatedAt, journeyType, ...sessionData }
    // - sessionId is client-generated (UUID), used for idempotent upserts.
    // - lastUpdatedAt is a client timestamp; rejects stale writes.
    // ──────────────────────────────────────────────────────────
    server.post('/api/user/draft', async (request, reply) => {
        try {
            const authResult = await verifyAuth(request);
            if ('error' in authResult) {
                return reply.status(401).send({ error: authResult.error });
            }
            const user = authResult.user;

            // Rate limit
            if (!checkRateLimit(user.id)) {
                return reply.status(429).send({ error: 'Too many draft saves. Please wait a moment.' });
            }

            const body = request.body as any;
            const { sessionId: draftSessionId, lastUpdatedAt, journeyType, ...rest } = body;

            if (!draftSessionId) {
                return reply.status(400).send({ error: 'Missing sessionId (client-generated UUID)' });
            }

            const email = user.email;
            if (!email) {
                return reply.status(400).send({ error: 'User email not available' });
            }

            // Find or create Lead
            let lead = await prisma.lead.findUnique({ where: { email } });
            if (!lead) {
                lead = await prisma.lead.create({
                    data: { email, supabaseUserId: user.id },
                });
            } else if (user.id && !lead.supabaseUserId) {
                lead = await prisma.lead.update({
                    where: { email },
                    data: { supabaseUserId: user.id },
                });
            }

            // Check for existing draft with this draftSessionId
            const existing = await prisma.session.findUnique({
                where: { draftSessionId },
            });

            if (existing) {
                // Stale-write protection: reject if incoming timestamp is older
                const incomingTs = BigInt(lastUpdatedAt || 0);
                const storedTs = existing.lastUpdatedAt ?? BigInt(0);

                if (incomingTs < storedTs) {
                    server.log.warn(
                        `Stale draft write rejected for session ${draftSessionId}: incoming=${incomingTs}, stored=${storedTs}`
                    );
                    return reply.status(409).send({
                        error: 'Stale write rejected. A newer version exists on the server.',
                        serverLastUpdatedAt: storedTs.toString(),
                    });
                }

                // Update existing draft
                const updated = await prisma.session.update({
                    where: { draftSessionId },
                    data: {
                        journeyType: journeyType || existing.journeyType,
                        rawData: { ...rest, journeyType },
                        lastUpdatedAt: incomingTs,
                    },
                });

                return {
                    success: true,
                    sessionId: draftSessionId,
                    serverId: updated.id,
                    action: 'updated',
                };
            } else {
                // Create new draft session
                const created = await prisma.session.create({
                    data: {
                        draftSessionId,
                        leadId: lead.id,
                        journeyType: journeyType || 'unknown',
                        rawData: { ...rest, journeyType },
                        lastUpdatedAt: BigInt(lastUpdatedAt || Date.now()),
                    },
                });

                return {
                    success: true,
                    sessionId: draftSessionId,
                    serverId: created.id,
                    action: 'created',
                };
            }
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to save draft' });
        }
    });

    // ──────────────────────────────────────────────────────────
    // GET /api/user/draft — Fetch the user's latest unfinished draft
    //
    // Returns the most recently updated Session that has NO
    // associated Report (i.e., the journey is still in progress).
    // ──────────────────────────────────────────────────────────
    server.get('/api/user/draft', async (request, reply) => {
        try {
            const authResult = await verifyAuth(request);
            if ('error' in authResult) {
                return reply.status(401).send({ error: authResult.error });
            }
            const user = authResult.user;
            const email = user.email;

            if (!email) {
                return reply.status(400).send({ error: 'User email not available' });
            }

            const lead = await prisma.lead.findUnique({ where: { email } });
            if (!lead) {
                return { success: true, draft: null };
            }

            // Find the most recently updated session with NO reports
            const draft = await prisma.session.findFirst({
                where: {
                    leadId: lead.id,
                    reports: { none: {} },
                },
                orderBy: { updatedAt: 'desc' },
            });

            if (!draft) {
                return { success: true, draft: null };
            }

            return {
                success: true,
                draft: {
                    sessionId: draft.draftSessionId,
                    serverId: draft.id,
                    journeyType: draft.journeyType,
                    lastUpdatedAt: draft.lastUpdatedAt?.toString() ?? null,
                    rawData: draft.rawData,
                },
            };
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch draft' });
        }
    });
}
