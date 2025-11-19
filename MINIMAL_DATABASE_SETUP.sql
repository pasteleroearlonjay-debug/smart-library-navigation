-- Minimal Database Setup for Book Borrowing System
-- This script only creates the book_requests table and functions
-- It works with your existing books table structure

-- Step 1: Create book_requests table
CREATE TABLE IF NOT EXISTS book_requests (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    requested_days INTEGER NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending',
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    processed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create simple functions
CREATE OR REPLACE FUNCTION approve_book_request_simple(request_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Simply update the request status
    UPDATE book_requests 
    SET status = 'approved', processed_date = CURRENT_DATE
    WHERE id = request_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decline_book_request_simple(request_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Simply update the request status
    UPDATE book_requests 
    SET status = 'declined', processed_date = CURRENT_DATE
    WHERE id = request_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Insert sample book requests (using existing book IDs)
-- Note: This assumes you have books in your existing books table
-- If you don't have books yet, this will be skipped
DO $$
DECLARE
    book_count INTEGER;
BEGIN
    -- Check if books table has any data
    SELECT COUNT(*) INTO book_count FROM books;
    
    IF book_count > 0 THEN
        -- Insert sample requests using existing books
        INSERT INTO book_requests (member_id, book_id, requested_days, due_date, status) VALUES
        (1, 1, 7, CURRENT_DATE + INTERVAL '7 days', 'pending'),
        (2, 2, 14, CURRENT_DATE + INTERVAL '14 days', 'pending')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample book requests inserted using existing books';
    ELSE
        RAISE NOTICE 'No books found in books table. Skipping sample requests.';
    END IF;
END $$;

-- Success message
SELECT 'Minimal book borrowing system setup completed successfully!' as message;

