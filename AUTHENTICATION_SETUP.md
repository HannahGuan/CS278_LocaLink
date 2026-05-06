# Authentication Setup Guide

This guide explains the authentication system implementation for Cardinal Connect (LocaLink).

## Overview

The app now has a complete authentication system with:
- Stanford email registration (@stanford.edu only)
- Secure login with email/password
- Persistent sessions using Supabase Auth
- User profile creation
- Onboarding flow with data persistence

## Files Modified/Created

### 1. Environment Variables
- **`.env`**: Contains Supabase credentials (now using environment variables)
- **`.gitignore`**: Updated to exclude `.env` file from git

### 2. Authentication Module
- **`database/auth.ts`**: New file with auth helper functions
  - `signUp()`: Register new users (Stanford email validation)
  - `signIn()`: Login existing users
  - `signOut()`: Logout
  - `getCurrentUser()`: Get current authenticated user
  - `resetPassword()`: Password reset functionality

### 3. Database Configuration
- **`database/supabase.ts`**: Updated to use environment variables
- **`supabase_sql/schema.sql`**: Updated profiles table with:
  - `interests` (TEXT[]): User's selected interests
  - `social_style` (JSONB): Personality preferences
  - `privacy_settings` (JSONB): Privacy preferences
  - `notification_settings` (JSONB): Notification preferences
  - `onboarding_completed` (BOOLEAN): Onboarding status

### 4. Screens
- **`app/screens/RegisterScreen.tsx`**: New registration screen
  - Stanford email validation
  - Password strength requirements (min 6 characters)
  - Email verification prompt

- **`app/screens/LoginScreen.tsx`**: Updated login screen
  - Two views: welcome screen + login form
  - Real Supabase authentication
  - Navigation to registration

- **`app/screens/OnboardingScreen.tsx`**: Updated to save data
  - Saves all onboarding preferences to database
  - Sets `onboarding_completed` flag

### 5. Main App
- **`App.tsx`**: Complete authentication flow
  - Checks for existing session on app start
  - Listens for auth state changes
  - Shows appropriate screen based on auth status

## Authentication Flow

```
1. App Start
   ↓
2. Check for existing session
   ↓
   No Session → Login Screen
   Has Session → Check Onboarding
                 ↓
                 Not Complete → Onboarding Screen
                 Complete → Main App

3. Login Screen
   - "Sign In with Email" → Login Form
   - "Create New Account" → Register Screen

4. Register Screen
   - Validates @stanford.edu email
   - Creates user in Supabase Auth
   - Creates profile in profiles table
   - Returns to login (user must verify email)

5. After Login
   - If first time → Onboarding Screen
   - If returning user → Main App

6. Onboarding
   - Collects user preferences
   - Saves to database
   - Sets onboarding_completed = true
   - Proceeds to Main App
```

## Database Schema Updates Needed

Run this SQL in your Supabase SQL Editor to update the profiles table:

```sql
-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS interests TEXT[],
ADD COLUMN IF NOT EXISTS social_style JSONB,
ADD COLUMN IF NOT EXISTS privacy_settings JSONB,
ADD COLUMN IF NOT EXISTS notification_settings JSONB,
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
```

## Supabase Dashboard Configuration

### 1. Enable Email Auth
1. Go to Supabase Dashboard
2. Navigate to Authentication → Providers
3. Enable "Email" provider
4. Configure email templates (optional)

### 2. Email Domain Restriction (Optional)
To restrict registration to Stanford emails only at the database level:

```sql
-- Add constraint to profiles table
ALTER TABLE profiles
ADD CONSTRAINT stanford_email_only
CHECK (email LIKE '%@stanford.edu');
```

### 3. Row Level Security (RLS)
Make sure RLS policies are set up in `supabase_sql/rls_policies.sql`

## Testing the Authentication

### Register a New User
1. Click "Create New Account"
2. Enter:
   - Full name
   - Stanford email (e.g., `yourname@stanford.edu`)
   - Password (min 6 characters)
   - Confirm password
3. Check email for verification link (if email verification is enabled)
4. Return to login screen

### Login
1. Click "Sign In with Email"
2. Enter Stanford email and password
3. Click "Sign In"
4. Complete onboarding flow
5. Access main app

### Logout
Currently, logout is not implemented in the UI. To add it:
- Import `signOut` from `database/auth`
- Call it when user clicks logout button
- Navigate back to login screen

## Security Notes

1. **Environment Variables**: Never commit `.env` to git
2. **API Keys**: The `EXPO_PUBLIC_` prefix makes keys available to client
3. **RLS Policies**: Make sure Row Level Security is enabled on all tables
4. **Email Validation**: Stanford email validation happens both client-side and in auth function
5. **Password Requirements**: Minimum 6 characters (can be increased)

## Next Steps

### Recommended Enhancements
1. **Email Verification**: Configure Supabase email templates
2. **Password Reset**: Add "Forgot Password" link in LoginScreen
3. **Logout Button**: Add to ProfileScreen
4. **Check Onboarding Status**: Load from database instead of local state
5. **Profile Update**: Allow users to update their profile after registration
6. **Social Login**: Add Google/Apple sign-in (requires Supabase configuration)

### Password Reset Implementation
To add password reset:

```typescript
// In LoginScreen.tsx
import { resetPassword } from '../../database/auth';

const handleForgotPassword = async () => {
  const result = await resetPassword(email);
  if (result.success) {
    Alert.alert('Success', 'Check your email for password reset instructions');
  } else {
    Alert.alert('Error', result.error?.message);
  }
};
```

## Troubleshooting

### "Invalid API Key" Error
- Check that `.env` file exists and contains correct keys
- Restart Expo dev server after adding `.env`
- Verify keys in Supabase Dashboard → Settings → API

### "User already registered" Error
- User may have already registered with that email
- Check Supabase Dashboard → Authentication → Users
- User may need to verify their email first

### Onboarding Data Not Saving
- Check that schema updates have been applied
- Verify RLS policies allow user to update their own profile
- Check console for error messages

### Session Not Persisting
- Verify expo-secure-store is installed: `npx expo install expo-secure-store`
- Check that `persistSession: true` in supabase.ts
- Clear app data and try again

### AsyncStorage Error
- This app uses `expo-secure-store` instead of AsyncStorage for better Expo Go compatibility
- SecureStore provides encrypted storage and works with Expo Go without prebuild
- On web platform, falls back to localStorage automatically

## Support

For issues or questions:
1. Check Supabase Dashboard logs
2. Check React Native console output
3. Verify all schema updates are applied
4. Ensure `.env` file is properly configured
