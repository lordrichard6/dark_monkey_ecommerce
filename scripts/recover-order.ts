
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { createOrder } from '../src/lib/printful';
import { getDefaultPrintFileUrl } from '../src/lib/printful';
import { logger } from '../src/lib/printful/logger';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock logger in standalone script
logger.info = console.log;
logger.error = console.error;
logger.warn = console.warn;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ORDER_ID = process.argv[2]; // Pass Order ID as arg

if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error('Supabase config missing');
if (!ORDER_ID) throw new Error('Usage: npx tsx scripts/recover-order.ts <ORDER_ID>');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log(`🚑 Attempting to Recover Order: ${ORDER_ID}`);

    // 1. Fetch Order and Items
    const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items (*)
        `)
        .eq('id', ORDER_ID)
        .single();

    if (orderErr || !order) {
        console.error('❌ Order not found:', orderErr);
        return;
    }

    if (order.printful_order_id) {
        console.log(`⚠️  Order ALREADY has Printful ID: ${order.printful_order_id}`);
        console.log('   Check Printful Dashboard > Orders > Search by this ID.');
        return;
    }

    // 2. Prepare Payload (Logic from orders.ts)
    const cartItems = order.items;
    const shippingAddressJson = order.shipping_address as any;

    // Fetch Variants for Printful IDs
    const variantIds = cartItems.map((c: any) => c.variant_id); // Note: DB column is variant_id
    const { data: variants } = await supabase
        .from('product_variants')
        .select('id, printful_variant_id, printful_sync_variant_id')
        .in('id', variantIds);

    const printfulItems: any[] = [];
    for (const item of cartItems) {
        const v = (variants ?? []).find((x) => x.id === item.variant_id);
        if (!v) {
            console.warn(`⚠️  Variant not found for item ${item.product_name}, skipping.`);
            continue;
        }

        if (v.printful_sync_variant_id != null) {
            printfulItems.push({
                sync_variant_id: v.printful_sync_variant_id,
                quantity: item.quantity,
                retail_price: (item.price_cents / 100).toFixed(2),
            });
        } else if (v.printful_variant_id != null) {
            // Catalog fallback logic
            // Note: In script we can't easily import getDefaultPrintFileUrl cleanly without full context
            // Hardcoding for recovery if needed or reusing if import works
            printfulItems.push({
                variant_id: v.printful_variant_id,
                quantity: item.quantity,
                retail_price: (item.price_cents / 100).toFixed(2),
                files: [{ url: 'https://www.dark-monkey.ch/images/print/default-print.png' }] // Fallback
            });
        }
    }

    if (printfulItems.length === 0) {
        console.error('❌ No valid Printful items found to sync.');
        return;
    }

    // 3. Create Draft Order (Strict Mode)
    console.log(`📦 Sending ${printfulItems.length} items to Printful (DRAFT Mode)...`);

    const recipient = {
        name: shippingAddressJson.name || 'Customer',
        address1: shippingAddressJson.address.line1,
        city: shippingAddressJson.address.city,
        state_code: shippingAddressJson.address.state || undefined,
        country_code: shippingAddressJson.address.country,
        zip: shippingAddressJson.address.postalCode,
        email: order.user_email || undefined,
    };

    const pfResult = await createOrder({
        recipient,
        items: printfulItems,
        external_id: order.id.replace(/-/g, ''), // Match format
    }, false); // DRAFT

    if (pfResult.ok && pfResult.printfulOrderId) {
        console.log(`✅ SUCCESS! Recovered Order ID: ${pfResult.printfulOrderId}`);

        // Update DB
        const { error: updError } = await supabase
            .from('orders')
            .update({ printful_order_id: pfResult.printfulOrderId })
            .eq('id', order.id);

        if (updError) console.error('❌ DB Update Failed:', updError);
        else console.log('✅ Database updated with Printful ID.');

    } else {
        console.error('❌ Recovery Failed:', pfResult.error);
    }
}

main().catch(console.error);
