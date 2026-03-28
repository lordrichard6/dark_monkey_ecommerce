/**
 * Local Supabase connectivity test.
 *
 * Verifies that the local Supabase stack is reachable from Node (server-side)
 * when running in development. This test catches the "Failed to fetch" class of
 * bugs that occur when:
 *   - The wrong Supabase URL is configured (.env.local)
 *   - The local Docker stack isn't running
 *   - A CSP policy blocks browser→Supabase requests (verified separately in next.config.ts)
 *   - The anon key uses the new sb_publishable_ format instead of JWT
 *
 * Skipped automatically in CI (IS_LOCAL=false) and when Supabase URL is mocked.
 */

import { describe, it, expect } from 'vitest'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

// Only run these tests when pointing at a real local instance AND not in CI.
// The CI secret NEXT_PUBLIC_SUPABASE_URL may contain 'localhost', but there is
// no local Supabase stack running in GitHub Actions, so we must skip there too.
const IS_LOCAL =
  (SUPABASE_URL.includes('localhost') || SUPABASE_URL.includes('127.0.0.1')) && !process.env.CI
// Vitest setup injects a mock key — skip real-key checks when that's active
const IS_MOCK_KEY = ANON_KEY === 'test-anon-key' || ANON_KEY === ''

describe.skipIf(!IS_LOCAL)('Local Supabase connectivity', () => {
  it('auth endpoint is reachable and returns GoTrue info', async () => {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`)
    expect(res.status).toBe(200)
    const body = await res.json()
    // GoTrue health returns { name, version, description } — not { status: 'ok' }
    expect(body).toHaveProperty('version')
    expect(typeof body.version).toBe('string')
  })

  it('REST API endpoint is reachable', async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: ANON_KEY },
    })
    expect(res.status).toBe(200)
  })

  it.skipIf(IS_MOCK_KEY)('anon key is a valid JWT (not the new sb_publishable_ format)', () => {
    // The Supabase JS client requires a JWT anon key (eyJ...).
    // The new sb_publishable_ format is NOT supported by the JS SDK and causes "Invalid API key".
    expect(ANON_KEY).toMatch(/^eyJ/)
  })

  it('NEXT_PUBLIC_SUPABASE_URL has no trailing whitespace or newlines', () => {
    expect(SUPABASE_URL).toBe(SUPABASE_URL.trim())
    expect(SUPABASE_URL).not.toMatch(/\s/)
  })

  it.skipIf(IS_MOCK_KEY)(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY has no trailing whitespace or newlines',
    () => {
      expect(ANON_KEY).toBe(ANON_KEY.trim())
      expect(ANON_KEY).not.toMatch(/\s/)
    }
  )
})
