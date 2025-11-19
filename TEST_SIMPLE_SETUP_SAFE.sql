-- Test Simple Setup - Safe version that handles dependencies
-- This version works even if there are dependent views

-- Check if book_requests table exists and create it if it doesn't
CREATE TABLE IF NOT EXISTS book_requests (
    id SERIAL PRIMARY KEY,
    member_id INTEGER,
    book_id INTEGER,
    requested_days INTEGER,
    due_date DATE,
    status TEXT DEFAULT 'pending',
    request_date DATE DEFAULT CURRENT_DATE,
    processed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check if there's any data, if not insert a test record
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM book_requests LIMIT 1) THEN
        INSERT INTO book_requests (member_id, book_id, requested_days, due_date, status) 
        VALUES (1, 1, 7, CURRENT_DATE + INTERVAL '7 days', 'pending');
        
        RAISE NOTICE 'Test record inserted into book_requests table';
    ELSE
        RAISE NOTICE 'book_requests table already has data';
    END IF;
END $$;

-- Test that we can select from it
SELECT COUNT(*) as total_requests FROM book_requests;

-- Show the test data
SELECT * FROM book_requests;

-- Success message
SELECT 'Safe book_requests table setup completed successfully!' as message;

