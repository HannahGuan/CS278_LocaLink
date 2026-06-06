-- ================================================
-- USAGE STATISTICS FOR FINAL REPORT
-- Run these queries in Supabase SQL Editor to get your metrics
-- ================================================

-- ===========================================
-- [N] Total Verified Stanford Users
-- ===========================================
SELECT
  COUNT(*) as total_users,
  '[N] Total verified Stanford users (signed up)'
FROM profiles
WHERE email LIKE '%@stanford.edu';

-- ===========================================
-- [M] Active Users (Beyond Lurking)
-- Users who RSVP'd, created events, sent friend requests, or messaged
-- ===========================================
WITH active_users AS (
  -- Users who RSVP'd to events
  SELECT DISTINCT user_id FROM event_rsvps
  UNION
  -- Users who created events
  SELECT DISTINCT created_by as user_id FROM user_events
  UNION
  -- Users who sent friend requests (initiated)
  SELECT DISTINCT user_id FROM friends WHERE status IN ('pending', 'accepted')
  UNION
  -- Users who received and accepted friend requests (engaged)
  SELECT DISTINCT friend_id as user_id FROM friends WHERE status = 'accepted'
  UNION
  -- Users who sent messages
  SELECT DISTINCT sender_id as user_id FROM messages
  UNION
  -- Users who received messages (and likely replied)
  SELECT DISTINCT recipient_id as user_id FROM messages
)
-- Count for reporting
SELECT
  COUNT(*) as active_users,
  '[M] Active users (contributed beyond lurking)'
FROM active_users;

-- List of all active users with details
WITH active_users AS (
  -- Users who RSVP'd to events
  SELECT DISTINCT user_id FROM event_rsvps
  UNION
  -- Users who created events
  SELECT DISTINCT created_by as user_id FROM user_events
  UNION
  -- Users who sent/received friend requests
  SELECT DISTINCT user_id FROM friends WHERE status IN ('pending', 'accepted')
  UNION
  SELECT DISTINCT friend_id as user_id FROM friends WHERE status = 'accepted'
  UNION
  -- Users who sent messages
  SELECT DISTINCT sender_id as user_id FROM messages
  UNION
  -- Users who received messages (and likely replied)
  SELECT DISTINCT recipient_id as user_id FROM messages
)
SELECT
  p.id,
  p.name,
  p.email,
  p.created_at as signed_up_at
FROM active_users au
JOIN profiles p ON au.user_id = p.id
WHERE p.email LIKE '%@stanford.edu'
ORDER BY p.name;

-- ===========================================
-- [X] User-Created Events
-- ===========================================
SELECT
  COUNT(*) as user_created_events,
  '[X] User-created events'
FROM user_events;

-- Breakdown by category (optional detail)
SELECT
  category,
  COUNT(*) as count,
  'Events by category'
FROM user_events
GROUP BY category
ORDER BY count DESC;

-- List of all user-created events with details
SELECT
  ue.id,
  ue.title,
  ue.category,
  ue.description,
  ue.location,
  ue.start_time,
  ue.end_time,
  p.name as created_by_name,
  p.email as created_by_email,
  ue.created_at
FROM user_events ue
JOIN profiles p ON ue.created_by = p.id
ORDER BY ue.start_time DESC;

-- ===========================================
-- [Y] Event RSVPs
-- ===========================================
SELECT
  COUNT(*) as total_rsvps,
  '[Y] Total event RSVPs'
FROM event_rsvps;

-- Breakdown: RSVPs to user events vs RSS feed events
SELECT
  CASE
    WHEN er.event_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    THEN 'User-created events'
    ELSE 'RSS feed events'
  END as event_type,
  COUNT(*) as rsvp_count
FROM event_rsvps er
GROUP BY event_type;

-- ===========================================
-- [Z] Friend Connections
-- ===========================================
-- Count accepted friendships (bidirectional, so divide by 2)
SELECT
  COUNT(*) / 2 as friend_connections,
  '[Z] Friend connections (unique pairs)'
FROM friends
WHERE status = 'accepted';

-- Total friend requests sent (including pending/rejected)
SELECT
  COUNT(*) as total_friend_requests,
  'Total friend requests sent (all statuses)'
FROM friends;

-- Breakdown by status
SELECT
  status,
  COUNT(*) as count
FROM friends
GROUP BY status;

-- ===========================================
-- [W] Messages Exchanged
-- ===========================================
SELECT
  COUNT(*) as total_messages,
  '[W] Messages exchanged'
FROM messages;

-- Messages over time (optional - see engagement trends)
SELECT
  DATE(created_at) as date,
  COUNT(*) as messages_sent
FROM messages
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 30;

-- ===========================================
-- ANALYTICS EVENTS FOR FINAL REPORT
-- ===========================================

-- Map viewed events
SELECT
  COUNT(*) as map_viewed_events,
  'Map viewed events'
FROM analytics_events
WHERE event_name = 'map_viewed';

-- Event RSVP'd events
SELECT
  COUNT(*) as event_rsvped_events,
  'Event RSVP''d events'
FROM analytics_events
WHERE event_name = 'event_rsvped';

-- Friend request sent events
SELECT
  COUNT(*) as friend_request_sent_events,
  'Friend request sent events'
