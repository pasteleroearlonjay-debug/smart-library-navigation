-- Force remove ALL duplicate books
-- This script is more aggressive and will remove duplicates more reliably
-- Run this in Supabase SQL Editor

-- Step 1: Show all duplicates before removal
SELECT 
  'BEFORE REMOVAL - Duplicates found:' as info,
  LOWER(TRIM(title)) as normalized_title,
  LOWER(TRIM(author)) as normalized_author,
  LOWER(TRIM(subject)) as normalized_subject,
  COUNT(*) as duplicate_count,
  array_agg(id ORDER BY id) as book_ids,
  array_agg(title ORDER BY id) as titles
FROM books
GROUP BY LOWER(TRIM(title)), LOWER(TRIM(author)), LOWER(TRIM(subject))
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;

-- Step 2: Delete duplicates, keeping only the lowest ID
-- This uses a CTE for better reliability
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY 
        LOWER(TRIM(COALESCE(title, ''))), 
        LOWER(TRIM(COALESCE(author, ''))), 
        LOWER(TRIM(COALESCE(subject, '')))
      ORDER BY id ASC
    ) as row_num
  FROM books
)
DELETE FROM books
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- Step 3: Verify no duplicates remain
SELECT 
  'AFTER REMOVAL - Remaining duplicates:' as info,
  LOWER(TRIM(title)) as normalized_title,
  LOWER(TRIM(author)) as normalized_author,
  LOWER(TRIM(subject)) as normalized_subject,
  COUNT(*) as count
FROM books
GROUP BY LOWER(TRIM(title)), LOWER(TRIM(author)), LOWER(TRIM(subject))
HAVING COUNT(*) > 1;

-- Step 4: Show summary
SELECT 
  'Summary' as info,
  COUNT(*) as total_books,
  COUNT(DISTINCT LOWER(TRIM(title)) || '|' || LOWER(TRIM(author)) || '|' || LOWER(TRIM(subject))) as unique_books
FROM books;

-- Success message
SELECT '✅ All duplicate books have been removed!' as message;
SELECT '📝 Kept the first occurrence (lowest ID) of each duplicate group.' as note;


