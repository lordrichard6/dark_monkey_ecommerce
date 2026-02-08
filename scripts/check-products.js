const { createClient } = require('@supabase/supabase-js');

// Hardcode from .env.production manually for this test if process.env fails, 
// but try process.env first (assuming run with --env-file)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing ENV variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function listProducts() {
    console.log('Testing Supabase connection...');
    console.log('URL:', supabaseUrl);
    console.log('Key prefix:', supabaseAnonKey.substring(0, 10));

    const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, is_active, deleted_at')
        .limit(5);

    if (error) {
        console.error('Error fetching products:', error);
    } else {
        console.log('Products found:', data?.length);
        if (data && data.length > 0) {
            console.log('Sample product:', data[0]);
        } else {
            console.log('No products found');
        }
    }
}

listProducts();
