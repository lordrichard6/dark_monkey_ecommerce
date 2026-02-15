'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { fetchStoreOrder } from '@/lib/printful'
import { logger } from '@/lib/printful/logger'

/**
 * Syncs the status of a local order with Printful.
 * @param orderId The internal UUID of the order in our database.
 */
export async function syncOrderStatus(orderId: string) {
    const supabase = getAdminClient()
    if (!supabase) throw new Error('Database client not authenticated')

    // 1. Fetch local order to get printful_order_id
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('id, printful_order_id, status, tracking_number')
        .eq('id', orderId)
        .single()

    if (fetchError || !order) {
        logger.error(`Could not find order ${orderId}`, { operation: 'syncOrderStatus', error: fetchError?.message })
        return { ok: false, error: 'Order not found' }
    }

    if (!order.printful_order_id) {
        logger.warn(`Order ${orderId} has no printful_order_id`, { operation: 'syncOrderStatus' })
        return { ok: false, error: 'Not a linked Printful order' }
    }

    // 2. Fetch latest status from Printful
    const { ok, order: printfulOrder, error: printfulError } = await fetchStoreOrder(order.printful_order_id)

    if (!ok || !printfulOrder) {
        logger.error(`Failed to fetch Printful order ${order.printful_order_id}`, { operation: 'syncOrderStatus', error: printfulError })
        return { ok: false, error: printfulError || 'Failed to fetch from Printful' }
    }

    // 3. Map status and shipments
    // Printful statuses: 'draft', 'failed', 'pending', 'canceled', 'onhold', 'inprocess', 'partial', 'fulfilled'
    let newStatus = order.status
    let trackingNumber = order.tracking_number
    let trackingUrl = null
    let carrier = null

    // Determine status
    if (printfulOrder.status === 'fulfilled') {
        newStatus = 'shipped' // Map 'fulfilled' -> 'shipped' in our system
    } else if (printfulOrder.status === 'canceled') {
        newStatus = 'cancelled'
    }

    // Check shipments for tracking info
    // Printful order object has `shipments` array
    if (printfulOrder.shipments && printfulOrder.shipments.length > 0) {
        // Use the latest shipment
        const latestShipment = printfulOrder.shipments[printfulOrder.shipments.length - 1]
        trackingNumber = latestShipment.tracking_number
        trackingUrl = latestShipment.tracking_url
        carrier = latestShipment.carrier

        // If we have shipment info, we can assume it's shipped/fulfilled
        if (newStatus !== 'shipped' && newStatus !== 'delivered') {
            newStatus = 'shipped'
        }
    }

    // 4. Update database if changed
    const updates: any = {}
    if (newStatus !== order.status) updates.status = newStatus
    if (trackingNumber !== order.tracking_number) updates.tracking_number = trackingNumber
    if (trackingUrl) updates.tracking_url = trackingUrl
    if (carrier) updates.carrier = carrier

    if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
            .from('orders')
            .update(updates)
            .eq('id', orderId)

        if (updateError) {
            logger.error(`Failed to update order ${orderId}`, { operation: 'syncOrderStatus', error: updateError.message })
            return { ok: false, error: updateError.message }
        }

        logger.info(`Updated order ${orderId} status to ${newStatus}`, { operation: 'syncOrderStatus', changes: updates })
        return { ok: true, updated: true, updates }
    }

    return { ok: true, updated: false }
}
