-- Public product votes — no login required, tracked by session_id (localStorage UUID)
CREATE TABLE IF NOT EXISTS public_product_votes (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  session_id  text        NOT NULL,
  vote        text        NOT NULL CHECK (vote IN ('up', 'down')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, session_id)
);

-- Index for fast count queries per product
CREATE INDEX IF NOT EXISTS idx_public_product_votes_product_id
  ON public_product_votes (product_id);

-- Allow anyone to read (for counts)
ALTER TABLE public_product_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read public votes"
  ON public_product_votes FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert public votes"
  ON public_product_votes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update their own session vote"
  ON public_product_votes FOR UPDATE
  USING (true);

CREATE POLICY "Anyone can delete their own session vote"
  ON public_product_votes FOR DELETE
  USING (true);
