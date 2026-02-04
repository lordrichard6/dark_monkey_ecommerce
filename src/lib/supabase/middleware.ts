import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const LOCALES = ['en', 'pt', 'de', 'it', 'fr']

function getPathWithoutLocale(pathname: string): { path: string; locale: string } {
  const segments = pathname.split('/').filter(Boolean)
  const maybeLocale = segments[0]
  if (LOCALES.includes(maybeLocale)) {
    return { path: '/' + segments.slice(1).join('/') || '/', locale: maybeLocale }
  }
  return { path: pathname || '/', locale: 'en' }
}

export async function updateSession(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.next({ request })
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
  const { path: pathWithoutLocale, locale } = getPathWithoutLocale(pathname)
  const isAdminLogin = pathWithoutLocale === '/admin/login'
  const isProtected =
    pathWithoutLocale.startsWith('/account') ||
    (pathWithoutLocale.startsWith('/admin') && !isAdminLogin)
  const hasAuthCookies = request.cookies.getAll().some((c) => c.name.startsWith('sb-'))

  // On login pages: clear stale auth cookies and redirect (avoids "Refresh Token Not Found" errors)
  if ((pathWithoutLocale === '/login' || pathWithoutLocale === '/admin/login') && hasAuthCookies) {
    const allCookies = request.cookies.getAll()
    const authCookies = allCookies.filter((c) => c.name.startsWith('sb-'))
    authCookies.forEach((c) => {
      supabaseResponse.cookies.set(c.name, '', { maxAge: 0, path: '/' })
    })
    return NextResponse.redirect(new URL(pathname, request.url), { headers: supabaseResponse.headers })
  }

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
    url.pathname = pathWithoutLocale.startsWith('/admin') ? `/${locale}/admin/login` : `/${locale}/login`
    if (!pathWithoutLocale.startsWith('/admin')) url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Set referral cookie when ?ref= is present (30 days)
  const refCode = request.nextUrl.searchParams.get('ref')
  if (refCode && typeof refCode === 'string' && refCode.length <= 64) {
    supabaseResponse.cookies.set('dm_ref', refCode.trim(), {
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    })
  }

  return supabaseResponse
  } catch {
    return NextResponse.next({ request })
  }
}
