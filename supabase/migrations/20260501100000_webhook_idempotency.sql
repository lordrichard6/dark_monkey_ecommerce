-- Idempotency table for inbound webhook processing.
-- Both Stripe and Printful retry on network failures; without dedup we'd send
-- duplicate fulfillment requests, double-charge orders, or duplicate
-- shipping-notification emails. Insert-with-unique-key acts as the dedup gate.

CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  source        TEXT        NOT NULL,
  event_id      TEXT        NOT NULL,
  event_type    TEXT,
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (source, event_id)
);

-- Used by a future cron to purge rows older than 30 days (Stripe retries for
-- 3 days max; 30 gives us a comfortable safety window for forensics).
CREATE INDEX IF NOT EXISTS idx_processed_webhook_events_processed_at
  ON public.processed_webhook_events (processed_at);

COMMENT ON TABLE public.processed_webhook_events IS
  'Webhook idempotency log — write-once, source+event_id is the dedup key';

-- RLS: nothing should read this directly except the service role.
ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'processed_webhook_events'
      AND policyname = 'Default deny'
  ) THEN
    CREATE POLICY "Default deny" ON public.processed_webhook_events
      FOR ALL USING (false);
  END IF;
END $$;
