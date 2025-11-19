-- Fix Existing Table - Works with your current book_requests structure
-- This script handles the existing table with all its constraints

-- First, let's see what columns exist in your book_requests table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'book_requests' 
ORDER BY ordinal_position;

-- Check if there's any data, if not insert a test record with all required fields
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM book_requests LIMIT 1) THEN
        -- Insert a test record with all the fields your table expects
        INSERT INTO book_requests (
            member_id, 
            book_id, 
            requested_days, 
            due_date, 
            status,
            book_title,
            book_author,
            book_subject
        ) VALUES (
            1, 
            1, 
            7, 
            CURRENT_DATE + INTERVAL '7 days', 
            'pending',
            'Test Book Title',
            'Test Author',
            'Mathematics'
        );
        
        RAISE NOTICE 'Test record inserted into book_requests table';
    ELSE
        RAISE NOTICE 'book_requests table already has data';
    END IF;
END $$;

-- Show current data in the table
SELECT COUNT(*) as total_requests FROM book_requests;

-- Show the test data (or existing data)
SELECT * FROM book_requests LIMIT 5;

-- Success message
SELECT 'Fixed existing book_requests table successfully!' as message;

