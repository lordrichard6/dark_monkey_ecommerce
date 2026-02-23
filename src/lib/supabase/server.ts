import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { User } from '@supabase/supabase-js'

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // setAll from Server Component — middleware will refresh session
        }
      },
    },
  })
}

/** Returns current user, or null on invalid/expired refresh token. Prevents AuthApiError on public pages. */
export async function getUserSafe(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<User | null> {
  try {
    const { data } = await supabase.auth.getUser()
    return data.user
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const code =
      err && typeof err === 'object' && 'code' in err ? (err as { code?: string }).code : undefined
    const isRefreshTokenError =
      code === 'refresh_token_not_found' ||
      message.includes('Refresh Token') ||
      message.includes('refresh_token')
    if (isRefreshTokenError) return null
    throw err
  }
}
