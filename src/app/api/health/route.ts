import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/health
 * Lightweight health-check used by uptime monitors (e.g. UptimeRobot, Vercel).
 * Returns 200 when the application and database are reachable, 503 otherwise.
 */
export async function GET() {
  const start = Date.now()

  // Probe the database with a minimal, index-only query
  const supabase = getAdminClient()
  if (!supabase) {
    return NextResponse.json(
      { status: 'degraded', db: 'not_configured', latency_ms: 0 },
      { status: 503 }
    )
  }

  const { error } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .limit(1)

  const latency = Date.now() - start

  if (error) {
    return NextResponse.json(
      { status: 'unhealthy', db: 'error', error: error.message, latency_ms: latency },
      { status: 503 }
    )
  }

  return NextResponse.json({ status: 'ok', db: 'connected', latency_ms: latency }, { status: 200 })
}
