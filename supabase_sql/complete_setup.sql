-- ================================================
-- COMPLETE SUPABASE SETUP FOR CARDINAL CONNECT
-- Run this entire file in Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- 1. CREATE PROFILES TABLE
-- ================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  phone TEXT,
  -- Onboarding data
  interests TEXT[], -- Array of selected interests
  social_style JSONB, -- {introvertExtrovert, spontaneousPlanned, groupOneOnOne}
  privacy_settings JSONB, -- Privacy preferences
  notification_settings JSONB, -- Notification preferences
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 2. CREATE OTHER TABLES
-- ================================================

-- Friends table
CREATE TABLE IF NOT EXISTS friends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- User locations table (real-time location tracking)
CREATE TABLE IF NOT EXISTS user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  accuracy DOUBLE PRECISION,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================
-- 3. CREATE INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_friends_user_id ON friends(user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend_id ON friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_friends_status ON friends(status);
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_locations_timestamp ON user_locations(timestamp DESC);

-- ================================================
-- 4. CREATE UPDATE TIMESTAMP FUNCTION
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 5. CREATE TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_friends_updated_at ON friends;
CREATE TRIGGER update_friends_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 6. AUTO-CREATE PROFILE ON USER SIGNUP
-- ================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- ================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- ================================================
-- 8. CREATE RLS POLICIES
-- ================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view other users' profiles" ON profiles;
CREATE POLICY "Users can view other users' profiles"
  ON profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Friends policies
DROP POLICY IF EXISTS "Users can view their own friends" ON friends;
CREATE POLICY "Users can view their own friends"
  ON friends FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can insert friend requests" ON friends;
CREATE POLICY "Users can insert friend requests"
  ON friends FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their friend requests" ON friends;
CREATE POLICY "Users can update their friend requests"
  ON friends FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "Users can delete their friend requests" ON friends;
CREATE POLICY "Users can delete their friend requests"
  ON friends FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- User locations policies
DROP POLICY IF EXISTS "Users can view their own location" ON user_locations;
CREATE POLICY "Users can view their own location"
  ON user_locations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own location" ON user_locations;
CREATE POLICY "Users can insert their own location"
  ON user_locations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own location" ON user_locations;
CREATE POLICY "Users can update their own location"
  ON user_locations FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view friends' locations" ON user_locations;
CREATE POLICY "Users can view friends' locations"
  ON user_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM friends
      WHERE (friends.user_id = auth.uid() AND friends.friend_id = user_locations.user_id)
         OR (friends.friend_id = auth.uid() AND friends.user_id = user_locations.user_id)
      AND friends.status = 'accepted'
    )
  );

-- ================================================
-- 9. VERIFICATION QUERIES
-- ================================================

-- Check if tables were created
SELECT 'Tables created:' as status;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'friends', 'user_locations');

-- Check if RLS is enabled
SELECT 'RLS status:' as status;
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'friends', 'user_locations');

-- Check policies
SELECT 'Policies created:' as status;
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- All done!
SELECT '✓ Setup complete! You can now use the app.' as status;
