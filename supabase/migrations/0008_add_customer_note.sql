-- Add customer_note column to app_orders
ALTER TABLE app_orders ADD COLUMN IF NOT EXISTS customer_note TEXT;
