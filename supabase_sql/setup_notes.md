# Supabase Database Setup Notes

## Prerequisites
1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Get your project URL and anon key from Project Settings > API

## Setup Steps

### 1. Run Schema Migration
Execute the SQL in `schema.sql` in the Supabase SQL Editor:
- Navigate to SQL Editor in your Supabase dashboard
- Create a new query
- Copy and paste the contents of `schema.sql`
- Run the query

### 2. Apply Row Level Security Policies
Execute the SQL in `rls_policies.sql` in the Supabase SQL Editor:
- Create another new query
- Copy and paste the contents of `rls_policies.sql`
- Run the query

### 3. Update App Configuration
Update the Supabase credentials in `database/supabase.ts`:
```typescript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Database Tables Overview

### profiles
Stores user profile information. Extends Supabase auth.users.
- Linked to auth.users via foreign key
- Contains name, email, avatar_url, bio, phone

### friends
Manages friend relationships between users.
- Supports pending, accepted, rejected statuses
- Bidirectional relationships (both users can see the connection)

### user_locations
Real-time location tracking for users.
- Stores latitude, longitude, accuracy
- Timestamped for location history
- Only visible to friends (via RLS policies)

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies to ensure:
- Users can only modify their own data
- Friend locations are only visible to accepted friends
- Public profiles are viewable by all authenticated users

### Authentication
Uses Supabase Auth with:
- Automatic token refresh
- Persistent sessions via AsyncStorage
- Secure credential management

## Real-time Features (Future Enhancement)
Supabase supports real-time subscriptions for:
- Friend location updates
- Friend request notifications
- Profile changes

Example subscription:
```typescript
supabase
  .channel('location-updates')
  .on('postgres_changes',
    { event: 'UPDATE', schema: 'public', table: 'user_locations' },
    (payload) => console.log(payload)
  )
  .subscribe();
```

## Testing the Database

### Manual Testing via Supabase Dashboard
1. Go to Table Editor
2. Insert test data into profiles and friends tables
3. Verify RLS policies are working by testing queries

### Programmatic Testing
Use the helper functions in `database/users.ts` and `database/friends.ts` to interact with the database from the app.