-- Add Book Detail Columns to book_requests table
-- This script adds columns for storing book information directly in the request

-- Add book detail columns if they don't exist
DO $$
BEGIN
    -- Add book_title column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'book_title') THEN
        ALTER TABLE book_requests ADD COLUMN book_title TEXT;
        RAISE NOTICE 'Added book_title column to book_requests';
    END IF;
    
    -- Add book_author column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'book_author') THEN
        ALTER TABLE book_requests ADD COLUMN book_author TEXT;
        RAISE NOTICE 'Added book_author column to book_requests';
    END IF;
    
    -- Add book_subject column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'book_subject') THEN
        ALTER TABLE book_requests ADD COLUMN book_subject TEXT;
        RAISE NOTICE 'Added book_subject column to book_requests';
    END IF;
    
    -- Add user_name column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'user_name') THEN
        ALTER TABLE book_requests ADD COLUMN user_name TEXT;
        RAISE NOTICE 'Added user_name column to book_requests';
    END IF;
    
    -- Add user_email column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'user_email') THEN
        ALTER TABLE book_requests ADD COLUMN user_email TEXT;
        RAISE NOTICE 'Added user_email column to book_requests';
    END IF;
END $$;

-- Show the updated table structure
SELECT 'UPDATED BOOK_REQUESTS TABLE STRUCTURE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'book_requests' 
ORDER BY ordinal_position;

-- Success message
SELECT 'Book detail columns added successfully!' as message;

