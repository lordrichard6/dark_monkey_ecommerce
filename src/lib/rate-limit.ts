/**
 * Rate limiting using Upstash Redis + @upstash/ratelimit.
 *
 * Falls open (no-op) when UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * are not configured, so the site never breaks due to missing credentials.
 *
 * Usage (Edge middleware or API routes):
 *   const result = await rateLimit(identifier, 'auth')
 *   if (!result.success) return new Response('Too Many Requests', { status: 429 })
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Graceful no-op when credentials are absent
const NO_OP_RESULT = { success: true, limit: 0, remaining: 0, reset: 0 }

function makeRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return new Redis({ url, token })
}

function makeLimiter(
  redis: Redis,
  requests: number,
  window: `${number} ${'s' | 'ms' | 'm' | 'h' | 'd'}`
): Ratelimit {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
    prefix: 'dm_rl',
  })
}

// Cached limiters (module-level, shared across requests in the same worker)
let _redis: Redis | null | undefined = undefined
let _limiters: Record<string, Ratelimit> | null = null

function getLimiters(): Record<string, Ratelimit> | null {
  if (_redis === undefined) _redis = makeRedis()
  if (!_redis) return null
  if (!_limiters) {
    _limiters = {
      // 100 requests per minute — general API protection
      api: makeLimiter(_redis, 100, '1 m'),
      // 5 login/signup attempts per 15 minutes — brute-force protection
      auth: makeLimiter(_redis, 5, '15 m'),
      // 10 checkout attempts per hour — prevents card testing
      checkout: makeLimiter(_redis, 10, '1 h'),
      // 50 search queries per minute
      search: makeLimiter(_redis, 50, '1 m'),
      // 200 requests per minute for admin panel
      admin: makeLimiter(_redis, 200, '1 m'),
    }
  }
  return _limiters
}

export type RateLimitBucket = 'api' | 'auth' | 'checkout' | 'search' | 'admin'

/**
 * Check rate limit for a given identifier (e.g. IP address or user ID).
 * Returns `{ success: true }` when Upstash is not configured (fail-open).
 */
export async function rateLimit(
  identifier: string,
  bucket: RateLimitBucket
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiters = getLimiters()
  if (!limiters) return NO_OP_RESULT

  const limiter = limiters[bucket]
  if (!limiter) return NO_OP_RESULT

  return limiter.limit(identifier)
}

/**
 * Extract a best-effort client IP from Next.js request headers.
 * Returns "anonymous" as fallback so rate limiting still fires.
 */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-real-ip') ?? headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous'
  )
}
