-- Use existing status values from the table
-- This will show us what status values are actually being used

-- Get all unique status values currently in the table
SELECT DISTINCT status 
FROM book_requests 
ORDER BY status;

-- Show count for each status
SELECT 
    status,
    COUNT(*) as count,
    MIN(request_date) as earliest_request,
    MAX(request_date) as latest_request
FROM book_requests 
GROUP BY status
ORDER BY status;

