-- Create page_visits table for tracking visits
CREATE TABLE IF NOT EXISTS page_visits (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_type TEXT NOT NULL DEFAULT 'desktop',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast time-range queries (used by dashboard)
CREATE INDEX IF NOT EXISTS idx_page_visits_visited_at ON page_visits (visited_at DESC);

-- Index for grouping by URL (top pages)
CREATE INDEX IF NOT EXISTS idx_page_visits_url ON page_visits (url);

-- Index for device type aggregation
CREATE INDEX IF NOT EXISTS idx_page_visits_device_type ON page_visits (device_type);

-- Enable Row Level Security (even though we use service_role key, it's good practice)
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;
