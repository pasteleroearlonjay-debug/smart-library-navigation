-- Check Existing Data - Just examine what's already in your book_requests table
-- This script won't modify anything, just shows what you have

-- Show the structure of your book_requests table
SELECT 'TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'book_requests' 
ORDER BY ordinal_position;

-- Show how many records you have
SELECT 'RECORD COUNT:' as info;
SELECT COUNT(*) as total_requests FROM book_requests;

-- Show the first few records
SELECT 'SAMPLE DATA:' as info;
SELECT * FROM book_requests LIMIT 5;

-- Show requests by status
SELECT 'REQUESTS BY STATUS:' as info;
SELECT status, COUNT(*) as count 
FROM book_requests 
GROUP BY status;

-- Show recent requests
SELECT 'RECENT REQUESTS:' as info;
SELECT id, member_id, book_id, status, request_date, created_at
FROM book_requests 
ORDER BY created_at DESC 
LIMIT 10;

