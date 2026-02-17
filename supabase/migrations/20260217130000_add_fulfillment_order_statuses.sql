-- Migration: Add fulfillment_failed and fulfillment_canceled to orders.status CHECK constraint
-- These statuses are set by Printful webhooks when Printful rejects or cancels an order.
-- Required before webhook-handlers.ts can write these values.

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN (
    'pending',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
    'fulfillment_failed',
    'fulfillment_canceled'
  ));
