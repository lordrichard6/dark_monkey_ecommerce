
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const { fetchSyncProduct } = await import('../src/lib/printful');
    const productId = 419227986;
    console.log('Fetching sync product...', productId);

    const { product, error } = await fetchSyncProduct(productId);

    if (error || !product) {
        console.error('Error:', error);
        return;
    }

    // Check Carolina Blue variants
    const blueVariants = product.sync_variants.filter(v => v.name.includes('Carolina Blue'));

    blueVariants.forEach(v => {
        console.log(`\nVariant: ${v.name} (ID: ${v.id})`);
        console.log('Files:');
        v.files.forEach(f => {
            console.log(`  - Type: ${f.type}`);
            console.log(`    Preview URL: ${f.preview_url}`);
            console.log(`    Thumbnail URL: ${f.thumbnail_url}`);
        });
    });
}

run().catch(console.error);
