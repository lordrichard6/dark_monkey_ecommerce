
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('❌ Supabase credentials missing from .env.local');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('🔍 Checking Last Order in Supabase...');

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('❌ Error fetching order:', error);
        return;
    }

    if (!orders || orders.length === 0) {
        console.log('⚠️ No orders found in database.');
        return;
    }

    const order = orders[0];
    console.log(`\n📦 Last Order: ${order.id}`);
    console.log(`   Created At: ${new Date(order.created_at).toLocaleString()}`);
    console.log(`   Customer: ${order.shipping_address?.name || 'N/A'}`);
    console.log(`   Email: ${order.user_email || 'N/A'}`);
    console.log(`   Total: ${(order.total_amount_cents / 100).toFixed(2)} ${order.currency}`);
    console.log(`   Payment Status: ${order.payment_status}`);
    console.log(`   Printful Order ID: ${order.printful_order_id || '❌ MISSING (Not synced to Printful)'}`);

    if (!order.printful_order_id) {
        console.log('\n⚠️  POSSIBLE CAUSES for Missing Printful ID:');
        console.log('   1. Webhook processing failed (check Vercel logs).');
        console.log('   2. Printful API rejected payload (check debug-printful.ts output).');
        console.log('   3. "Draft" creation succeeded but DB update failed (unlikely).');
    }
}

main().catch(console.error);
