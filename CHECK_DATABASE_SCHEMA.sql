-- Database Schema Check Script
-- This script will help identify what tables and columns exist in your current database

-- 1. Check what tables exist
SELECT 'EXISTING TABLES:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Check borrowing_records table structure (if it exists)
SELECT 'BORROWING_RECORDS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'borrowing_records' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check library_members table structure (if it exists)
SELECT 'LIBRARY_MEMBERS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'library_members' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check books table structure (if it exists)
SELECT 'BOOKS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'books' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Check book_requests table structure (if it exists)
SELECT 'BOOK_REQUESTS COLUMNS:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'book_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check foreign key constraints
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
ORDER BY tc.table_name, kcu.column_name;

-- 7. Sample data check (if tables exist)
SELECT 'SAMPLE DATA CHECK:' as info;

-- Check if borrowing_records has data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'borrowing_records') THEN
        RAISE NOTICE 'borrowing_records table exists and has % rows', (SELECT COUNT(*) FROM borrowing_records);
    ELSE
        RAISE NOTICE 'borrowing_records table does not exist';
    END IF;
END $$;

-- Check if library_members has data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'library_members') THEN
        RAISE NOTICE 'library_members table exists and has % rows', (SELECT COUNT(*) FROM library_members);
    ELSE
        RAISE NOTICE 'library_members table does not exist';
    END IF;
END $$;

-- Check if books table has data
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'books') THEN
        RAISE NOTICE 'books table exists and has % rows', (SELECT COUNT(*) FROM books);
    ELSE
        RAISE NOTICE 'books table does not exist';
    END IF;
END $$;

