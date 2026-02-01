import { NextResponse } from 'next/server'

/** Clears Supabase auth cookies and redirects. Use when seeing "Refresh Token Not Found" errors. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get('redirect') ?? '/login'
  const response = NextResponse.redirect(new URL(redirectTo, request.url))

  // Clear all Supabase auth cookies (sb-*)
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const eq = part.indexOf('=')
      const name = (eq > 0 ? part.slice(0, eq) : part).trim()
      if (name.startsWith('sb-')) {
        response.cookies.set(name, '', { maxAge: 0, path: '/' })
      }
    }
  }

  return response
}
