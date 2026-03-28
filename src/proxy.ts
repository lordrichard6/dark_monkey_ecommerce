import { NextRequest, NextResponse } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const handleI18n = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- i18n routing ---
  const intlResponse = handleI18n(request)

  // If next-intl triggers a redirect (e.g. / -> /en), return it immediately
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse
  }

  // Build a NextResponse.next() that forwards x-pathname to server components.
  // This is the ONLY reliable way to pass custom headers to server components
  // in Next.js App Router — they must be set on the request headers of a
  // NextResponse.next(), not on any arbitrary response object.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)

  const nextResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Copy all cookies from intlResponse so locale cookies are preserved
  intlResponse.cookies.getAll().forEach(({ name, value }) => {
    nextResponse.cookies.set(name, value)
  })
  // Copy intl response headers (e.g. x-middleware-rewrite, x-nextjs-matched-path)
  intlResponse.headers.forEach((value, key) => {
    if (key.startsWith('x-') || key === 'link') {
      nextResponse.headers.set(key, value)
    }
  })

  // Chain to Supabase session middleware
  return await updateSession(request, nextResponse)
}

export const config = {
  matcher: [
    // Standard Next.js route matcher: exclude static files and internals
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp|json)$).*)',
  ],
}
