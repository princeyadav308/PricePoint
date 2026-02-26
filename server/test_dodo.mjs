import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const p = new PrismaClient();

async function run() {
    const report = await p.report.findFirst({ orderBy: { documentId: 'desc' } });
    console.log('Latest Report ID:', report.documentId);
    console.log('Session ID (stripeCheckoutId):', report.stripeCheckoutId);

    // Check Dodo Payments API for this payment
    const res = await fetch('https://test.dodopayments.com/payments/' + report.stripeCheckoutId, {
        headers: {
            'Authorization': 'Bearer ' + process.env.DODO_PAYMENTS_API_KEY
        }
    });
    console.log('PAYMENTS API RESPONSE:', await res.text());

    // Also try checkouts API just in case it's a checkout id not a payment id
    const res2 = await fetch('https://test.dodopayments.com/checkouts/' + report.stripeCheckoutId, {
        headers: {
            'Authorization': 'Bearer ' + process.env.DODO_PAYMENTS_API_KEY
        }
    });
    console.log('CHECKOUTS API RESPONSE:', await res2.text());
}

run().finally(() => process.exit(0));
