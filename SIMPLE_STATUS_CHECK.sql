-- Simple script to find allowed status values
-- This will show us exactly what values are allowed

-- 1. Show the constraint definition
SELECT 'CONSTRAINT DEFINITION:' as info;
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'book_requests' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name = 'book_requests_status_check';

-- 2. Show current status values in the table
SELECT 'CURRENT STATUS VALUES:' as info;
SELECT DISTINCT status, COUNT(*) as count
FROM book_requests 
GROUP BY status
ORDER BY status;

-- 3. Show table structure
SELECT 'STATUS COLUMN INFO:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'book_requests' 
    AND column_name = 'status';

