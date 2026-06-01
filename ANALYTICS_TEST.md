# Analytics Testing Guide

## Step 1: Create the analytics_events table in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project (LocaLink)
3. Click **"SQL Editor"** in left sidebar
4. Click **"New Query"**
5. Copy and paste the entire contents of `supabase_sql/analytics_events.sql`
6. Click **"Run"** (or Cmd/Ctrl + Enter)
7. You should see: ✅ **"Success. No rows returned"**

## Step 2: Test locally

1. Open your browser to: http://localhost:8081
2. Log in to your account
3. Perform these actions:
   - View the map (triggers `map_viewed`)
   - Switch filters: All → Friends → Events (triggers `filter_changed`)
   - Click on an event's "Details" button (triggers `event_viewed`)
   - Move around if on mobile (triggers `location_updated`)

## Step 3: Verify events were recorded

Go back to Supabase SQL Editor and run this query:

```sql
-- View all analytics events
SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 20;
```

You should see rows like:
```
id                                   | user_id | event_name      | properties              | platform | created_at
-------------------------------------|---------|-----------------|-------------------------|----------|-------------------
abc-123...                          | xyz-789 | map_viewed      | {"filter": "all"}       | web      | 2026-06-01 12:30:00
abc-456...                          | xyz-789 | filter_changed  | {"from": "all", ...}    | web      | 2026-06-01 12:30:15
abc-789...                          | xyz-789 | event_viewed    | {"event_id": "evt123"}  | web      | 2026-06-01 12:30:30
```

## Step 4: Check console for confirmation

Open browser console (Cmd+Option+J or F12) and look for:
```
[Analytics] Event tracked: app_opened {}
[Analytics] Event tracked: map_viewed { filter: 'all', location_permission: 'granted' }
[Analytics] Event tracked: filter_changed { from: 'all', to: 'friends' }
```

## Useful Analytics Queries

```sql
-- Daily active users
SELECT DATE(created_at) as date, COUNT(DISTINCT user_id) as users
FROM analytics_events
WHERE event_name = 'map_viewed'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Most popular filter
SELECT properties->>'to' as filter, COUNT(*) as count
FROM analytics_events
WHERE event_name = 'filter_changed'
GROUP BY properties->>'to'
ORDER BY count DESC;

-- Event views
SELECT properties->>'event_id' as event_id, COUNT(*) as views
FROM analytics_events
WHERE event_name = 'event_viewed'
GROUP BY properties->>'event_id'
ORDER BY views DESC LIMIT 10;

-- All tracked events summary
SELECT event_name, COUNT(*) as count
FROM analytics_events
GROUP BY event_name
ORDER BY count DESC;
```

## Troubleshooting

**If you don't see events in the database:**

1. Check browser console for `[Analytics]` logs
2. If you see errors like "relation analytics_events does not exist":
   - The table wasn't created - go back to Step 1
3. If you see "permission denied":
   - Check RLS policies in Supabase
4. Check Supabase logs in Dashboard → Logs

**If events are being tracked:**
✅ You should see `[Analytics] Event tracked:` messages in console
✅ The `analytics_events` table should have new rows
✅ You're ready to push to GitHub!
