-- Add Missing Columns - Safest approach
-- This script only adds columns if they don't exist, preserving all existing data

-- Add columns to book_requests table if they don't exist
DO $$
BEGIN
    -- Add member_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'member_id') THEN
        ALTER TABLE book_requests ADD COLUMN member_id INTEGER;
        RAISE NOTICE 'Added member_id column to book_requests';
    END IF;
    
    -- Add book_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'book_id') THEN
        ALTER TABLE book_requests ADD COLUMN book_id INTEGER;
        RAISE NOTICE 'Added book_id column to book_requests';
    END IF;
    
    -- Add requested_days column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'requested_days') THEN
        ALTER TABLE book_requests ADD COLUMN requested_days INTEGER;
        RAISE NOTICE 'Added requested_days column to book_requests';
    END IF;
    
    -- Add due_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'due_date') THEN
        ALTER TABLE book_requests ADD COLUMN due_date DATE;
        RAISE NOTICE 'Added due_date column to book_requests';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'status') THEN
        ALTER TABLE book_requests ADD COLUMN status TEXT DEFAULT 'pending';
        RAISE NOTICE 'Added status column to book_requests';
    END IF;
    
    -- Add request_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'request_date') THEN
        ALTER TABLE book_requests ADD COLUMN request_date DATE DEFAULT CURRENT_DATE;
        RAISE NOTICE 'Added request_date column to book_requests';
    END IF;
    
    -- Add processed_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'processed_date') THEN
        ALTER TABLE book_requests ADD COLUMN processed_date DATE;
        RAISE NOTICE 'Added processed_date column to book_requests';
    END IF;
    
    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'book_requests' AND column_name = 'created_at') THEN
        ALTER TABLE book_requests ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Added created_at column to book_requests';
    END IF;
END $$;

-- Show the current structure of book_requests table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'book_requests' 
ORDER BY ordinal_position;

-- Check if table has any data
SELECT COUNT(*) as total_requests FROM book_requests;

-- Success message
SELECT 'Missing columns added to book_requests table successfully!' as message;

