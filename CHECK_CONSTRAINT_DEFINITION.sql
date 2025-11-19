-- Check the exact constraint definition to see what status values are allowed
SELECT 'CHECK CONSTRAINT DEFINITION:' as info;
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'book_requests' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name = 'book_requests_status_check';

