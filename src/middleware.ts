import { type NextRequest } from 'next/server'
import createMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { updateSession } from '@/lib/supabase/middleware'

const handleI18n = createMiddleware(routing)

export async function middleware(request: NextRequest) {
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
