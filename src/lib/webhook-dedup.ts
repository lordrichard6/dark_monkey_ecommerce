import { getAdminClient } from '@/lib/supabase/admin'

/**
 * Webhook idempotency check.
 *
 * Atomically claims an event ID. Returns:
 *   - { alreadyProcessed: true }  → caller should return 200 without re-running side effects
 *   - { alreadyProcessed: false } → caller should run side effects (this call inserted the row)
 *
 * The unique (source, event_id) primary key on `processed_webhook_events`
 * makes this race-safe: if two webhook deliveries arrive simultaneously,
 * exactly one INSERT succeeds; the other gets a unique-violation error
 * and is treated as `alreadyProcessed: true`.
 *
 * Fail-open behavior: if the Supabase admin client is unavailable (env vars
 * missing) or the DB is down, the check returns `alreadyProcessed: false` so
 * processing continues. We accept the small risk of duplicate processing
 * during outages over the certain failure of dropping every webhook.
 */
export async function claimWebhookEvent(
  source: 'stripe' | 'printful',
  eventId: string,
  eventType?: string
): Promise<{ alreadyProcessed: boolean }> {
  const supabase = getAdminClient()
  if (!supabase) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[webhook-dedup] CRITICAL: Supabase admin client unavailable — idempotency check skipped'
      )
    }
    return { alreadyProcessed: false }
  }

  const { error } = await supabase
    .from('processed_webhook_events')
    .insert({ source, event_id: eventId, event_type: eventType ?? null })

  if (!error) return { alreadyProcessed: false }

  // Postgres unique-violation = 23505 → already processed (race or retry).
  if (error.code === '23505') return { alreadyProcessed: true }

  // Any other error (RLS, connection, table missing): log and fail-open.
  console.error('[webhook-dedup] Insert failed; falling open:', error.message)
  return { alreadyProcessed: false }
}
