
import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Mock printful config for standalone execution
const PRINTFUL_API_TOKEN = process.env.PRINTFUL_API_TOKEN;
const PRINTFUL_STORE_ID = process.env.PRINTFUL_STORE_ID;
const API_BASE = 'https://api.printful.com';

if (!PRINTFUL_API_TOKEN) throw new Error('PRINTFUL_API_TOKEN missing');

async function fetchStoreProducts(offset = 0, limit = 20) {
    const url = `${API_BASE}/store/products?offset=${offset}&limit=${limit}`;
    const headers: any = { 'Authorization': `Bearer ${PRINTFUL_API_TOKEN}` };
    if (PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = PRINTFUL_STORE_ID;

    console.log(`📡 Fetching: ${url}`);
    const start = Date.now();
    const res = await fetch(url, { headers });
    const duration = Date.now() - start;
    console.log(`   Took: ${duration}ms | Status: ${res.status}`);
    return res.json();
}

async function fetchSyncProduct(id: number) {
    const url = `${API_BASE}/store/products/${id}`;
    const headers: any = { 'Authorization': `Bearer ${PRINTFUL_API_TOKEN}` };
    if (PRINTFUL_STORE_ID) headers['X-PF-Store-Id'] = PRINTFUL_STORE_ID;

    console.log(`📡 Fetching Detail: ${url}`);
    const start = Date.now();
    const res = await fetch(url, { headers });
    const duration = Date.now() - start;
    console.log(`   Took: ${duration}ms | Status: ${res.status}`);
    return res.json();
}

async function main() {
    console.log('⏱️  Starting Sync Performance Test...');
    console.log(`Store ID Configured: ${PRINTFUL_STORE_ID || 'NO (Might match wrong store)'}`);

    // 1. List Products
    const listData = await fetchStoreProducts(0, 5); // Just 5 for test
    if (listData.code !== 200) {
        console.error('❌ Failed to list products:', listData);
        return;
    }

    const products = listData.result;
    console.log(`\n✅ Found ${products.length} products (Total in store: ${listData.paging?.total})`);

    // 2. Detail Fetch Test (Simulate Sync Loop)
    console.log('\n🔄 Testing Detail Fetch Loop (Sequential)...');
    const loopStart = Date.now();

    for (const p of products) {
        await fetchSyncProduct(p.id);
        // Simulate small processing time
        await new Promise(r => setTimeout(r, 10));
    }

    const loopDuration = Date.now() - loopStart;
    console.log(`\n🏁 Loop Finished in ${(loopDuration / 1000).toFixed(2)}s`);
    console.log(`   Avg per product: ${(loopDuration / products.length).toFixed(0)}ms`);

    // Projection
    const total = listData.paging?.total || 0;
    const estimatedTotalSeconds = (loopDuration / products.length) * total / 1000;
    console.log(`\n📉 PROJECTION for ${total} products:`);
    console.log(`   ~${(estimatedTotalSeconds / 60).toFixed(1)} minutes (API Only)`);
    console.log('   + Image Processing & DB Upserts (likely 2-3x slower)');

    if (estimatedTotalSeconds > 60) {
        console.warn('⚠️  WARNING: Sync WILL timeout on Vercel (10-60s limit).');
        console.warn('   RECOMMENDATION: Use pagination or background jobs.');
    }
}

main().catch(console.error);
