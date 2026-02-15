
import { syncOrderStatus } from '../src/actions/admin-orders-sync'
import { getAdminClient } from '../src/lib/supabase/admin'

// Mock data - needs a real order ID from DB to work, or we can mock the fetch
// For this test, we'll try to find an existing order with a printful_order_id, 
// or verify the function handles non-existent orders gracefully.

async function runTest() {
    console.log('🚀 Starting Order Sync Test...')

    const supabase = getAdminClient()
    if (!supabase) {
        console.error('❌ Database client not authenticated')
        process.exit(1)
    }

    // 1. Try to find a real order to test with
    const { data: order } = await supabase
        .from('orders')
        .select('id, printful_order_id')
        .not('printful_order_id', 'is', null)
        .limit(1)
        .single()

    let testOrderId = '00000000-0000-0000-0000-000000000000' // Non-existent ID default

    if (order) {
        console.log(`📝 Found existing order ${order.id} with Printful ID ${order.printful_order_id}`)
        testOrderId = order.id
    } else {
        console.log('⚠️ No linked orders found. Will test error handling with fake ID.')
    }

    // 2. Run Sync
    console.log(`🔄 Syncing order ${testOrderId}...`)
    try {
        const result = await syncOrderStatus(testOrderId)
        console.log('Result:', result)

        if (result.ok) {
            console.log('✅ Sync executed successfully')
        } else {
            console.log(`ℹ️ Sync returned not ok: ${result.error} (This might be expected if order doesn't exist)`)
        }

    } catch (err) {
        console.error('❌ Sync failed with exception:', err)
    }
}

runTest().catch(console.error)
