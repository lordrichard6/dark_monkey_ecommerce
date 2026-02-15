
import { NextRequest, NextResponse } from 'next/server'
import { syncOrderStatus } from '@/actions/admin-orders-sync'
import { logger } from '@/lib/printful/logger'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { orderId } = body

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
        }

        // Ideally add Admin Auth check here (middleware usually handles this for /admin routes, 
        // but explicit check is safer for APIs)

        const result = await syncOrderStatus(orderId)

        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: 500 })
        }

        return NextResponse.json(result)

    } catch (err) {
        logger.error('Error in manual order sync', { operation: 'api_sync_order', error: err instanceof Error ? err.message : 'Unknown' })
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
