import { type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const handleI18n = createMiddleware(routing)

export async function proxy(request: NextRequest) {
  const intlResponse = handleI18n(request)
  const res = intlResponse instanceof Promise ? await intlResponse : intlResponse
  if (res?.status === 307 || res?.status === 308) return res
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
