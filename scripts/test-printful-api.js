
const fs = require('fs');
const path = require('path');
const https = require('https');

// Manually read .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
let apiToken = null;

try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^PRINTFUL_API_TOKEN=(.+)$/m);
    if (match) {
        apiToken = match[1].trim();
        // Remove quotes if present
        if ((apiToken.startsWith('"') && apiToken.endsWith('"')) || (apiToken.startsWith("'") && apiToken.endsWith("'"))) {
            apiToken = apiToken.slice(1, -1);
        }
    }
} catch (err) {
    console.error('Error reading .env.local:', err.message);
    process.exit(1);
}

if (!apiToken) {
    console.error('PRINTFUL_API_TOKEN not found in .env.local');
    process.exit(1);
}

function fetchPrintful(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.printful.com',
            path: endpoint,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiToken}`,
                'Content-Type': 'application/json',
                'User-Agent': 'Node.js Script'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Invalid JSON response'));
                    }
                } else {
                    reject(new Error(`API Error ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

async function main() {
    try {
        console.log('Fetching Store Products...');
        const productsRes = await fetchPrintful('/store/products?limit=3');
        console.log('Products Response:', JSON.stringify(productsRes, null, 2));

        if (productsRes.result && productsRes.result.length > 0) {
            const firstProductId = productsRes.result[0].id;
            console.log(`\nFetching details for product ${firstProductId}...`);
            const detailRes = await fetchPrintful(`/store/products/${firstProductId}`);
            console.log('Product Detail Response:', JSON.stringify(detailRes, null, 2));
        }
    } catch (error) {
        console.error('Test Failed:', error.message);
    }
}

main();
