-- Test Simple Setup - Just create the table without any constraints
-- This is the most basic version possible

-- Drop table if it exists (to start fresh)
DROP TABLE IF EXISTS book_requests;

-- Create the simplest possible book_requests table
CREATE TABLE book_requests (
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

-- Insert a test record to verify it works
INSERT INTO book_requests (member_id, book_id, requested_days, due_date, status) 
VALUES (1, 1, 7, CURRENT_DATE + INTERVAL '7 days', 'pending');

-- Test that we can select from it
SELECT * FROM book_requests;

-- Success message
SELECT 'Simple book_requests table created and tested successfully!' as message;

