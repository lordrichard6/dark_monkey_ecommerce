-- Add optional label/nickname to addresses (e.g. "Home", "Office", "Parents")
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS label TEXT;
