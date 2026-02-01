import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl
  const isProtected = pathname.startsWith('/account') || pathname.startsWith('/admin')
  const hasAuthCookies = request.cookies.getAll().some((c) => c.name.startsWith('sb-'))

  // Validate session: call getUser on any request with auth cookies (to refresh or detect invalid tokens)
  let user = null
  if (hasAuthCookies || isProtected) {
    try {
      const { data } = await supabase.auth.getUser()
      user = data.user
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const code = err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : undefined
      const isRefreshTokenError =
        code === 'refresh_token_not_found' ||
        message.includes('Refresh Token') ||
        message.includes('refresh_token')

      if (isRefreshTokenError) {
        const allCookies = request.cookies.getAll()
        const authCookies = allCookies.filter((c) => c.name.startsWith('sb-'))
        authCookies.forEach((c) => {
          supabaseResponse.cookies.set(c.name, '', { maxAge: 0, path: '/' })
        })
        // Redirect to same path to force new request without bad cookies (avoids error in page components)
        const redirectUrl = request.nextUrl.clone()
        return NextResponse.redirect(redirectUrl, { headers: supabaseResponse.headers })
      }
      // user stays null, continue without throwing
    }
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
