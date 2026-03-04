import { NextRequest, NextResponse } from 'next/server'
import { syncOrderStatus } from '@/actions/admin-orders-sync'
import { getAdminUser } from '@/lib/auth-admin'
import { logger } from '@/lib/printful/logger'

export async function POST(request: NextRequest) {
  try {
    // Verify the caller is an authenticated admin
    const adminUser = await getAdminUser()
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { orderId } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    const result = await syncOrderStatus(orderId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json(result)
  } catch (err) {
    logger.error('Error in manual order sync', {
      operation: 'api_sync_order',
      error: err instanceof Error ? err.message : 'Unknown',
    })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
