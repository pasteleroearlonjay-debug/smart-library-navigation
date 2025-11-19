-- Book Borrowing System Database Setup (Compatible Version)
-- This script sets up the necessary tables for the book borrowing functionality
-- Compatible with existing database schema

-- 1. Create books table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    author VARCHAR NOT NULL,
    subject VARCHAR NOT NULL CHECK (subject IN ('Mathematics', 'Science', 'Social Studies', 'PEHM', 'Values Education', 'TLE')),
    isbn VARCHAR UNIQUE,
    available BOOLEAN DEFAULT true,
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create book_requests table
CREATE TABLE IF NOT EXISTS book_requests (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    requested_days INTEGER NOT NULL CHECK (requested_days > 0 AND requested_days <= 30),
    due_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    processed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints (only if tables exist)
    CONSTRAINT fk_book_requests_member FOREIGN KEY (member_id) REFERENCES library_members(id) ON DELETE CASCADE,
    CONSTRAINT fk_book_requests_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- 3. Check if borrowing_records table exists and what columns it has
-- If it exists, we'll add missing columns instead of recreating it

-- First, let's check if borrowing_records has book_id column
DO $$
BEGIN
    -- Check if borrowing_records table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'borrowing_records') THEN
        -- Check if book_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'book_id') THEN
            -- Add book_id column if it doesn't exist
            ALTER TABLE borrowing_records ADD COLUMN book_id BIGINT;
        END IF;
        
        -- Check if member_id column exists (some schemas might use user_id)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'member_id') THEN
            -- Add member_id column if it doesn't exist
            ALTER TABLE borrowing_records ADD COLUMN member_id BIGINT;
        END IF;
        
        -- Check if borrowed_date column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'borrowed_date') THEN
            ALTER TABLE borrowing_records ADD COLUMN borrowed_date DATE DEFAULT CURRENT_DATE;
        END IF;
        
        -- Check if returned_date column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'returned_date') THEN
            ALTER TABLE borrowing_records ADD COLUMN returned_date DATE;
        END IF;
        
        -- Check if status column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'status') THEN
            ALTER TABLE borrowing_records ADD COLUMN status VARCHAR DEFAULT 'borrowed';
        END IF;
        
        -- Check if created_at column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'created_at') THEN
            ALTER TABLE borrowing_records ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
        
        -- Check if updated_at column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'updated_at') THEN
            ALTER TABLE borrowing_records ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
    ELSE
        -- Create borrowing_records table if it doesn't exist
        CREATE TABLE borrowing_records (
            id BIGSERIAL PRIMARY KEY,
            member_id BIGINT NOT NULL,
            book_id BIGINT NOT NULL,
            borrowed_date DATE NOT NULL DEFAULT CURRENT_DATE,
            due_date DATE NOT NULL,
            returned_date DATE,
            status VARCHAR NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            
            -- Foreign key constraints
            CONSTRAINT fk_borrowing_records_member FOREIGN KEY (member_id) REFERENCES library_members(id) ON DELETE CASCADE,
            CONSTRAINT fk_borrowing_records_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
        );
    END IF;
END $$;

-- 4. Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_book_requests_member_id ON book_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_book_id ON book_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_status ON book_requests(status);
CREATE INDEX IF NOT EXISTS idx_book_requests_date ON book_requests(request_date);

CREATE INDEX IF NOT EXISTS idx_borrowing_records_member_id ON borrowing_records(member_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_book_id ON borrowing_records(book_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_status ON borrowing_records(status);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_due_date ON borrowing_records(due_date);

CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject);
CREATE INDEX IF NOT EXISTS idx_books_available ON books(available);

-- 5. Insert sample books data (only if table is empty)
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

-- 6. Create triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables (only if they don't exist)
DO $$
BEGIN
    -- Books table trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_books_updated_at') THEN
        CREATE TRIGGER update_books_updated_at
            BEFORE UPDATE ON books
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Book requests table trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_book_requests_updated_at') THEN
        CREATE TRIGGER update_book_requests_updated_at
            BEFORE UPDATE ON book_requests
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    -- Borrowing records table trigger
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_borrowing_records_updated_at') THEN
        CREATE TRIGGER update_borrowing_records_updated_at
            BEFORE UPDATE ON borrowing_records
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 7. Create a view for book request summary (only if it doesn't exist)
CREATE OR REPLACE VIEW book_request_summary AS
SELECT 
    br.id,
    br.member_id,
    lm.name as member_name,
    lm.email as member_email,
    br.book_id,
    b.title as book_title,
    b.author as book_author,
    b.subject as book_subject,
    br.requested_days,
    br.due_date,
    br.status,
    br.request_date,
    br.processed_date
FROM book_requests br
JOIN library_members lm ON br.member_id = lm.id
JOIN books b ON br.book_id = b.id;

-- 8. Create a function to approve a book request (only if it doesn't exist)
CREATE OR REPLACE FUNCTION approve_book_request(request_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    request_record RECORD;
BEGIN
    -- Get the request details
    SELECT * INTO request_record 
    FROM book_requests 
    WHERE id = request_id AND status = 'pending';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update the request status
    UPDATE book_requests 
    SET status = 'approved', processed_date = CURRENT_DATE
    WHERE id = request_id;
    
    -- Create a borrowing record (only if borrowing_records table has the right columns)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'book_id') THEN
        INSERT INTO borrowing_records (member_id, book_id, borrowed_date, due_date, status)
        VALUES (request_record.member_id, request_record.book_id, CURRENT_DATE, request_record.due_date, 'borrowed');
    END IF;
    
    -- Update book availability (reduce quantity by 1)
    UPDATE books 
    SET quantity = quantity - 1, available = (quantity - 1 > 0)
    WHERE id = request_record.book_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. Create a function to decline a book request (only if it doesn't exist)
CREATE OR REPLACE FUNCTION decline_book_request(request_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update the request status
    UPDATE book_requests 
    SET status = 'declined', processed_date = CURRENT_DATE
    WHERE id = request_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 10. Create a function to return a book (only if it doesn't exist)
CREATE OR REPLACE FUNCTION return_book(borrowing_record_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    record_details RECORD;
BEGIN
    -- Check if borrowing_records table has the right columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'borrowing_records' AND column_name = 'book_id') THEN
        RETURN FALSE;
    END IF;
    
    -- Get the borrowing record details
    SELECT * INTO record_details 
    FROM borrowing_records 
    WHERE id = borrowing_record_id AND status = 'borrowed';
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update the borrowing record
    UPDATE borrowing_records 
    SET status = 'returned', returned_date = CURRENT_DATE
    WHERE id = borrowing_record_id;
    
    -- Update book availability (increase quantity by 1)
    UPDATE books 
    SET quantity = quantity + 1, available = true
    WHERE id = record_details.book_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Book borrowing system database setup completed successfully!' as message;

