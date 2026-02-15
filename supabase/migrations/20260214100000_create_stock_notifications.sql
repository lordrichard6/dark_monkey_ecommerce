-- Create stock_notifications table
CREATE TABLE IF NOT EXISTS stock_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL,
  email TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notified_at TIMESTAMPTZ
);

-- Index for querying pending notifications
CREATE INDEX IF NOT EXISTS idx_stock_notifications_pending
ON stock_notifications(variant_id, notified)
WHERE notified = FALSE;

-- Index for email lookup
CREATE INDEX IF NOT EXISTS idx_stock_notifications_email
ON stock_notifications(email);

-- Enable RLS
ALTER TABLE stock_notifications ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Allow public inserts for stock_notifications"
ON stock_notifications FOR INSERT
WITH CHECK (true);
