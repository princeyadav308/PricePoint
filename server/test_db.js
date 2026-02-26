const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function test() {
    try {
        const email = 'test_init@example.com';
        let lead = await prisma.lead.findUnique({ where: { email } });
        if (!lead) lead = await prisma.lead.create({ data: { email } });
        console.log('Lead:', lead.id);

        const session = await prisma.session.create({
            data: {
                leadId: lead.id,
                journeyType: 'Pricing Strategy',
                rawData: {}
            }
        });
        console.log('Session done', session.id);

        const report = await prisma.report.create({
            data: {
                sessionId: session.id,
                tier: 'Basic',
                paymentStatus: 'Pending'
            }
        });
        console.log('Report done', report.documentId);
    } catch (e) {
        console.error('DB ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
