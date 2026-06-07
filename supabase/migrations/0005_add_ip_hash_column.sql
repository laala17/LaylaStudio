-- Add ip_hash column to page_visits for anonymized visitor tracking
ALTER TABLE page_visits ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Index for aggregating by visitor (unique visits heuristic)
CREATE INDEX IF NOT EXISTS idx_page_visits_ip_hash ON page_visits (ip_hash);
