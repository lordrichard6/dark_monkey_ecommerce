import { revalidatePath } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * On-Demand Revalidation Endpoint
 *
 * Allows external systems (Printful, Stripe, admin actions) to trigger cache invalidation
 *
 * Usage:
 * POST /api/revalidate
 * {
 *   "secret": "your-secret-key",
 *   "paths": ["/products/hoodie", "/categories/clothing"]
 * }
 *
 * Note: Tag-based revalidation requires fetch with next.tags configuration
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, paths } = body

    // Verify secret token
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Revalidate paths
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        revalidatePath(path)
      }
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      paths: paths || [],
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
