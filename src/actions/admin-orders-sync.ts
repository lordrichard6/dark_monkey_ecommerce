'use server'

import { getAdminClient } from '@/lib/supabase/admin'
import { fetchStoreOrder, confirmPrintfulOrder } from '@/lib/printful'
import { logger } from '@/lib/printful/logger'

/**
 * Confirms a Printful draft order for fulfillment.
 *
 * Flow:
 *   draft → (this action) → pending → inprocess → fulfilled → (webhook) → shipped
 *
 * This commits the order to production — Printful will charge you and begin production.
 * Only call this when you are genuinely ready to fulfill.
 */
export async function confirmOrderWithPrintful(orderId: string): Promise<{
  ok: boolean
  printfulStatus?: string
  error?: string
}> {
  const supabase = getAdminClient()
  if (!supabase) return { ok: false, error: 'Database client not authenticated' }

  // 1. Fetch the local order to get the Printful order ID
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, printful_order_id, status')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    return { ok: false, error: 'Order not found' }
  }

  if (!order.printful_order_id) {
    return {
      ok: false,
      error:
        'No Printful order linked to this order. The order may not have been submitted to Printful yet.',
    }
  }

  // 2. First, fetch current Printful status to make sure it's still a draft
  const {
    ok: fetchOk,
    order: printfulOrder,
    error: pfFetchError,
  } = await fetchStoreOrder(order.printful_order_id)

  if (!fetchOk || !printfulOrder) {
    return {
      ok: false,
      error: pfFetchError
        ? `Could not fetch Printful order: ${pfFetchError}`
        : `Printful order #${order.printful_order_id} not found`,
    }
  }

  const currentPrintfulStatus: string = printfulOrder.status ?? 'unknown'

  // Only draft orders can be confirmed
  if (currentPrintfulStatus !== 'draft') {
    return {
      ok: false,
      printfulStatus: currentPrintfulStatus,
      error: `Order is already "${currentPrintfulStatus}" on Printful — only draft orders can be confirmed. Use "Sync Printful" to refresh the local status.`,
    }
  }

  // 3. Confirm the order with Printful
  logger.info(`Confirming Printful order ${order.printful_order_id}`, {
    operation: 'confirmOrderWithPrintful',
  })

  const {
    ok: confirmOk,
    status: newPrintfulStatus,
    error: confirmError,
  } = await confirmPrintfulOrder(order.printful_order_id)

  if (!confirmOk) {
    logger.error(`Failed to confirm Printful order ${order.printful_order_id}`, {
      operation: 'confirmOrderWithPrintful',
      error: confirmError,
    })
    return { ok: false, error: confirmError ?? 'Printful confirmation failed' }
  }

  // 4. Update local order status to 'processing' (Printful has accepted it)
  const { error: updateError } = await supabase
    .from('orders')
    .update({ status: 'processing' })
    .eq('id', orderId)

  if (updateError) {
    // Non-fatal: Printful has the order, we just couldn't update locally
    logger.error(`Failed to update local order status after Printful confirm`, {
      operation: 'confirmOrderWithPrintful',
      error: updateError.message,
    })
    // Still return ok — the Printful side succeeded
    return {
      ok: true,
      printfulStatus: newPrintfulStatus,
      error: `Confirmed on Printful but failed to update local status: ${updateError.message}`,
    }
  }

  logger.info(`Order ${orderId} confirmed with Printful, local status → processing`, {
    operation: 'confirmOrderWithPrintful',
    printfulStatus: newPrintfulStatus,
  })

  return { ok: true, printfulStatus: newPrintfulStatus }
}

// Printful statuses that map to our statuses.
// We ONLY update our status when Printful's status is definitive.
// 'pending', 'onhold', 'inprocess', 'partial', 'draft', 'failed' → no status change
// 'fulfilled' → shipped
// 'canceled'  → cancelled
const PRINTFUL_STATUS_MAP: Record<string, string> = {
  fulfilled: 'shipped',
  canceled: 'cancelled',
}

// Statuses we should NEVER overwrite with a sync — these are terminal
const TERMINAL_STATUSES = ['delivered', 'cancelled', 'refunded']

/**
 * Syncs the status of a local order with Printful.
 * Returns the Printful status in the response for transparency/debugging.
 *
 * Safety rules:
 * 1. We never downgrade a status (e.g. delivered → shipped)
 * 2. We never overwrite terminal statuses (delivered, cancelled, refunded)
 * 3. We only set status to 'shipped' if Printful confirms 'fulfilled'
 * 4. Shipment data (tracking) is synced independently of status
 */
