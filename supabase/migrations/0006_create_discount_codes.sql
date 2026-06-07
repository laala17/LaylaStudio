-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id BIGSERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes (code);

-- Insert test code: 10% off
INSERT INTO discount_codes (code, discount_type, discount_value, is_active)
VALUES ('SLEVA10', 'percentage', 10, TRUE)
ON CONFLICT (code) DO NOTHING;
