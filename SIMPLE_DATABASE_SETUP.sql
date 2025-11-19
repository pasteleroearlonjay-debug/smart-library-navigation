-- Simple Database Setup for Book Borrowing System
-- This script creates only the essential tables needed for the book borrowing feature

-- Step 1: Create books table
CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    author VARCHAR NOT NULL,
    subject VARCHAR NOT NULL,
    isbn VARCHAR UNIQUE,
    available BOOLEAN DEFAULT true,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create book_requests table
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

-- Step 3: Insert sample books (check what columns exist first)
DO $$
BEGIN
    -- Check if quantity column exists in books table
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'books' AND column_name = 'quantity') THEN
        -- Insert with quantity column
        INSERT INTO books (title, author, subject, isbn, available, quantity) VALUES
        ('Advanced Mathematics', 'Dr. Smith', 'Mathematics', '978-1234567890', true, 3),
        ('Physics Principles', 'Prof. Johnson', 'Science', '978-1234567891', true, 2),
        ('World History', 'Dr. Brown', 'Social Studies', '978-1234567892', true, 4),
        ('Chemistry Basics', 'Prof. Davis', 'Science', '978-1234567893', false, 0),
        ('Health & Fitness', 'Dr. Wilson', 'PEHM', '978-1234567894', true, 2),
        ('Moral Values', 'Prof. Taylor', 'Values Education', '978-1234567895', true, 3),
        ('Computer Programming', 'Dr. Martinez', 'TLE', '978-1234567896', true, 2),
        ('Algebra Fundamentals', 'Prof. Lee', 'Mathematics', '978-1234567897', true, 4),
        ('Biology Concepts', 'Dr. Garcia', 'Science', '978-1234567898', true, 3),
        ('Philippine History', 'Prof. Rodriguez', 'Social Studies', '978-1234567899', true, 2)
        ON CONFLICT (isbn) DO NOTHING;
    ELSE
        -- Insert without quantity column
        INSERT INTO books (title, author, subject, isbn, available) VALUES
        ('Advanced Mathematics', 'Dr. Smith', 'Mathematics', '978-1234567890', true),
        ('Physics Principles', 'Prof. Johnson', 'Science', '978-1234567891', true),
        ('World History', 'Dr. Brown', 'Social Studies', '978-1234567892', true),
        ('Chemistry Basics', 'Prof. Davis', 'Science', '978-1234567893', false),
        ('Health & Fitness', 'Dr. Wilson', 'PEHM', '978-1234567894', true),
        ('Moral Values', 'Prof. Taylor', 'Values Education', '978-1234567895', true),
        ('Computer Programming', 'Dr. Martinez', 'TLE', '978-1234567896', true),
        ('Algebra Fundamentals', 'Prof. Lee', 'Mathematics', '978-1234567897', true),
        ('Biology Concepts', 'Dr. Garcia', 'Science', '978-1234567898', true),
        ('Philippine History', 'Prof. Rodriguez', 'Social Studies', '978-1234567899', true)
        ON CONFLICT (isbn) DO NOTHING;
    END IF;
END $$;

-- Step 4: Create simple functions (without complex joins)
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

-- Success message
SELECT 'Simple book borrowing system setup completed successfully!' as message;
