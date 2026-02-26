import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs';

const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;

const tiers = [
    { name: 'PricePoint Basic Report', price: 14900 },
    { name: 'PricePoint Professional Report', price: 49900 },
    { name: 'PricePoint Investor-Grade Report', price: 99900 }
];

async function setupProducts() {
    const productIds = {};

    for (const tier of tiers) {
        console.log(`Creating product: ${tier.name}...`);
        const response = await fetch('https://test.dodopayments.com/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${dodoApiKey}`
            },
            body: JSON.stringify({
                name: tier.name,
                description: `Complete intelligence for ${tier.name}`,
                tax_category: "digital_products",
                image: "https://i.imgur.com/uN8kI3f.png",
                price: {
                    type: "one_time_price",
                    currency: "USD",
                    price: tier.price,
                    discount: 0,
                    purchasing_power_parity: false,
                    pay_what_you_want: false
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.log(`Failed to create ${tier.name}. See error.json`);
            fs.writeFileSync('error.json', errText);
            break;
        } else {
            const data = await response.json();
            console.log(`Created! ID: ${data.product_id}`);
            productIds[tier.name] = data.product_id;
        }
    }

    fs.writeFileSync('dodo_ids.json', JSON.stringify(productIds, null, 2));
    console.log("Saved to dodo_ids.json");
}

setupProducts();
