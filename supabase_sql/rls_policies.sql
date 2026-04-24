-- Row Level Security (RLS) Policies for LocaLink

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view all profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Friends policies
-- Users can view their own friend requests and accepted friends
CREATE POLICY "Users can view their own friends"
  ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update friend requests they received
CREATE POLICY "Users can update friend requests"
  ON friends FOR UPDATE
  USING (auth.uid() = friend_id OR auth.uid() = user_id);

-- Users can delete their own friend connections
CREATE POLICY "Users can delete their own friends"
  ON friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- User locations policies
-- Users can view locations of their friends
CREATE POLICY "Users can view friends' locations"
  ON user_locations FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM friends
      WHERE (friends.user_id = auth.uid() AND friends.friend_id = user_locations.user_id)
        OR (friends.friend_id = auth.uid() AND friends.user_id = user_locations.user_id)
        AND friends.status = 'accepted'
    )
  );

-- Users can insert their own location
CREATE POLICY "Users can insert their own location"
  ON user_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own location
CREATE POLICY "Users can update their own location"
  ON user_locations FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own location history
CREATE POLICY "Users can delete their own location"
  ON user_locations FOR DELETE
  USING (auth.uid() = user_id);