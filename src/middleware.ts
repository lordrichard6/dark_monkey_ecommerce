import { type NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'
import { rateLimit, getClientIp, type RateLimitBucket } from '@/lib/rate-limit'

const handleI18n = createMiddleware(routing)

/**
 * Determine which rate-limit bucket applies to this path, if any.
 * Returns null for routes that don't need rate limiting.
 */
function getRateLimitBucket(pathname: string): RateLimitBucket | null {
  // Auth pages: login, signup, forgot-password, reset-password
  if (/\/(login|forgot-password|auth)/.test(pathname)) return 'auth'
  // Checkout pages
  if (/\/(checkout)/.test(pathname)) return 'checkout'
  // Search page
  if (/\/search/.test(pathname)) return 'search'
  // Admin panel
  if (/\/admin/.test(pathname)) return 'admin'
  return null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Rate limiting (runs before i18n/session for sensitive routes) ---
  const bucket = getRateLimitBucket(pathname)
  if (bucket) {
    const ip = getClientIp(request.headers)
    const result = await rateLimit(ip, bucket)
    if (!result.success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((result.reset - Date.now()) / 1000)),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': String(result.remaining),
        },
      })
    }
  }

  // --- i18n routing ---
  const intlResponse = handleI18n(request)

  // If next-intl triggers a redirect (e.g. / -> /en), return it immediately
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse
  }

  // Otherwise, chain the response to Supabase middleware to preserve locale cookies
  return await updateSession(request, intlResponse)
}

export const config = {
  matcher: [
    // Standard Next.js route matcher: exclude static files and internals
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
}
