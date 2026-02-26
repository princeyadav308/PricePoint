import dotenv from 'dotenv';
dotenv.config();

const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;

async function testCheckout() {
    const dodoProductId = 'pdt_0NZCXcL3mqpymcvIytXm7'; // Basic Reporting tier

    // List of endpoints to test
    const endpoints = [
        'https://test.dodopayments.com/api/v1/payments',
        'https://test.dodopayments.com/payments',
        'https://test.dodopayments.com/api/v1/checkouts',
        'https://test.dodopayments.com/checkouts'
    ];

    for (const endpoint of endpoints) {
        console.log(`\nTesting endpoint: ${endpoint}`);
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${dodoApiKey}`
                },
                body: JSON.stringify({
                    billing: {
                        city: "San Francisco",
                        country: "US",
                        state: "CA",
                        street: "123 Main St",
                        zipcode: "94105"
                    },
                    customer: {
                        email: "test@example.com",
                        name: "Test Customer"
                    },
                    metadata: {
                        documentId: "test_doc_1",
                        tier: "Basic"
                    },
                    payment_link: true,
                    product_cart: [
                        {
                            product_id: dodoProductId,
                            quantity: 1
                        }
                    ],
                    return_url: "http://127.0.0.1:5173/success?documentId=test_doc_1"
                })
            });

            console.log(`Status: ${response.status}`);
            const text = await response.text();
            console.log(`Response: ${text.substring(0, 300)}`);
        } catch (e) {
            console.log(`Network error: ${e.message}`);
        }
    }
}

testCheckout();
