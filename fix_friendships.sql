-- Fix existing one-way friendships by creating reverse records
-- This will create the missing reverse friendship records for all accepted friendships

INSERT INTO friends (user_id, friend_id, status, created_at)
SELECT
  f1.friend_id as user_id,
  f1.user_id as friend_id,
  'accepted' as status,
  f1.created_at
FROM friends f1
WHERE f1.status = 'accepted'
  AND NOT EXISTS (
    -- Check if reverse record already exists
    SELECT 1
    FROM friends f2
    WHERE f2.user_id = f1.friend_id
      AND f2.friend_id = f1.user_id
  );

-- Verify the results
SELECT
  u1.name as user_name,
  u2.name as friend_name,
  f.status,
  f.created_at
FROM friends f
JOIN profiles u1 ON f.user_id = u1.id
JOIN profiles u2 ON f.friend_id = u2.id
WHERE f.status = 'accepted'
ORDER BY f.created_at DESC;
