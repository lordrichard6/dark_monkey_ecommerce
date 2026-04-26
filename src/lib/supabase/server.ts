import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { cache } from 'react'
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

/**
 * Cached wrapper around `getUserSafe` for the lifetime of a single request.
 *
 * Why this exists: the homepage previously called `auth.getUser()` 3 times
 * (FeedSection, AuthCTASection, CustomDesignSection — each constructed its
 * own client and asked Supabase who was logged in). React's `cache()`
 * deduplicates within a request graph, so all three now hit at most one
 * `auth.getUser()` round-trip per render.
 *
 * Use this from any server component that needs the user. Skip it if you
 * already have a `supabase` client and want to share it (`getUserSafe(client)`
 * stays available for that case).
 */
export const getCachedUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient()
  return getUserSafe(supabase)
})

/**
 * Single Category row — generic shape so callers can pick the columns they need.
 * `Record<string, unknown>` keeps the row open for fields like `image_url`,
 * `subtitle`, `is_featured`, etc. without each consumer having to extend a type.
 */
export type CategoryRow = {
  id: string
  parent_id: string | null
  name: string
  slug: string
  sort_order: number | null
} & Record<string, unknown>

/**
 * Cached "all categories" fetcher.
 *
 * NewArrivalsSection (root + subcategories tree) and CategoryStrip (root with
 * images) both used to issue their own `from('categories').select(...)` query.
 * One cached `select('*')` superset covers both call sites — each derives its
 * own slice locally. React.cache() collapses concurrent calls in the same
 * request graph to a single round-trip.
 */
export const getCachedAllCategories = cache(async (): Promise<CategoryRow[]> => {
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('*').order('sort_order')
  return (data ?? []) as CategoryRow[]
})