export async function syncOrderStatus(orderId: string): Promise<{
  ok: boolean
  updated?: boolean
  updates?: Record<string, unknown>
  printfulStatus?: string
  printfulOrderId?: number
  error?: string
}> {
  const supabase = getAdminClient()
  if (!supabase) throw new Error('Database client not authenticated')

  // 1. Fetch local order
  const { data: order, error: fetchError } = await supabase
    .from('orders')
    .select('id, printful_order_id, status, tracking_number')
    .eq('id', orderId)
    .single()

  if (fetchError || !order) {
    logger.error(`Could not find order ${orderId}`, {
      operation: 'syncOrderStatus',
      error: fetchError?.message,
    })
    return { ok: false, error: 'Order not found' }
  }

  if (!order.printful_order_id) {
    logger.warn(`Order ${orderId} has no printful_order_id`, { operation: 'syncOrderStatus' })
    return { ok: false, error: 'This order has no linked Printful order ID' }
  }

  // 2. Fetch latest from Printful
  const {
    ok,
    order: printfulOrder,
    error: printfulError,
  } = await fetchStoreOrder(order.printful_order_id)

  if (!ok || !printfulOrder) {
    logger.error(`Failed to fetch Printful order ${order.printful_order_id}`, {
      operation: 'syncOrderStatus',
      error: printfulError,
    })
    return {
      ok: false,
      printfulOrderId: order.printful_order_id,
      error: printfulError
        ? `Printful API error: ${printfulError}`
        : `Could not find order #${order.printful_order_id} in Printful. The order may not have been submitted yet.`,
    }
  }

  const printfulStatus: string = printfulOrder.status ?? 'unknown'

  logger.info(`Printful order ${order.printful_order_id} status: ${printfulStatus}`, {
    operation: 'syncOrderStatus',
    localStatus: order.status,
    printfulStatus,
  })

  // 3. Map status — only update if Printful gives us a definitive status
  let newStatus = order.status

  // Don't touch terminal statuses
  if (TERMINAL_STATUSES.includes(order.status)) {
    logger.info(`Order ${orderId} has terminal status "${order.status}", skipping status update`, {
      operation: 'syncOrderStatus',
    })
    // Still sync tracking below
  } else {
    const mappedStatus = PRINTFUL_STATUS_MAP[printfulStatus]
    if (mappedStatus) {
      newStatus = mappedStatus
    }
    // For any other Printful status ('pending', 'inprocess', 'onhold', 'partial', 'draft', 'failed')
    // we do NOT change our local status — the order is in flight on Printful's end
  }

  // 4. Sync tracking info ONLY from verified shipments
  // Do NOT use shipment existence alone to infer 'shipped' status
  let trackingNumber = order.tracking_number
  let trackingUrl: string | null = null
  let carrier: string | null = null

  if (printfulOrder.shipments && printfulOrder.shipments.length > 0) {
    // Only use the latest shipment if it actually has a tracking number
    const latestShipment = printfulOrder.shipments[printfulOrder.shipments.length - 1]
    if (latestShipment.tracking_number) {
      trackingNumber = latestShipment.tracking_number
      trackingUrl = latestShipment.tracking_url ?? null
      carrier = latestShipment.carrier ?? null
    }
  }

  // 5. Build update payload — only include fields that actually changed
  const updates: Record<string, unknown> = {}
  if (newStatus !== order.status) updates.status = newStatus
  if (trackingNumber !== order.tracking_number) updates.tracking_number = trackingNumber
  if (trackingUrl) updates.tracking_url = trackingUrl
  if (carrier) updates.carrier = carrier

  if (Object.keys(updates).length === 0) {
    return { ok: true, updated: false, printfulStatus, printfulOrderId: order.printful_order_id }
  }

  // 6. Persist
  const { error: updateError } = await supabase.from('orders').update(updates).eq('id', orderId)

  if (updateError) {
    logger.error(`Failed to update order ${orderId}`, {
      operation: 'syncOrderStatus',
      error: updateError.message,
    })
    return { ok: false, printfulStatus, error: updateError.message }
  }

  logger.info(`Updated order ${orderId}`, { operation: 'syncOrderStatus', changes: updates })
  return {
    ok: true,
    updated: true,
    updates,
    printfulStatus,
    printfulOrderId: order.printful_order_id,
  }
}
