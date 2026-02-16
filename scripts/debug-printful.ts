
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const TOKEN = process.env.PRINTFUL_API_TOKEN!;

if (!TOKEN) {
    throw new Error('❌ PRINTFUL_API_TOKEN is missing from .env.local');
}

const API_BASE = 'https://api.printful.com';

async function main() {
    console.log('🔍 Starting Printful Diagnostic...');
    console.log(`🔑 Token found (length: ${TOKEN.length})`);

    // 1. Get Store Info
    console.log('\n--- 🏪 Checking Stores ---');
    try {
        const res = await fetch(`${API_BASE}/stores`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();

        if (res.status === 200) {
            console.log('✅ Stores retrieved successfully:');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.result.forEach((store: any) => {
                console.log(`   - ID: ${store.id} | Name: "${store.name}" | Type: ${store.type} | URL: ${store.website}`);
            });

            if (data.result.length > 1) {
                console.warn('⚠️  MULTIPLE STORES FOUND. You SHOULD set PRINTFUL_STORE_ID in .env.local to target the correct one.');
            }
        } else {
            console.error('❌ Failed to fetch stores:', data);
        }
    } catch (e) {
        console.error('❌ Network error fetching stores:', e);
    }

    // 2. Fetch Sync Products to get a valid Variant ID
    console.log('\n--- 👕 Fetching Products for Test ---');
    let testVariantId = null;
    try {
        const res = await fetch(`${API_BASE}/store/products`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();
        if (res.status === 200 && data.result?.length > 0) {
            const productId = data.result[0].id;
            console.log(`   Found Product: ${data.result[0].name} (ID: ${productId})`);

            // Get variants for this product
            const vRes = await fetch(`${API_BASE}/store/products/${productId}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const vData = await vRes.json();
            if (vData.result?.sync_variants?.length > 0) {
                testVariantId = vData.result.sync_variants[0].id;
                console.log(`   Selected Test Variant ID: ${testVariantId} (${vData.result.sync_variants[0].name})`);
            }
        }
    } catch (e) { console.error('Error fetching products:', e); }

    if (!testVariantId) {
        console.error('❌ Could not find a valid variant ID to test order creation.');
        return;
    }

    // 3. Try Create Draft Order (Swiss Address)
    console.log('\n--- 📝 Attempting DRAFT Order Creation (CH Address) ---');
    const draftPayload = {
        recipient: {
            name: "Test User CH",
            address1: "Bahnhofstrasse 1",
            city: "Zurich",
            country_code: "CH",
            zip: "8001",
            email: "test_ch@example.com"
        },
        items: [
            {
                sync_variant_id: testVariantId,
                quantity: 1,
                retail_price: "20.00"
            }
        ],
        confirm: 0 // Draft
    };

    console.log('Sending Payload:', JSON.stringify(draftPayload, null, 2));

    try {
        const res = await fetch(`${API_BASE}/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(draftPayload)
        });
        const data = await res.json();

        if (res.status === 200 || res.status === 201) {
            console.log('✅ SUCCESS! Draft Order Created.');
            console.log(`   Order ID: ${data.result.id}`);
            console.log('   Go to Printful Dashboard > Orders > DRAFTS to see it.');
        } else {
            console.error('❌ FAILED to create draft order.');
            console.error('   Status:', res.status);
            console.error('   Error:', JSON.stringify(data, null, 2));
        }
    } catch (e) {
        console.error('❌ Network exception creating order:', e);
    }
}

main().catch(console.error);
