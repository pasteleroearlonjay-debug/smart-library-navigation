-- Diagnose Book Requests Issues
-- This script will help identify what's wrong with the book requests setup

-- 1. Check if book_requests table exists
SELECT 'BOOK_REQUESTS TABLE CHECK:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'book_requests' 
    AND table_schema = 'public'
) as table_exists;

-- 2. Check if library_members table exists
SELECT 'LIBRARY_MEMBERS TABLE CHECK:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'library_members' 
    AND table_schema = 'public'
) as table_exists;

-- 3. Check if books table exists
SELECT 'BOOKS TABLE CHECK:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'books' 
    AND table_schema = 'public'
) as table_exists;

-- 4. If book_requests exists, check its structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_requests') THEN
        RAISE NOTICE 'BOOK_REQUESTS TABLE STRUCTURE:';
        PERFORM * FROM book_requests LIMIT 0; -- This will show column info in some clients
    ELSE
        RAISE NOTICE 'BOOK_REQUESTS TABLE DOES NOT EXIST';
    END IF;
END $$;

-- 5. Check foreign key constraints on book_requests
SELECT 'FOREIGN KEY CONSTRAINTS:' as info;
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND tc.table_name = 'book_requests';

-- 6. Try to count records in each table
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_requests') THEN
        RAISE NOTICE 'BOOK_REQUESTS: % rows', (SELECT COUNT(*) FROM book_requests);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'library_members') THEN
        RAISE NOTICE 'LIBRARY_MEMBERS: % rows', (SELECT COUNT(*) FROM library_members);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'books') THEN
        RAISE NOTICE 'BOOKS: % rows', (SELECT COUNT(*) FROM books);
    END IF;
END $$;

