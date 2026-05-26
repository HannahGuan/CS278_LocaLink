-- Ghost mode fix: make showToFriends a true global mute.
--
-- Intent (per product spec):
--   • showToFriends = false  → invisible to everyone (friends and strangers)
--   • showToMatches = false  → invisible to strangers only (friends still see you)
--
-- The previous policy in add_discoverable_locations.sql only gated discovery
-- on showToMatches, so turning off "Visible to friends" left you discoverable
-- to everyone via the OR'd discovery policy. The fix below requires both
-- toggles to be on for the discovery (non-friend) policy to grant access.
--
-- Safe to re-run.

-- Drop any older variants so we end with exactly one policy of each kind.
DROP POLICY IF EXISTS "Users can view friends' locations" ON user_locations;
DROP POLICY IF EXISTS "Friends can view each other's locations" ON user_locations;
DROP POLICY IF EXISTS "Discoverable users' locations are visible" ON user_locations;
DROP POLICY IF EXISTS "Non-friends can view discoverable locations" ON user_locations;

-- Friends see each other's locations as long as the owner hasn't gone
-- fully ghost (showToFriends != false).
CREATE POLICY "Friends can view each other's locations"
  ON user_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM friends
      JOIN profiles ON profiles.id = user_locations.user_id
      WHERE (
              (friends.user_id = auth.uid() AND friends.friend_id = user_locations.user_id)
           OR (friends.friend_id = auth.uid() AND friends.user_id = user_locations.user_id)
            )
        AND friends.status = 'accepted'
        AND COALESCE(profiles.privacy_settings->>'showToFriends', 'true') <> 'false'
    )
  );

-- Strangers (non-friends) see a location only when BOTH toggles are on —
-- showToFriends acts as the global kill switch, showToMatches as the
-- non-friend gate on top of it.
CREATE POLICY "Non-friends can view discoverable locations"
  ON user_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_locations.user_id
        AND COALESCE(profiles.privacy_settings->>'showToFriends', 'true') <> 'false'
        AND COALESCE(profiles.privacy_settings->>'showToMatches', 'true') <> 'false'
    )
  );
