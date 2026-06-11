-- Insert BARBORA15: 15% off discount code
INSERT INTO discount_codes (code, discount_type, discount_value, is_active)
VALUES ('BARBORA15', 'percentage', 15, TRUE)
ON CONFLICT (code) DO NOTHING;
