-- Add bio, year, major fields to profiles table
-- Run this in Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS year TEXT,
ADD COLUMN IF NOT EXISTS major TEXT;

-- Note: bio column already exists in the schema, so no need to add it again

-- Verify the columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('bio', 'year', 'major')
ORDER BY column_name;
