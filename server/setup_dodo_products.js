import dotenv from 'dotenv';
dotenv.config();

const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;

const tiers = [
    { name: 'PricePoint Basic Report', price: 149 },
    { name: 'PricePoint Professional Report', price: 499 },
    { name: 'PricePoint Investor-Grade Report', price: 999 }
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
                    price: tier.price
                }
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.log(`Failed to create ${tier.name}. See error.json`);
            import('fs').then(fs => fs.writeFileSync('error.json', errText));
            break;
        } else {
            const data = await response.json();
            console.log(`Created! ID: ${data.product_id}`);
            productIds[tier.name] = data.product_id;
        }
    }

    console.log("\nAdd the following mapping to your Dodo payment logic:");
    console.log(productIds);
}

setupProducts();
