const { createClient } = require('@supabase/supabase-js');

// Hardcode from .env.production manually for this test if process.env fails, 
// but try process.env first (assuming run with --env-file)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Need service role key to update
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;


if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing ENV variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkAndRestore() {
    console.log('Checking deleted status...');

    // Count total products
    const { count: total, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error('Count error:', countError);

    // Count deleted products
    const { count: deleted, error: delError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .not('deleted_at', 'is', null);

    console.log(`Total Products: ${total}`);
    console.log(`Deleted Products: ${deleted}`);

    if (deleted > 0) {
        console.log(`Found ${deleted} deleted products. Restoring ALL of them...`);
        const { error: updateError } = await supabase
            .from('products')
            .update({ deleted_at: null })
            .not('deleted_at', 'is', null);

        if (updateError) {
            console.error('Failed to restore:', updateError);
        } else {
            console.log('SUCCESS: Products restored.');
        }
    } else {
        console.log('No deleted products found.');
    }
}

checkAndRestore();
