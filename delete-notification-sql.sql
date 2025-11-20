-- Delete Notification for Leo N Lansangan
-- Run this in Supabase SQL Editor

-- Option 1: Delete by user email and title (Safest - most specific)
DELETE FROM user_notifications
WHERE member_id IN (
    SELECT id FROM library_members WHERE email = 'leonacinintal@gmail.com'
)
AND title = 'Welcome to Smart Library!';

-- Option 2: Delete by user email and type
DELETE FROM user_notifications
WHERE member_id IN (
    SELECT id FROM library_members WHERE email = 'leonacinintal@gmail.com'
)
AND type = 'welcome';

-- Option 3: Delete ALL notifications for Leo N Lansangan (use with caution!)
-- DELETE FROM user_notifications
-- WHERE member_id IN (
--     SELECT id FROM library_members WHERE email = 'leonacinintal@gmail.com'
-- );

-- Option 4: Delete by notification ID (if you know the ID)
-- First, find the ID:
SELECT 
    un.id,
    un.title,
    un.type,
    un.created_at,
    lm.name,
    lm.email
FROM user_notifications un
JOIN library_members lm ON un.member_id = lm.id
WHERE lm.email = 'leonacinintal@gmail.com'
AND un.title = 'Welcome to Smart Library!';

-- Then delete using the ID (replace 123 with actual ID):
-- DELETE FROM user_notifications WHERE id = 123;

-- Verify deletion (check if notification still exists)
SELECT 
    un.id,
    un.title,
    un.type,
    lm.name,
    lm.email
FROM user_notifications un
JOIN library_members lm ON un.member_id = lm.id
WHERE lm.email = 'leonacinintal@gmail.com';

