-- Remove duplicate books from the books table
-- This keeps the first occurrence (lowest ID) and removes duplicates
-- Run this in Supabase SQL Editor

-- First, let's see what duplicates exist (using normalized comparison)
SELECT 
  LOWER(TRIM(title)) as normalized_title,
  LOWER(TRIM(author)) as normalized_author,
  LOWER(TRIM(subject)) as normalized_subject,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY id) as book_ids
FROM books
GROUP BY LOWER(TRIM(title)), LOWER(TRIM(author)), LOWER(TRIM(subject))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Remove duplicates, keeping only the one with the lowest ID
-- This deletes all duplicates except the first one (lowest ID)
-- Uses normalized comparison to catch duplicates with different casing/spacing
DELETE FROM books
WHERE id IN (
  SELECT id
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (
        PARTITION BY LOWER(TRIM(title)), LOWER(TRIM(author)), LOWER(TRIM(subject))
        ORDER BY id
      ) as row_num
    FROM books
  ) t
  WHERE row_num > 1
);

-- Verify duplicates are removed
SELECT 
  title, 
  author, 
  subject,
  COUNT(*) as count
FROM books
GROUP BY title, author, subject
HAVING COUNT(*) > 1;

-- Success message
SELECT '✅ Duplicate books removed successfully!' as message;
SELECT '📝 Kept the first occurrence (lowest ID) of each duplicate.' as note;

