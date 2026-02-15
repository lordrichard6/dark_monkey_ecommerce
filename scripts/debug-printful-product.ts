

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const { fetchStoreProducts, fetchSyncProduct } = await import('../src/lib/printful');

    console.log('Fetching store products...');
    const { products, error } = await fetchStoreProducts();

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    const targetProduct = products?.find(p => p.name.includes('SAVE The manuals'));

    if (!targetProduct) {
        console.error('Product "SAVE The manuals" not found.');
        console.log('Available products:', products?.map(p => p.name));
        return;
    }

    console.log(`Found product: ${targetProduct.name} (ID: ${targetProduct.id})`);
    console.log('Fetching sync details...');

    const { product, error: syncError } = await fetchSyncProduct(targetProduct.id);

    if (syncError || !product) {
        console.error('Error fetching sync details:', syncError);
        return;
    }

    const debugFile = path.resolve(process.cwd(), 'printful-debug-product.json');
    fs.writeFileSync(debugFile, JSON.stringify(product, null, 2));
    console.log(`Product data saved to ${debugFile}`);

    // Log summary of files
    product.sync_variants.forEach(v => {
        console.log(`Variant: ${v.name} (Color: ${v.color})`);
        v.files.forEach(f => {
            console.log(`  - File: ${f.type} | URL: ${f.preview_url || f.thumbnail_url} | Visible: ${f.visible}`);
        });
    });
}

run().catch(console.error);
