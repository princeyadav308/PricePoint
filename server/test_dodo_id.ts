import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const p = new PrismaClient();

async function run() {
    const documentId = '1b9bde8b-4e9f-45bd-aaca-a066f3724aab'; // From terminal logs
    const report = await p.report.findUnique({ where: { documentId } });
    console.log('Report ID:', report?.documentId);
    console.log('Session ID (stripeCheckoutId):', report?.stripeCheckoutId);

    if (!report?.stripeCheckoutId) {
        console.log('No checkout ID found.');
        return;
    }

    // Check Dodo Payments checkouts API
    const res = await fetch('https://test.dodopayments.com/checkouts/' + report.stripeCheckoutId, {
        headers: {
            'Authorization': 'Bearer ' + process.env.DODO_PAYMENTS_API_KEY
        }
    });
    console.log('API Status:', res.status);
    console.log('CHECKOUTS API RESPONSE:', await res.text());
}

run().finally(() => process.exit(0));
