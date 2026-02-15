import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/printful/logger'
import {
    PrintfulWebhookEvent,
    PrintfulPackageShippedPayload,
    PrintfulOrderFailedPayload,
    PrintfulOrderCanceledPayload
} from '@/lib/printful/types-webhooks'

/**
 * Handles the 'package_shipped' event from Printful.
 * Updates the order status, tracking number, and tracking URL in the database.
 */
export async function handlePackageShipped(event: PrintfulWebhookEvent<PrintfulPackageShippedPayload>) {
    const { order, shipment } = event.data
    const supabase = getAdminClient()

    if (!supabase) {
        throw new Error('Database client not authenticated')
    }

    logger.info(`Processing package_shipped for Printful Order ${order.id}`, {
        operation: 'webhook_handler',
        tracking: shipment.tracking_number,
        carrier: shipment.carrier
    })

    // We can try to find the order by Printful ID first, if we stored it
    // Or by external_id if that corresponds to our UUID (check how we create orders)

    // Strategy:
    // 1. Try to find by `printful_order_id`
    // 2. Try to find by `id` (if external_id is our UUID)

    let orderId: string | null = null

    // Try finding by printful_order_id
    const { data: byPrintfulId } = await supabase
        .from('orders')
        .select('id')
        .eq('printful_order_id', order.id)
        .single()

    if (byPrintfulId) {
        orderId = byPrintfulId.id
    } else if (order.external_id) {
        // Validate if external_id is a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order.external_id)
        if (isUuid) {
            orderId = order.external_id
        }
    }

    if (!orderId) {
        logger.warn(`Could not find local order for Printful Order ${order.id} (External ID: ${order.external_id})`, { operation: 'webhook_handler' })
        return
    }

    // Update the order
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'shipped', // or 'delivered' if we want to differentiate? Printful sends 'package_shipped'
            tracking_number: shipment.tracking_number,
            tracking_url: shipment.tracking_url,
            carrier: shipment.carrier,
            // We might want to store printful_order_id if it wasn't there
            printful_order_id: order.id
        })
        .eq('id', orderId)

    if (error) {
        logger.error(`Failed to update order ${orderId} with tracking info`, { operation: 'webhook_handler', error: error.message })
        throw error
    }

    logger.info(`Successfully updated order ${orderId} to 'shipped'`, { operation: 'webhook_handler' })
}

/**
 * Main dispatcher for webhook events
 */
export async function handleWebhookEvent(event: PrintfulWebhookEvent) {
    switch (event.type) {
        case 'package_shipped':
            await handlePackageShipped(event as PrintfulWebhookEvent<PrintfulPackageShippedPayload>)
            break
        // TODO: Handle other events like 'order_failed', 'order_canceled'
        default:
            logger.info(`Ignored webhook event type: ${event.type}`, { operation: 'webhook_handler' })
    }
}
