-- Add push_token column to profiles table for push notifications
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS push_token TEXT;

COMMENT ON COLUMN profiles.push_token IS 'Expo push notification token for sending notifications to user devices';

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS profiles_push_token_idx ON profiles(push_token) WHERE push_token IS NOT NULL;