FROM analytics_events
WHERE event_name = 'friend_request_sent';

-- Friend request accepted events (how many of the sent requests were accepted)
SELECT
  COUNT(*) as friend_request_accepted_events,
  'Friend request accepted events'
FROM analytics_events
WHERE event_name = 'friend_request_accepted';

-- Chat opened events
SELECT
  COUNT(*) as chat_opened_events,
  'Chat opened events'
FROM analytics_events
WHERE event_name = 'chat_opened';

-- Mean number of friend connections per active user
WITH active_users AS (
  -- Users who RSVP'd to events
  SELECT DISTINCT user_id FROM event_rsvps
  UNION
  -- Users who created events
  SELECT DISTINCT created_by as user_id FROM user_events
  UNION
  -- Users who sent/received friend requests
  SELECT DISTINCT user_id FROM friends WHERE status IN ('pending', 'accepted')
  UNION
  SELECT DISTINCT friend_id as user_id FROM friends WHERE status = 'accepted'
  UNION
  -- Users who sent messages
  SELECT DISTINCT sender_id as user_id FROM messages
  UNION
  -- Users who received messages
  SELECT DISTINCT recipient_id as user_id FROM messages
),
user_friend_counts AS (
  SELECT
    au.user_id,
    COUNT(DISTINCT CASE
      WHEN f.user_id = au.user_id THEN f.friend_id
      WHEN f.friend_id = au.user_id THEN f.user_id
    END) as friend_count
  FROM active_users au
  LEFT JOIN friends f ON (f.user_id = au.user_id OR f.friend_id = au.user_id)
    AND f.status = 'accepted'
  GROUP BY au.user_id
)
SELECT
  AVG(friend_count) as mean_friends_per_active_user,
  'Mean friend connections per active user'
FROM user_friend_counts;

-- Summary of all analytics metrics in one query
SELECT
  (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'map_viewed') as map_viewed_events,
  (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'event_rsvped') as event_rsvped_events,
  (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'friend_request_sent') as friend_request_sent_events,
  (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'friend_request_accepted') as friend_request_accepted_events,
  (SELECT COUNT(*) FROM analytics_events WHERE event_name = 'chat_opened') as chat_opened_events;

-- ===========================================
-- ADDITIONAL USEFUL METRICS
-- ===========================================

-- User engagement timeline (when did users sign up?)
SELECT
  DATE(created_at) as signup_date,
  COUNT(*) as new_users
FROM profiles
WHERE email LIKE '%@stanford.edu'
GROUP BY DATE(created_at)
ORDER BY signup_date DESC;

-- Most active users (by analytics events)
SELECT
  p.name,
  p.email,
  COUNT(ae.id) as event_count
FROM profiles p
LEFT JOIN analytics_events ae ON p.id = ae.user_id
GROUP BY p.id, p.name, p.email
ORDER BY event_count DESC
LIMIT 10;

-- Most common analytics events
SELECT
  event_name,
  COUNT(*) as count
FROM analytics_events
GROUP BY event_name
ORDER BY count DESC
LIMIT 20;

-- Friend request acceptance rate
SELECT
  COUNT(CASE WHEN status = 'accepted' THEN 1 END)::float / NULLIF(COUNT(*), 0) * 100 as acceptance_rate_percent,
  'Friend request acceptance rate'
FROM friends;

-- Average messages per conversation
WITH conversation_counts AS (
  SELECT
    LEAST(sender_id, recipient_id) as user1,
    GREATEST(sender_id, recipient_id) as user2,
    COUNT(*) as message_count
  FROM messages
  GROUP BY user1, user2
)
SELECT
  AVG(message_count) as avg_messages_per_conversation,
  MIN(message_count) as min_messages,
  MAX(message_count) as max_messages,
  'Average messages per conversation'
FROM conversation_counts;

-- Events with most RSVPs
SELECT
  ue.title as event_title,
  ue.category,
  COUNT(er.id) as rsvp_count
FROM user_events ue
LEFT JOIN event_rsvps er ON ue.id::text = er.event_id
GROUP BY ue.id, ue.title, ue.category
ORDER BY rsvp_count DESC
LIMIT 10;

-- ===========================================
-- SUMMARY - ALL KEY METRICS IN ONE VIEW
-- ===========================================
SELECT
  (SELECT COUNT(*) FROM profiles WHERE email LIKE '%@stanford.edu') as total_users,
  (SELECT COUNT(*) FROM (
    SELECT DISTINCT user_id FROM event_rsvps
    UNION SELECT DISTINCT created_by FROM user_events
    UNION SELECT DISTINCT user_id FROM friends WHERE status IN ('pending', 'accepted')
    UNION SELECT DISTINCT friend_id FROM friends WHERE status = 'accepted'
    UNION SELECT DISTINCT sender_id FROM messages
    UNION SELECT DISTINCT recipient_id FROM messages
  ) active) as active_users,
  (SELECT COUNT(*) FROM user_events) as user_created_events,
  (SELECT COUNT(*) FROM event_rsvps) as total_rsvps,
  (SELECT COUNT(*) / 2 FROM friends WHERE status = 'accepted') as friend_connections,
  (SELECT COUNT(*) FROM messages) as messages_exchanged;
