
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function restore() {
    console.log('Restoring all Printful products...');
    const { data, error } = await supabase
        .from('products')
        .update({ deleted_at: null, is_active: true })
        .not('printful_sync_product_id', 'is', null)
        .not('deleted_at', 'is', null) // Only restore deleted ones
        .select('id, name');

    if (error) console.error(error);
    else console.log(`Restored ${data.length} products.`);
}

restore();
