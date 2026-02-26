import dotenv from 'dotenv';
dotenv.config();

const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;

async function run() {
    const amount = 14900;
    const productName = 'PricePoint Basic Report';

    console.log("Using API Key of length", dodoApiKey?.length);

    const response = await fetch('https://test.dodopayments.com/payments', {
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
                documentId: "test_doc",
                tier: "Basic"
            },
            payment_link: true,
            product_cart: [
                {
                    amount: amount,
                    name: productName,
                    quantity: 1
                }
            ],
            return_url: `http://127.0.0.1:5173/success?documentId=test`
        })
    });

    const textResp = await response.text();
    console.log("Status:", response.status);
    console.log("Raw Response Text:");
    console.log(textResp);
}

run();
