import { NextRequest, NextResponse } from 'next/server'
import { verifyPrintfulWebhook } from '@/lib/printful/webhook-verify'
import { PRINTFUL_CONFIG } from '@/lib/printful/config'
import { logger } from '@/lib/printful/logger'
import { handleWebhookEvent } from '@/lib/printful/webhook-handlers'

/**
 * POST /api/webhooks/printful
 *
 * Receives webhook events from Printful (package_shipped, order_failed, order_canceled).
 *
 * Authentication: Printful API v1 does not sign webhook requests (no x-printful-signature).
 * We verify the `store` field in the payload matches our PRINTFUL_STORE_ID.
 *
 * Webhook registration was done via:
 *   POST https://api.printful.com/webhooks
 *   { url: "https://www.dark-monkey.ch/api/webhooks/printful", types: [...] }
 */
export async function POST(request: NextRequest) {
  const body = await request.text()

  // Parse JSON first — we need the store ID before anything else
  let event: {
    type?: string
    store?: number
    created?: number
    retries?: number
    data?: unknown
  }
  try {
    event = JSON.parse(body)
  } catch {
    logger.warn('Webhook received with invalid JSON body', { operation: 'webhook' })
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Verify the payload belongs to our store
  const expectedStoreId = PRINTFUL_CONFIG?.PRINTFUL_STORE_ID
  if (!verifyPrintfulWebhook(event.store, expectedStoreId)) {
    logger.warn('Webhook store ID mismatch — possible unauthorized request', {
      operation: 'webhook',
      receivedStore: event.store,
      expectedStore: expectedStoreId ?? '(not configured)',
    })
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  logger.info('Printful Webhook Received', {
    operation: 'webhook',
    type: event.type,
    created: event.created,
    store: event.store,
    retries: event.retries,
  })

  try {
    if (event.type) {
      await handleWebhookEvent(event as Parameters<typeof handleWebhookEvent>[0])
    } else {
      logger.warn('Webhook received with no event type', { operation: 'webhook' })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    logger.error('Error processing webhook payload', {
      operation: 'webhook',
      type: event.type,
      error: err instanceof Error ? err.message : 'Unknown',
    })
    return NextResponse.json({ error: 'Processing error' }, { status: 500 })
  }
}
