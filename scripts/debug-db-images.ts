
import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    const productId = 'da65bc7a-148c-4293-84ac-fdccd909fcfe'; // From previous debug output
    console.log('Fetching images for product:', productId);

    const { data: images, error } = await supabase
        .from('product_images')
        .select('id, url, color, sort_order, variant_id')
        .eq('product_id', productId)
        .order('sort_order');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${images.length} images.`);

    // Filter for blue
    const blueImages = images.filter(i => i.color === 'Carolina Blue');
    console.log(`\nCarolina Blue Images: ${blueImages.length}`);
    blueImages.forEach(img => {
        console.log(`- ID: ${img.id}`);
        console.log(`  URL: ${img.url}`);
        console.log(`  Sort: ${img.sort_order}`);
        console.log(`  VariantID: ${img.variant_id}`);
    });
}

run().catch(console.error);
