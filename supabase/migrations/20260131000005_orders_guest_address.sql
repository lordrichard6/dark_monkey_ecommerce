-- Guest checkout: store address as JSON when no user address
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_json JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS billing_address_json JSONB;
