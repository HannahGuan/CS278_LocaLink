-- ================================================
-- FIX RLS POLICY FOR PROFILE CREATION
-- This fixes the "new row violates row-level security policy" error
-- ================================================

-- First, drop the restrictive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create a more permissive policy for new user registration
-- This allows the trigger function to create profiles
CREATE POLICY "Enable insert for authenticated users only"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also add a policy for service role (used by triggers)
CREATE POLICY "Enable insert for service role"
  ON profiles FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Make sure the trigger function has the right permissions
-- Re-create the function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Verify the policies
SELECT 'Checking RLS policies:' as status;
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
