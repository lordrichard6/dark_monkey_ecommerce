
import { handlePackageShipped } from '../src/lib/printful/webhook-handlers'
import { PrintfulWebhookEvent, PrintfulPackageShippedPayload } from '../src/lib/printful/types-webhooks'
import { getAdminClient } from '../src/lib/supabase/admin'

// Mock data
const MOCK_ORDER_ID = 'test-order-uuid'
const MOCK_PRINTFUL_ID = 123456789
const MOCK_TRACKING_NUMBER = 'TRACK123'
const MOCK_TRACKING_URL = 'https://tracking.carrier.com/TRACK123'
const MOCK_CARRIER = 'FedEx'

async function runTest() {
    console.log('🚀 Starting Webhook Test...')

    const supabase = getAdminClient()
    if (!supabase) {
        console.error('❌ Database client not authenticated')
        process.exit(1)
    }

    // 1. Create a dummy order for testing
    console.log('📝 Creating test order...')
    const { data: order, error: createError } = await supabase
        .from('orders')
        .insert({
            total_cents: 1000,
            status: 'paid',
            printful_order_id: MOCK_PRINTFUL_ID
        })
        .select('id')
        .single()

    if (createError || !order) {
        console.error('❌ Failed to create test order:', createError)
        process.exit(1)
    }
    console.log(`✅ Test order created: ${order.id}`)

    // 2. Simulate Webhook Payload
    const payload: PrintfulWebhookEvent<PrintfulPackageShippedPayload> = {
        type: 'package_shipped',
        created: Date.now(),
        retries: 0,
        store: 123,
        data: {
            order: {
                id: MOCK_PRINTFUL_ID,
                external_id: order.id,
                status: 'fulfilled'
            },
            shipment: {
                id: 987654,
                carrier: MOCK_CARRIER,
                service: 'Standard',
                tracking_number: MOCK_TRACKING_NUMBER,
                tracking_url: MOCK_TRACKING_URL,
                created: Date.now(),
                ship_date: new Date().toISOString(),
                shipped_at: new Date().toISOString(),
                reshipment: false
            }
        }
    }

    // 3. Run Handler
    console.log('🔄 Running webhook handler...')
    try {
        await handlePackageShipped(payload)
        console.log('✅ Handler executed successfully')
    } catch (err) {
        console.error('❌ Handler failed:', err)
        // Cleanup
        await supabase.from('orders').delete().eq('id', order.id)
        process.exit(1)
    }

    // 4. Verify Database Update
    console.log('🔍 Verifying database update...')
    const { data: updatedOrder, error: fetchError } = await supabase
        .from('orders')
        .select('status, tracking_number, tracking_url, carrier')
        .eq('id', order.id)
        .single()

    if (fetchError || !updatedOrder) {
        console.error('❌ Failed to fetch updated order:', fetchError)
    } else {
        console.table(updatedOrder)
        if (
            updatedOrder.status === 'shipped' &&
            updatedOrder.tracking_number === MOCK_TRACKING_NUMBER &&
            updatedOrder.carrier === MOCK_CARRIER
        ) {
            console.log('🎉 SUCCESS: Order updated correctly!')
        } else {
            console.error('❌ FAILURE: Order data mismatch')
        }
    }

    // 5. Cleanup
    console.log('🧹 Cleaning up...')
    await supabase.from('orders').delete().eq('id', order.id)
    console.log('Done.')
}

runTest().catch(console.error)
