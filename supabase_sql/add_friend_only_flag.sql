-- Add is_friend_only column to user_events table
-- This allows users to create events that are only visible to their friends

ALTER TABLE user_events
ADD COLUMN IF NOT EXISTS is_friend_only BOOLEAN DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN user_events.is_friend_only IS 'If true, event is only visible to friends of the creator';
