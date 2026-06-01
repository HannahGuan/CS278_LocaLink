-- Create analytics_events table for tracking user behavior
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  platform TEXT DEFAULT 'web',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_properties ON analytics_events USING GIN (properties);

-- Enable Row Level Security
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own events
CREATE POLICY "Users can insert their own analytics events"
  ON analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own events (for debugging)
CREATE POLICY "Users can view their own analytics events"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Allow anonymous event tracking (optional - remove if you only want authenticated)
CREATE POLICY "Allow anonymous analytics events"
  ON analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Grant permissions
GRANT INSERT ON analytics_events TO authenticated, anon;
GRANT SELECT ON analytics_events TO authenticated;

-- Create a view for common analytics queries (accessible to authenticated users)
CREATE OR REPLACE VIEW analytics_summary AS
SELECT
  event_name,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  DATE(created_at) as event_date
FROM analytics_events
GROUP BY event_name, DATE(created_at)
ORDER BY event_date DESC, event_count DESC;

GRANT SELECT ON analytics_summary TO authenticated;
