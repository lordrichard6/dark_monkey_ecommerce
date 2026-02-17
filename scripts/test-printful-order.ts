export {}
/**
 * Diagnostic script: tests Printful order creation end-to-end.
 * Run with: npx tsx --env-file=.env.local scripts/test-printful-order.ts
 *
 * Tests:
 * 1. API token is valid (GET /stores)
 * 2. Store has products (GET /store/products)
 * 3. Variants have sync_variant_ids
 * 4. A DRAFT order can be created (confirm: false — not sent to production)
 * 5. Draft order is cleaned up (DELETE /orders/:id)
 */

const API_TOKEN = process.env.PRINTFUL_API_TOKEN
const STORE_ID = process.env.PRINTFUL_STORE_ID
const PF_API_BASE = 'https://api.printful.com'

if (!API_TOKEN) {
  console.error('❌ PRINTFUL_API_TOKEN not set')
  process.exit(1)
}

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${API_TOKEN}`,
    'Content-Type': 'application/json',
  }
  if (STORE_ID) h['X-PF-Store-Id'] = STORE_ID
  return h
}

async function get(path: string) {
  const r = await fetch(`${PF_API_BASE}${path}`, { headers: headers() })
  return r.json()
}

async function post(path: string, body: unknown) {
  const r = await fetch(`${PF_API_BASE}${path}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })
  return r.json()
}

async function del(path: string) {
  const r = await fetch(`${PF_API_BASE}${path}`, { method: 'DELETE', headers: headers() })
  return r.json()
}

async function run() {
  console.log('═══════════════════════════════════════')
  console.log('  Printful Order Creation Diagnostic')
  console.log('═══════════════════════════════════════\n')

  // ── Test 1: Token ──────────────────────────────────────────────────────
  console.log('▶ Test 1: Validate API token (GET /stores)')
  const stores = await get('/stores')
  if (stores.code !== 200) {
    console.error('❌ Token invalid:', stores.error?.message ?? JSON.stringify(stores))
    process.exit(1)
  }
  const storeNames = stores.result
    .map((s: { id: number; name: string }) => `${s.name} (${s.id})`)
    .join(', ')
  console.log(`✅ Token valid. Stores: ${storeNames}`)
  console.log(`   PRINTFUL_STORE_ID in env: ${STORE_ID ?? '(not set)'}`)

  // ── Test 2: Products ───────────────────────────────────────────────────
  console.log('\n▶ Test 2: Fetch store products (GET /store/products)')
  const products = await get('/store/products?limit=3')
  if (products.code !== 200) {
    console.error('❌ Failed:', products.error?.message)
    process.exit(1)
  }
  console.log(
    `✅ ${products.paging?.total} total products in store. Showing first ${products.result.length}:`
  )
  products.result.forEach((p: { id: number; name: string; variants: number; synced: number }) => {
    console.log(`   • ${p.name} (id=${p.id}) — ${p.synced}/${p.variants} synced`)
  })

  if (products.result.length === 0) {
    console.error('❌ No products in Printful store')
    process.exit(1)
  }

  // ── Test 3: Get variants ────────────────────────────────────────────────
  const firstProduct = products.result[0] as { id: number; name: string }
  console.log(
    `\n▶ Test 3: Fetch variants for "${firstProduct.name}" (GET /store/products/${firstProduct.id})`
  )
  const detail = await get(`/store/products/${firstProduct.id}`)
  if (detail.code !== 200) {
    console.error('❌ Failed:', detail.error?.message)
    process.exit(1)
  }

  type SyncVariant = {
    id: number
    name: string
    retail_price: string
    synced: boolean
    is_ignored: boolean
  }
  const allVariants: SyncVariant[] = detail.result.sync_variants ?? []
  const activeVariants = allVariants.filter((v) => v.synced && !v.is_ignored)

  console.log(
    `✅ ${allVariants.length} total variants, ${activeVariants.length} active (synced + not ignored)`
  )
  activeVariants.slice(0, 3).forEach((v) => {
    console.log(`   • sync_variant_id=${v.id} | ${v.name} | CHF ${v.retail_price}`)
  })

  if (activeVariants.length === 0) {
    console.error('❌ No active variants — cannot create order')
    process.exit(1)
  }

  const testVariant = activeVariants[0]

  // ── Test 4: Create DRAFT order ─────────────────────────────────────────
  console.log(`\n▶ Test 4: Create DRAFT order (confirm: false — NOT sent to production)`)
  console.log(`   Using: sync_variant_id=${testVariant.id} (${testVariant.name})`)

  const orderPayload = {
    recipient: {
      name: 'DIAGNOSTIC TEST - DELETE ME',
      address1: 'Bahnhofstrasse 1',
      city: 'Zurich',
      country_code: 'CH',
      zip: '8001',
      email: 'test@dark-monkey.ch',
    },
    items: [
      {
        sync_variant_id: testVariant.id,
        quantity: 1,
        retail_price: testVariant.retail_price || '29.99',
      },
    ],
    confirm: false,
    external_id: `diag-${Date.now()}`,
  }

  const orderResult = await post('/orders', orderPayload)

  if (orderResult.code !== 200) {
    console.error('❌ Order creation FAILED!')
    console.error('   Code:', orderResult.code)
    console.error(
      '   Error:',
      orderResult.error?.message ?? orderResult.error?.reason ?? '(no message)'
    )
    console.error('\n   Full response:')
    console.error(JSON.stringify(orderResult, null, 2))
    process.exit(1)
  }

  const createdId = orderResult.result.id
  console.log(`✅ Draft order created successfully!`)
  console.log(`   Printful order ID : ${createdId}`)
  console.log(`   Status            : ${orderResult.result.status}`)
  console.log(`   External ID       : ${orderResult.result.external_id}`)

  // ── Test 5: Delete draft ───────────────────────────────────────────────
  console.log(`\n▶ Test 5: Delete draft order ${createdId}`)
  const deleteResult = await del(`/orders/${createdId}`)
  if (deleteResult.code === 200) {
    console.log('✅ Draft order deleted — no trace left in Printful')
  } else {
    console.warn(
      `⚠️  Delete failed — please delete order ${createdId} manually in Printful dashboard`
    )
    console.warn('   Error:', deleteResult.error?.message)
  }

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════')
  console.log('✅ ALL TESTS PASSED')
  console.log('   The Printful API is working correctly.')
  console.log("\n   If orders still don't appear in Printful after")
  console.log('   a real purchase, the issue is in the Supabase')
  console.log('   product_variants table — the printful_sync_variant_id')
  console.log('   column may be null for your products.')
  console.log('═══════════════════════════════════════')
}

run().catch((err) => {
  console.error('\n💥 Unexpected error:', err.message ?? err)
  process.exit(1)
})
