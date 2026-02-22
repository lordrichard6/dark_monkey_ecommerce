ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS expires_at  TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS variant     TEXT NOT NULL DEFAULT 'default'
    CONSTRAINT announcements_variant_check CHECK (variant IN ('default', 'info', 'promo', 'warning')),
  ADD COLUMN IF NOT EXISTS locale      TEXT;
