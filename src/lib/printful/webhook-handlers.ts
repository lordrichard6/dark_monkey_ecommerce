import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/printful/logger'
import {
  PrintfulWebhookEvent,
  PrintfulPackageShippedPayload,
  PrintfulOrderFailedPayload,
  PrintfulOrderCanceledPayload,
} from '@/lib/printful/types-webhooks'

/**
 * Handles the 'package_shipped' event from Printful.
 * Updates the order status, tracking number, and tracking URL in the database.
 */
export async function handlePackageShipped(
  event: PrintfulWebhookEvent<PrintfulPackageShippedPayload>
) {
  const { order, shipment } = event.data
  const supabase = getAdminClient()

  if (!supabase) {
    throw new Error('Database client not authenticated')
  }

  logger.info(`Processing package_shipped for Printful Order ${order.id}`, {
    operation: 'webhook_handler',
    tracking: shipment.tracking_number,
    carrier: shipment.carrier,
  })

  const orderId = await resolveLocalOrderId(supabase, order.id, order.external_id)
  if (!orderId) {
    logger.warn(
      `Could not find local order for Printful Order ${order.id} (External ID: ${order.external_id})`,
      { operation: 'webhook_handler' }
    )
    return
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'shipped', // or 'delivered' if we want to differentiate? Printful sends 'package_shipped'
      tracking_number: shipment.tracking_number,
      tracking_url: shipment.tracking_url,
      carrier: shipment.carrier,
      // We might want to store printful_order_id if it wasn't there
      printful_order_id: order.id,
    })
    .eq('id', orderId)

  if (error) {
    logger.error(`Failed to update order ${orderId} with tracking info`, {
      operation: 'webhook_handler',
      error: error.message,
    })
    throw error
  }

  logger.info(`Successfully updated order ${orderId} to 'shipped'`, {
    operation: 'webhook_handler',
  })
}

/**
 * Resolves a local Supabase order UUID from a Printful order payload.
 * Tries printful_order_id first, then falls back to external_id if it's a valid UUID.
 */
async function resolveLocalOrderId(
  supabase: ReturnType<typeof getAdminClient>,
  printfulOrderId: number,
  externalId: string | undefined
): Promise<string | null> {
  const { data: byPrintfulId } = await supabase!
    .from('orders')
    .select('id')
    .eq('printful_order_id', printfulOrderId)
    .single()

  if (byPrintfulId) return byPrintfulId.id

  if (externalId) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      externalId
    )
    if (isUuid) return externalId
  }

  return null
}

/**
 * Handles the 'order_failed' event from Printful.
 * Marks the local order as 'fulfillment_failed' so support can investigate and refund if needed.
 */
export async function handleOrderFailed(event: PrintfulWebhookEvent<PrintfulOrderFailedPayload>) {
  const { order, reason } = event.data
  const supabase = getAdminClient()

  if (!supabase) throw new Error('Database client not authenticated')

  logger.warn(`Printful order_failed for Printful Order ${order.id}. Reason: ${reason}`, {
    operation: 'webhook_handler',
    printfulOrderId: order.id,
    externalId: order.external_id,
    reason,
  })

  const orderId = await resolveLocalOrderId(supabase, order.id, order.external_id)
  if (!orderId) {
    logger.warn(`Could not find local order for failed Printful Order ${order.id}`, {
      operation: 'webhook_handler',
    })
    return
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'fulfillment_failed' })
    .eq('id', orderId)

  if (error) {
    logger.error(`Failed to update order ${orderId} to fulfillment_failed`, {
      operation: 'webhook_handler',
      error: error.message,
    })
    throw error
  }

  logger.info(`Order ${orderId} marked as 'fulfillment_failed' (Printful reason: ${reason})`, {
    operation: 'webhook_handler',
  })
}

/**
 * Handles the 'order_canceled' event from Printful.
 * Marks the local order as 'fulfillment_canceled' so admin can issue a refund.
 */
export async function handleOrderCanceled(
  event: PrintfulWebhookEvent<PrintfulOrderCanceledPayload>
) {
  const { order, reason } = event.data
  const supabase = getAdminClient()

  if (!supabase) throw new Error('Database client not authenticated')

  logger.warn(`Printful order_canceled for Printful Order ${order.id}. Reason: ${reason}`, {
    operation: 'webhook_handler',
    printfulOrderId: order.id,
    externalId: order.external_id,
    reason,
  })

  const orderId = await resolveLocalOrderId(supabase, order.id, order.external_id)
  if (!orderId) {
    logger.warn(`Could not find local order for canceled Printful Order ${order.id}`, {
      operation: 'webhook_handler',
    })
    return
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'fulfillment_canceled' })
    .eq('id', orderId)

  if (error) {
    logger.error(`Failed to update order ${orderId} to fulfillment_canceled`, {
      operation: 'webhook_handler',
      error: error.message,
    })
    throw error
  }

  logger.info(`Order ${orderId} marked as 'fulfillment_canceled' (Printful reason: ${reason})`, {
    operation: 'webhook_handler',
  })
}

/**
 * Main dispatcher for Printful webhook events.
 */
export async function handleWebhookEvent(event: PrintfulWebhookEvent) {
  switch (event.type) {
    case 'package_shipped':
      await handlePackageShipped(event as PrintfulWebhookEvent<PrintfulPackageShippedPayload>)
      break
    case 'order_failed':
      await handleOrderFailed(event as PrintfulWebhookEvent<PrintfulOrderFailedPayload>)
      break
    case 'order_canceled':
      await handleOrderCanceled(event as PrintfulWebhookEvent<PrintfulOrderCanceledPayload>)
      break
    default:
      logger.info(`Ignored webhook event type: ${event.type}`, { operation: 'webhook_handler' })
  }
}
