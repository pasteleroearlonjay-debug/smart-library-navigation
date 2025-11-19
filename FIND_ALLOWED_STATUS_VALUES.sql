-- Find the exact status values allowed by the check constraint
-- This will help us understand what values we can actually use

-- Method 1: Check the constraint definition
SELECT 'CHECK CONSTRAINT DEFINITION:' as info;
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'book_requests' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name LIKE '%status%';

-- Method 2: Check what status values currently exist in the table
SELECT 'CURRENT STATUS VALUES IN TABLE:' as info;
SELECT DISTINCT status, COUNT(*) as count
FROM book_requests 
GROUP BY status
ORDER BY status;

-- Method 3: Try to understand the constraint by looking at the table definition
SELECT 'TABLE DEFINITION:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'book_requests' 
    AND column_name = 'status';

-- Method 4: Check if there are any triggers or functions that might affect status
SELECT 'TRIGGERS ON BOOK_REQUESTS:' as info;
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'book_requests';

-- Method 5: Look for any enum types that might be used for status
SELECT 'ENUM TYPES:' as info;
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%status%' OR t.typname LIKE '%request%'
ORDER BY t.typname, e.enumsortorder;

