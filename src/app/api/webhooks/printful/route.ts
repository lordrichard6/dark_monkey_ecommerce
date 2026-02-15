import { NextRequest, NextResponse } from 'next/server'
import { verifyPrintfulSignature } from '@/lib/printful/webhook-verify'
import { PRINTFUL_CONFIG } from '@/lib/printful/config'
import { logger } from '@/lib/printful/logger'
import { handleWebhookEvent } from '@/lib/printful/webhook-handlers'

export async function POST(request: NextRequest) {
    const secret = PRINTFUL_CONFIG?.PRINTFUL_WEBHOOK_SECRET

    if (!secret) {
        logger.error('Webhook received but PRINTFUL_WEBHOOK_SECRET is not configured', { operation: 'webhook' })
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    const signature = request.headers.get('x-printful-signature')
    if (!signature) {
        logger.warn('Webhook received without signature', { operation: 'webhook' })
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    const body = await request.text()

    if (!verifyPrintfulSignature(body, signature, secret)) {
        logger.warn('Webhook signature verification failed', { operation: 'webhook', signature })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    try {
        const event = JSON.parse(body)
        logger.info('Printful Webhook Received', { operation: 'webhook', type: event.type, created: event.created })

        if (event.type) {
            await handleWebhookEvent(event)
        }

        return NextResponse.json({ received: true })
    } catch (err) {
        logger.error('Error processing webhook payload', { operation: 'webhook', error: err instanceof Error ? err.message : 'Unknown' })
        return NextResponse.json({ error: 'Processing error' }, { status: 400 })
    }
}
