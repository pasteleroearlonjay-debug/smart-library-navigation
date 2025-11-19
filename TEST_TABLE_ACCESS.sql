-- Test Table Access - Simple queries to verify your book_requests table works
-- This will help us understand what's working and what's not

-- Test 1: Basic count query
SELECT 'TEST 1 - BASIC COUNT:' as info;
SELECT COUNT(*) as total_requests FROM book_requests;

-- Test 2: Select all columns
SELECT 'TEST 2 - ALL COLUMNS:' as info;
SELECT * FROM book_requests LIMIT 3;

-- Test 3: Select specific columns only
SELECT 'TEST 3 - SPECIFIC COLUMNS:' as info;
SELECT id, member_id, book_id, status, request_date, requested_days, due_date, created_at 
FROM book_requests 
LIMIT 3;

-- Test 4: Check if we can order by created_at
SELECT 'TEST 4 - ORDER BY CREATED_AT:' as info;
SELECT id, status, created_at 
FROM book_requests 
ORDER BY created_at DESC 
LIMIT 3;

-- Test 5: Check status distribution
SELECT 'TEST 5 - STATUS DISTRIBUTION:' as info;
SELECT status, COUNT(*) as count 
FROM book_requests 
GROUP BY status;

-- Success message
SELECT 'Table access tests completed!' as message;

