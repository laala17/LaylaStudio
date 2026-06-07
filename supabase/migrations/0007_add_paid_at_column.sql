-- Add paid_at timestamp to app_orders
ALTER TABLE app_orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Update status constraint to include 'zaplaceno' and 'čeká na platbu'
ALTER TABLE app_orders DROP CONSTRAINT IF EXISTS app_orders_status_check;
ALTER TABLE app_orders ADD CONSTRAINT app_orders_status_check
  CHECK (status IN ('pending', 'zaplaceno', 'čeká na platbu', 'shipped', 'delivered'));
