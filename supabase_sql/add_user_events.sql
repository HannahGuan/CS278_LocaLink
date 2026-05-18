-- User-created events
-- Lets users create their own events alongside the Stanford RSS feed.
-- starts_at is the canonical timestamp used for "Now/Today/This Week" filtering;
-- event_date / event_time are the pre-formatted display strings so the UI keeps
-- the same formatting it uses for feed events.

CREATE TABLE IF NOT EXISTS user_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  event_date TEXT NOT NULL,
  event_time TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  category TEXT NOT NULL DEFAULT 'Social',
  icon TEXT NOT NULL DEFAULT '🎉',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_created_by ON user_events(created_by);
CREATE INDEX IF NOT EXISTS idx_user_events_starts_at ON user_events(starts_at);

ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view user events"
  ON user_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own events"
  ON user_events FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own events"
  ON user_events FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own events"
  ON user_events FOR DELETE
  USING (auth.uid() = created_by);

CREATE TRIGGER update_user_events_updated_at
  BEFORE UPDATE ON user_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Friend visibility for RSVPs.
-- The Discover "Friends" filter needs to find events any accepted friend has
-- RSVPed to. The existing event_rsvps SELECT policy only exposes the caller's
-- own rows, so add a second policy that also exposes rows belonging to any
-- accepted friend of the caller.
CREATE POLICY "Friends can view each other's RSVPs"
  ON event_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friends
      WHERE friends.user_id = auth.uid()
        AND friends.friend_id = event_rsvps.user_id
        AND friends.status = 'accepted'
    )
  );
