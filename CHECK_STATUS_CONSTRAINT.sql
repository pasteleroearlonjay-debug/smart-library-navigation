-- Check Status Constraint - See what status values are allowed
-- This will help us understand the check constraint on book_requests

-- Check the check constraints on book_requests table
SELECT 'CHECK CONSTRAINTS ON BOOK_REQUESTS:' as info;
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'book_requests' 
    AND tc.constraint_type = 'CHECK';

-- Check what status values currently exist in the table
SELECT 'CURRENT STATUS VALUES:' as info;
SELECT DISTINCT status, COUNT(*) as count
FROM book_requests 
GROUP BY status
ORDER BY status;

-- Check the data type and constraints on the status column
SELECT 'STATUS COLUMN DETAILS:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'book_requests' 
    AND column_name = 'status';

