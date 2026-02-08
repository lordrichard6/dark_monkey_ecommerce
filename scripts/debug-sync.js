
const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Env
const envPath = path.resolve(process.cwd(), '.env.local');
const env = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let value = match[2].trim();
            if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            env[match[1].trim()] = value;
        }
    });
} catch (err) {
    console.error('Failed to read .env.local', err);
    process.exit(1);
}

const PRINTFUL_API_TOKEN = env.PRINTFUL_API_TOKEN;
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!PRINTFUL_API_TOKEN || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing env vars:', { url: !!SUPABASE_URL, key: !!SUPABASE_KEY, token: !!PRINTFUL_API_TOKEN });
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Helpers
function fetchPrintful(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.printful.com',
            path: endpoint,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${PRINTFUL_API_TOKEN}`,
                'Content-Type': 'application/json',
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
                } else {
                    resolve({ code: res.statusCode, error: { message: data } });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

function slugify(text) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function resolvePriceCents(retailPrice, catalogVariantId) {
    const retail = parseFloat(retailPrice || '0');
    if (retail > 0) return Math.round(retail * 100);

    // Minimal fallback implementation
    return 3990;
}

// 3. Main Sync Logic (Simplified from sync-printful.ts)
async function main() {
    console.log('Starting Sync Debug...');

    // Get Category
    const { data: defaultCat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', 'apparel')
        .single();

    const categoryId = defaultCat?.id ?? null;
    console.log('Category ID:', categoryId);

    let offset = 0;
    const limit = 20;

    while (true) {
        console.log(`Fetching products offset=${offset}...`);
        const listRes = await fetchPrintful(`/store/products?offset=${offset}&limit=${limit}`);

        if (listRes.code && listRes.code !== 200) {
            console.error('List Error:', listRes);
            break;
        }

        const products = listRes.result;
        if (!products || products.length === 0) break;

        for (const pf of products) {
            console.log(`Processing ${pf.id}: ${pf.name}`);
            const detailRes = await fetchPrintful(`/store/products/${pf.id}`);

            if (!detailRes.result || !detailRes.result.sync_variants) {
                console.error(`  No details for ${pf.id}`);
                continue;
            }

            const { sync_product, sync_variants } = detailRes.result;

            // Check existing
            const { data: existing } = await supabase
                .from('products')
                .select('id')
                .eq('printful_sync_product_id', sync_product.id)
                .single();

            if (existing) {
                console.log(`  Existing product ${existing.id}`);
                // Skip full image logic for brevity in debug script, focus on variants/errors
            } else {
                console.log(`  Creating new product...`);
                let slug = slugify(sync_product.name);
                // ... simplistic slug check ...

                try {
                    const insertPayload = {
                        category_id: categoryId,
                        name: sync_product.name,
                        slug, // Warning: duplicate slug might fail here if not handled loop
                        is_customizable: false,
                        is_active: true,
                        printful_sync_product_id: sync_product.id,
                    };

                    const { data: inserted, error } = await supabase
                        .from('products')
                        .insert(insertPayload)
                        .select('id')
                        .single();

                    if (error) {
                        console.error('  Insert Error:', error);
                        // Specifically check for UUID/Foreign Key issues
                        if (error.code === '23505') console.error('  DUPLICATE KEY');
                        continue;
                    }
                    console.log(`  Created ${inserted.id}`);
                } catch (e) {
                    console.error('  Insert Exception:', e);
                }
            }
        }

        offset += limit;
        if (products.length < limit) break;
    }
}

main().catch(err => console.error('Fatal:', err));
