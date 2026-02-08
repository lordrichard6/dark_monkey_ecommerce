
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const PRINTFUL_API_TOKEN = process.env.PRINTFUL_API_TOKEN;

if (!PRINTFUL_API_TOKEN) {
    console.error('Error: PRINTFUL_API_TOKEN not found in .env.local');
    process.exit(1);
}

async function fetchPrintful(endpoint: string) {
    const res = await fetch(`https://api.printful.com${endpoint}`, {
        headers: {
            Authorization: `Bearer ${PRINTFUL_API_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });
    if (!res.ok) {
        throw new Error(`Printful API Error ${res.status}: ${await res.text()}`);
    }
    return res.json();
}

async function main() {
    try {
        console.log('Fetching Store Products...');
        const productsRes = await fetchPrintful('/store/products?limit=3'); // fetch just 3 to check structure
        console.log('Products Response:', JSON.stringify(productsRes, null, 2));

        if (productsRes.result && productsRes.result.length > 0) {
            const firstProductId = productsRes.result[0].id;
            console.log(`\nFetching details for product ${firstProductId}...`);
            const detailRes = await fetchPrintful(`/store/products/${firstProductId}`);
            console.log('Product Detail Response:', JSON.stringify(detailRes, null, 2));
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

main();
