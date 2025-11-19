-- Check ID Types - See what type of IDs your tables use
-- This will help us understand the UUID vs bigint issue

-- Check library_members table structure
SELECT 'LIBRARY_MEMBERS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'library_members' 
ORDER BY ordinal_position;

-- Check books table structure  
SELECT 'BOOKS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'books' 
ORDER BY ordinal_position;

-- Check book_requests table structure
SELECT 'BOOK_REQUESTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'book_requests' 
ORDER BY ordinal_position;

-- Show sample data from library_members to see ID format
SELECT 'SAMPLE LIBRARY_MEMBERS DATA:' as info;
SELECT id, name, email FROM library_members LIMIT 3;

-- Show sample data from books to see ID format
SELECT 'SAMPLE BOOKS DATA:' as info;
SELECT id, title, author FROM books LIMIT 3;

