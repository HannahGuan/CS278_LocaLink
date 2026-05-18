-- Wire user_locations RLS to the two privacy toggles users see in the app:
--   • "Visible to friends"   → privacy_settings.showToFriends (gates friend reads)
--   • "Discovery mode"       → privacy_settings.showToMatches (gates non-friend reads)
--
-- Both default to ON (NULL / missing key = visible) so we don't need to backfill.
-- Multiple SELECT policies are ORed, so a user with both toggles on stays
-- visible to everyone authenticated, and turning off Discovery Mode still leaves
-- friends able to see them.

-- Replace the old friends-locations policy with one that honors showToFriends.
DROP POLICY IF EXISTS "Users can view friends' locations" ON user_locations;
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

-- Open up locations of users with Discovery Mode on to any authenticated user.
DROP POLICY IF EXISTS "Discoverable users' locations are visible" ON user_locations;
CREATE POLICY "Discoverable users' locations are visible"
  ON user_locations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = user_locations.user_id
        AND COALESCE(profiles.privacy_settings->>'showToMatches', 'true') <> 'false'
    )
  );
