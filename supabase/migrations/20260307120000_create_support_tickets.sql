-- Support ticketing system
-- Two tables: support_tickets (thread header) + ticket_messages (replies)

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('order_issue', 'complaint', 'suggestion', 'question')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_admin_reply BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_updated_at ON support_tickets(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Customers can SELECT / INSERT their own tickets (no UPDATE/DELETE — status changes go via admin)
CREATE POLICY "users_select_own_tickets"
  ON support_tickets FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "users_insert_own_tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Customers can SELECT / INSERT messages on their own tickets
CREATE POLICY "users_select_own_ticket_messages"
  ON ticket_messages FOR SELECT
  USING (ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()));

CREATE POLICY "users_insert_own_ticket_messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (ticket_id IN (SELECT id FROM support_tickets WHERE user_id = auth.uid()));

-- Trigger: bump updated_at on the parent ticket when a new message arrives
CREATE OR REPLACE FUNCTION update_ticket_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE support_tickets SET updated_at = NOW() WHERE id = NEW.ticket_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ticket_message_inserted ON ticket_messages;
CREATE TRIGGER ticket_message_inserted
  AFTER INSERT ON ticket_messages
  FOR EACH ROW EXECUTE FUNCTION update_ticket_updated_at();
