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
 */

// Only paths starting with these prefixes are allowed
const ALLOWED_PATH_PREFIXES = ['/', '/products/', '/categories/', '/art', '/search']

function isAllowedPath(path: unknown): path is string {
  if (typeof path !== 'string') return false
  return ALLOWED_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { secret, paths } = body

    // Verify secret token
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const validPaths: string[] = []
    const rejectedPaths: unknown[] = []

    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        if (isAllowedPath(path)) {
          revalidatePath(path)
          validPaths.push(path)
        } else {
          rejectedPaths.push(path)
        }
      }
    }

    if (rejectedPaths.length > 0) {
      console.warn('[Revalidate] Rejected disallowed paths:', rejectedPaths)
    }

    return NextResponse.json({
      revalidated: true,
      now: Date.now(),
      paths: validPaths,
      ...(rejectedPaths.length > 0 && { rejected: rejectedPaths }),
    })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
