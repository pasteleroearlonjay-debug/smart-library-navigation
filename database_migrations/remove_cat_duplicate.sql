-- Remove duplicate "cat" book
-- This will keep ID 97 and delete ID 98 (or whichever is the duplicate)
-- Run this in Supabase SQL Editor

-- First, show the duplicates
SELECT 
  id,
  title,
  author,
  subject,
  catalog_no,
  quantity,
  shelf,
  created_at
FROM books
WHERE LOWER(TRIM(title)) = 'cat'
  AND LOWER(TRIM(author)) = 'sad'
  AND LOWER(TRIM(subject)) = 'mathematics'
ORDER BY id;

-- Delete the duplicate (keeps the one with lowest ID, deletes the rest)
DELETE FROM books
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY id ASC) as row_num
    FROM books
    WHERE LOWER(TRIM(title)) = 'cat'
      AND LOWER(TRIM(author)) = 'sad'
      AND LOWER(TRIM(subject)) = 'mathematics'
  ) t
  WHERE row_num > 1
);

-- Verify only one remains
SELECT 
  id,
  title,
  author,
  subject,
  catalog_no,
  quantity,
  shelf
FROM books
WHERE LOWER(TRIM(title)) = 'cat'
  AND LOWER(TRIM(author)) = 'sad'
  AND LOWER(TRIM(subject)) = 'mathematics';

-- Success message
SELECT '✅ Duplicate "cat" book removed! Kept the one with lowest ID.' as message;




