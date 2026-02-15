
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log('Verifying image variant mapping...');

    // 1. Find product
    const { data: product } = await supabase
        .from('products')
        .select('id, name')
        .ilike('name', '%SAVE The manuals%')
        .single();

    if (!product) {
        console.error('Product not found');
        return;
    }
    console.log(`Product: ${product.name} (${product.id})`);

    // 2. Fetch variants
    const { data: variants } = await supabase
        .from('product_variants')
        .select('id, name, attributes')
        .eq('product_id', product.id);

    console.log(`Found ${variants?.length} variants.`);
    const variantMap = new Map(variants?.map(v => [v.id, v.attributes?.color]));

    // 3. Fetch images
    const { data: images } = await supabase
        .from('product_images')
        .select('id, url, color, variant_id')
        .eq('product_id', product.id);

    console.log(`Found ${images?.length} images.`);

    let mappedCount = 0;
    images?.forEach(img => {
        const isMapped = !!img.variant_id;
        if (isMapped) mappedCount++;
        const variantColor = img.variant_id ? variantMap.get(img.variant_id) : 'N/A';

        console.log(`Image: ${img.url.substring(0, 40)}... | Color: ${img.color} | VariantID: ${img.variant_id ? 'YES' : 'NO'} (${variantColor})`);
    });

    console.log(`Summary: ${mappedCount}/${images?.length} images have variant_id mapped.`);
}

run().catch(console.error);
