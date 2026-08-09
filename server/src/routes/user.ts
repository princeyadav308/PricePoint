import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/db';
import { supabase } from '../lib/supabase';
import { PaymentStatus } from '@prisma/client';

export default async function (server: FastifyInstance) {

    // ──────────────────────────────────────────────────────────
    // GET /api/user/profile — Returns authenticated user info
    // ──────────────────────────────────────────────────────────
    server.get('/api/user/profile', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
            }

            const token = authHeader.split(' ')[1];
            const { data, error: authError } = await supabase.auth.getUser(token);
            if (authError || !data.user) {
                return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
            }

            const user = data.user;

            // Find Lead record to get member-since date
            const lead = await prisma.lead.findUnique({
                where: { email: user.email || '' },
            });

            return {
                success: true,
                profile: {
                    id: user.id,
                    email: user.email,
                    fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
                    avatarUrl: user.user_metadata?.avatar_url || null,
                    memberSince: lead?.createdAt || user.created_at,
                }
            };
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch profile' });
        }
    });

    // ──────────────────────────────────────────────────────────
    // GET /api/user/reports — Returns all reports for the user
    // ──────────────────────────────────────────────────────────
    server.get('/api/user/reports', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
            }

            const token = authHeader.split(' ')[1];
            const { data, error: authError } = await supabase.auth.getUser(token);
            if (authError || !data.user) {
                return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
            }

            const userEmail = data.user.email;

            // Find Lead → Sessions → Reports through Prisma relations
            const lead = await prisma.lead.findUnique({
                where: { email: userEmail || '' },
                include: {
                    sessions: {
                        include: {
                            reports: {
                                where: { paymentStatus: PaymentStatus.Paid },
                                orderBy: { createdAt: 'desc' },
                                select: {
                                    documentId: true,
                                    tier: true,
                                    paymentStatus: true,
                                    createdAt: true,
                                    amountPaid: true,
                                    currency: true,
                                }
                            }
                        }
                    }
                }
            });

            if (!lead) {
                return { success: true, reports: [] };
            }

            // Flatten sessions → reports into a single list
            const reports = lead.sessions.flatMap(session =>
                session.reports.map(report => ({
                    ...report,
                    journeyType: session.journeyType,
                }))
            );

            // Sort by date descending (most recent first)
            reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return { success: true, reports };
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch reports' });
        }
    });

    // ──────────────────────────────────────────────────────────
    // GET /api/user/reports/:documentId — Returns full report
    // data for regenerating PDF on the profile page
    // ──────────────────────────────────────────────────────────
    server.get('/api/user/reports/:documentId', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
            }

            const token = authHeader.split(' ')[1];
            const { data, error: authError } = await supabase.auth.getUser(token);
            if (authError || !data.user) {
                return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
            }

            const { documentId } = request.params as { documentId: string };

            const report = await prisma.report.findUnique({
                where: { documentId },
                include: {
                    session: {
                        include: {
                            lead: { select: { email: true, supabaseUserId: true } }
                        }
                    }
                }
            });

            if (!report) {
                return reply.status(404).send({ error: 'Report not found' });
            }

            // Ensure the report belongs to the authenticated user
            const lead = report.session.lead;
            const isOwnerById = lead.supabaseUserId != null && lead.supabaseUserId === data.user.id;
            const isOwnerByEmail = lead.supabaseUserId == null && lead.email === data.user.email;
            if (!isOwnerById && !isOwnerByEmail) {
                return reply.status(403).send({ error: 'Access denied' });
            }

            return {
                success: true,
                report: {
                    documentId: report.documentId,
                    tier: report.tier,
                    paymentStatus: report.paymentStatus,
                    createdAt: report.createdAt,
                    amountPaid: report.amountPaid,
                    currency: report.currency,
                    sessionData: report.session.rawData,
                    journeyType: report.session.journeyType,
                }
            };
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to fetch report details' });
        }
    });

    // ──────────────────────────────────────────────────────────
    // POST /api/reports/send-email — Sends report email
    // ──────────────────────────────────────────────────────────
    server.post('/api/reports/send-email', async (request, reply) => {
        try {
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
            }

            const token = authHeader.split(' ')[1];
            const { data, error: authError } = await supabase.auth.getUser(token);
            if (authError || !data.user) {
                return reply.status(401).send({ error: 'Unauthorized: Invalid token' });
            }

            const { documentId } = request.body as { documentId: string };
            if (!documentId) {
                return reply.status(400).send({ error: 'Missing documentId' });
            }

            const report = await prisma.report.findUnique({
                where: { documentId },
                include: {
                    session: {
                        include: {
                            lead: { select: { email: true, supabaseUserId: true } }
                        }
                    }
                }
            });

            if (!report || report.paymentStatus !== PaymentStatus.Paid) {
                return reply.status(404).send({ error: 'Paid report not found' });
            }

            // Ensure the report belongs to the authenticated user
            const lead = report.session.lead;
            const isOwnerById = lead.supabaseUserId != null && lead.supabaseUserId === data.user.id;
            const isOwnerByEmail = lead.supabaseUserId == null && lead.email === data.user.email;
            if (!isOwnerById && !isOwnerByEmail) {
                return reply.status(403).send({ error: 'Access denied' });
            }

            // Import and send email
            const { sendReportEmail } = await import('../utils/email');
            const sent = await sendReportEmail({
                to: data.user.email!,
                userName: data.user.user_metadata?.full_name || data.user.user_metadata?.name || undefined,
                documentId: report.documentId,
                tier: report.tier,
                amountPaid: report.amountPaid,
                currency: report.currency,
                reportDate: report.createdAt.toISOString(),
            });

            return { success: sent };
        } catch (error) {
            server.log.error(error);
            return reply.status(500).send({ error: 'Failed to send email' });
        }
    });
}
