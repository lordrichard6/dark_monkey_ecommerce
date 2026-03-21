import { getAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/printful/logger'
import {
  PrintfulWebhookEvent,
  PrintfulPackageShippedPayload,
  PrintfulOrderFailedPayload,
  PrintfulOrderCanceledPayload,
} from '@/lib/printful/types-webhooks'
import { sendShipmentEmail, sendOrderCancellationEmail } from '@/lib/resend'
import { createAdminNotification } from '@/lib/admin-notifications'

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
    logger.error(
      `Could not find local order for Printful Order ${order.id} (External ID: ${order.external_id}) — shipment tracking will not be recorded`,
      { operation: 'webhook_handler', printfulOrderId: order.id, externalId: order.external_id }
    )
    await createAdminNotification({
      type: 'order',
      title: 'Shipment webhook unmatched',
      body: `Printful fired package_shipped for order ${order.id} but no matching local order was found. Tracking: ${shipment.tracking_number ?? 'N/A'}`,
      data: {
        printfulOrderId: order.id,
        externalId: order.external_id,
        tracking: shipment.tracking_number,
      },
    })
    return
  }

  const { error } = await supabase
    .from('orders')
    .update({
      status: 'shipped',
      tracking_number: shipment.tracking_number,
      tracking_url: shipment.tracking_url,
      carrier: shipment.carrier,
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

  // Notify admins (non-fatal)
  await createAdminNotification({
    type: 'order',
    title: 'Order shipped',
    body: `Order #${orderId.slice(0, 8).toUpperCase()} shipped via ${shipment.carrier ?? 'unknown carrier'}. Tracking: ${shipment.tracking_number ?? 'N/A'}`,
    data: { orderId, trackingNumber: shipment.tracking_number, carrier: shipment.carrier },
  })

  // Send shipment notification email (non-fatal if it fails)
  try {
    const { data: orderRow } = await supabase
      .from('orders')
      .select('guest_email, user_id, locale')
      .eq('id', orderId)
      .single()

    let recipientEmail: string | null = orderRow?.guest_email ?? null

    if (!recipientEmail && orderRow?.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(orderRow.user_id)
      recipientEmail = userData?.user?.email ?? null
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const locale = (orderRow as any)?.locale ?? 'en'

    if (recipientEmail) {
      const emailResult = await sendShipmentEmail({
        to: recipientEmail,
        orderId,
        trackingNumber: shipment.tracking_number ?? undefined,
        trackingUrl: shipment.tracking_url ?? undefined,
        carrier: shipment.carrier ?? undefined,
        locale,
      })
      if (!emailResult.ok) {
        logger.warn(`Shipment email failed for order ${orderId}: ${emailResult.error}`, {
          operation: 'webhook_handler',
        })
      }
    }
  } catch (emailErr) {
    logger.warn(`Error sending shipment email for order ${orderId}`, {
      operation: 'webhook_handler',
      error: emailErr instanceof Error ? emailErr.message : String(emailErr),
    })
  }
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

  // Notify admins of the Printful cancellation (non-fatal)
  await createAdminNotification({
    type: 'order',
    title: 'Order cancelled by Printful',
    body: `Printful cancelled order #${orderId.slice(0, 8).toUpperCase()}. Reason: ${reason ?? 'unknown'}`,
    data: { orderId, printfulOrderId: order.id, reason },
  })

  // Notify customer of cancellation (non-fatal)
  try {
    const { data: orderRow } = await supabase
      .from('orders')
      .select('guest_email, user_id, total_cents, currency, locale')
      .eq('id', orderId)
      .single()

    let recipientEmail: string | null = orderRow?.guest_email ?? null
    if (!recipientEmail && orderRow?.user_id) {
      const { data: userData } = await supabase.auth.admin.getUserById(orderRow.user_id)
      recipientEmail = userData?.user?.email ?? null
    }

    if (recipientEmail) {
      const emailResult = await sendOrderCancellationEmail({
        to: recipientEmail,
        orderId,
        totalCents: orderRow?.total_cents ?? 0,
        currency: orderRow?.currency ?? 'CHF',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        locale: (orderRow as any)?.locale ?? 'en',
      })
      if (!emailResult.ok) {
        logger.warn(`[order_canceled] Email failed: ${emailResult.error}`, {
          operation: 'webhook_handler',
        })
      }
    }
  } catch (emailErr) {
    logger.warn(`Error sending cancellation email for order ${orderId}`, {
      operation: 'webhook_handler',
      error: emailErr instanceof Error ? emailErr.message : String(emailErr),
    })
  }
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
