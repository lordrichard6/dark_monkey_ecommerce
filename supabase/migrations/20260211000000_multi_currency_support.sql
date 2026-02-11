-- Multi-Currency Support
-- Adds exchange rates table and currency columns to products and orders

-- Create exchange rates table
CREATE TABLE IF NOT EXISTS exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency VARCHAR(3) NOT NULL,
  to_currency VARCHAR(3) NOT NULL,
  rate DECIMAL(10, 6) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(from_currency, to_currency)
);

-- Add currency column to orders (track what currency was used at purchase)
-- Only add if column doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'currency'
  ) THEN
    ALTER TABLE orders ADD COLUMN currency VARCHAR(3) DEFAULT 'CHF' NOT NULL;
  END IF;
END $$;

-- Add base currency and multi-currency prices to products
ALTER TABLE products
ADD COLUMN base_currency VARCHAR(3) DEFAULT 'CHF' NOT NULL;

-- Add comments
COMMENT ON TABLE exchange_rates IS 'Exchange rates for multi-currency support. CHF is the base currency.';
COMMENT ON COLUMN orders.currency IS 'Currency used for this order (CHF, EUR, USD, GBP)';
COMMENT ON COLUMN products.base_currency IS 'Base currency for product pricing (default: CHF)';

-- Seed initial exchange rates (CHF as base currency)
-- Updated: February 11, 2026
-- Source: Manual/Fixed rates for price stability
INSERT INTO exchange_rates (from_currency, to_currency, rate) VALUES
  -- CHF conversions
  ('CHF', 'CHF', 1.000000),
  ('CHF', 'EUR', 0.950000),
  ('CHF', 'USD', 1.050000),
  ('CHF', 'GBP', 0.800000),
  
  -- EUR conversions
  ('EUR', 'CHF', 1.052632),
  ('EUR', 'EUR', 1.000000),
  ('EUR', 'USD', 1.105263),
  ('EUR', 'GBP', 0.842105),
  
  -- USD conversions
  ('USD', 'CHF', 0.952381),
  ('USD', 'EUR', 0.904762),
  ('USD', 'USD', 1.000000),
  ('USD', 'GBP', 0.761905),
  
  -- GBP conversions
  ('GBP', 'CHF', 1.250000),
  ('GBP', 'EUR', 1.187500),
  ('GBP', 'USD', 1.312500),
  ('GBP', 'GBP', 1.000000);

-- Create index for fast lookups
CREATE INDEX idx_exchange_rates_from_to ON exchange_rates(from_currency, to_currency);

-- Enable RLS
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read exchange rates
CREATE POLICY "Exchange rates are viewable by everyone" 
ON exchange_rates FOR SELECT 
USING (true);

-- Only admins can update exchange rates (via service role)
CREATE POLICY "Service role can manage exchange rates" 
ON exchange_rates FOR ALL 
USING (true);
