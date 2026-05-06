# Supabase Setup Instructions

Follow these steps to set up your Supabase database for authentication.

## Step 1: Run the Database Schema

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (nxbuioobdluvdhgjqtee)
3. Navigate to **SQL Editor** (left sidebar)
4. Click **"+ New Query"**
5. Copy and paste the entire schema from `supabase_sql/schema.sql`
6. Click **"Run"** or press Cmd+Enter

### What this does:
- Creates the `profiles` table with all necessary columns
- Creates indexes for better performance
- Sets up automatic timestamp updates
- Links profiles to Supabase Auth users

## Step 2: Set Up Row Level Security (RLS)

1. Still in the SQL Editor, create another new query
2. Copy and paste the policies from `supabase_sql/rls_policies.sql`
3. Click **"Run"**

### What this does:
- Enables Row Level Security
- Allows users to read/update their own profile
- Allows users to view other users' profiles
- Protects user data from unauthorized access

## Step 3: Enable Email Authentication

1. Go to **Authentication** → **Providers** (left sidebar)
2. Find **Email** provider
3. Make sure it's **enabled** (toggle should be ON)
4. Scroll down to **Email Auth Settings**:
   - ✓ Enable email confirmations (optional - recommended for production)
   - ✓ Enable email change confirmations
   - ✓ Secure email change enabled

### For Development (disable email confirmation):
If you want to test without email verification:
1. In Authentication → Providers → Email
2. Uncheck "Enable email confirmations"
3. This allows immediate login after registration

## Step 4: Configure Email Templates (Optional)

If you enabled email confirmations:
1. Go to **Authentication** → **Email Templates**
2. Customize:
   - Confirm signup
   - Reset password
   - Change email address

## Step 5: Check API Keys

1. Go to **Settings** → **API** (left sidebar)
2. Verify your keys match those in `.env`:
   - Project URL: `https://nxbuioobdluvdhgjqtee.supabase.co`
   - `anon` public key (starts with `eyJ...`)

## Step 6: Test Database Connection

Run this in SQL Editor to verify everything is set up:

```sql
-- Check if profiles table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'profiles';

-- Check profiles table structure
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'profiles';
```

Expected results:
- First query: Should return `profiles`
- Second query: Should list all columns including `interests`, `social_style`, etc.
- Third query: Should show `rowsecurity = true`

## Step 7: Create a Test User (Optional)

You can create a test user directly in Supabase:
1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Enter:
   - Email: `test@stanford.edu`
   - Password: `test123456`
   - Auto confirm user: ✓ (check this box)
4. Click **"Create user"**

## Common Issues & Solutions

### "Network request failed" Error

**Possible causes:**
1. **Supabase keys are incorrect**
   - Go to Settings → API in Supabase Dashboard
   - Copy the exact `Project URL` and `anon public` key
   - Update `.env` file with correct values
   - Restart Expo: `r` in terminal or Ctrl+C and `npm start`

2. **Internet connection**
   - Make sure you're connected to internet
   - Make sure Supabase isn't blocked by firewall

3. **Email provider not enabled**
   - Check Authentication → Providers → Email is enabled

4. **Table doesn't exist**
   - Run the schema.sql file (Step 1 above)

### "Auth session missing" Error

This is normal on first load - it just means no user is logged in yet.

### "Row-level security policy violation" Error

**Solution:**
- Make sure you ran `rls_policies.sql` (Step 2 above)
- Check that policies are created:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'profiles';
  ```

### Registration succeeds but profile not created

**Solution:**
Add a trigger to auto-create profile:

```sql
-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## Verification Checklist

Before testing the app, verify:
- [ ] Schema SQL has been run successfully
- [ ] RLS policies are created
- [ ] Email provider is enabled
- [ ] API keys in `.env` are correct
- [ ] Expo dev server has been restarted after `.env` changes
- [ ] `profiles` table exists in Database → Tables
- [ ] RLS is enabled on `profiles` table

## Quick Test

After setup, test the auth flow:

1. **Open the app** - Should show login screen
2. **Click "Create New Account"**
3. **Fill in the form:**
   - Name: Test User
   - Email: yourname@stanford.edu
   - Password: test123456
   - Confirm: test123456
4. **Click "Create Account"**
5. **Expected result:**
   - Success message appears
   - User is created in Supabase (check Authentication → Users)
   - Profile is created in profiles table (check Database → Tables → profiles)

## Need Help?

1. Check Supabase Dashboard → Project Logs for errors
2. Check your app console for detailed error messages
3. Verify all steps above are completed
4. Try creating a user directly in Supabase Dashboard to isolate the issue
