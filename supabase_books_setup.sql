-- Smart Library System - Supabase Setup
-- Run this in Supabase SQL Editor
-- This will create the books table and related tables for your existing Supabase database

-- ========================================
-- BOOKS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL CHECK (subject IN ('Mathematics', 'Science', 'Social Studies', 'PEHM', 'Values Education', 'TLE')),
    isbn VARCHAR(20) UNIQUE,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- LED STATES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS led_states (
    led_pin INTEGER PRIMARY KEY,
    subject VARCHAR(50) NOT NULL,
    state VARCHAR(10) DEFAULT 'off' CHECK (state IN ('on', 'off')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SEARCH LOGS TABLE (Optional - for analytics)
-- ========================================

CREATE TABLE IF NOT EXISTS search_logs (
    id BIGSERIAL PRIMARY KEY,
    search_query VARCHAR(255) NOT NULL,
    results_count INTEGER DEFAULT 0,
    subjects_found JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_available ON books(available);
CREATE INDEX IF NOT EXISTS idx_led_states_state ON led_states(state);
CREATE INDEX IF NOT EXISTS idx_led_states_subject ON led_states(subject);

-- ========================================
-- INSERT SAMPLE BOOKS DATA
-- ========================================

INSERT INTO books (title, author, subject, isbn, available) VALUES
-- Mathematics books (LED 1 - Blue)
('Algebra Fundamentals', 'John Smith', 'Mathematics', '978-0-123456-01-1', TRUE),
('Calculus Made Easy', 'Mary Johnson', 'Mathematics', '978-0-123456-01-2', TRUE),
('Geometry Basics', 'David Wilson', 'Mathematics', '978-0-123456-01-3', FALSE),

-- Science books (LED 2 - Green)
('Physics Principles', 'Sarah Brown', 'Science', '978-0-123456-02-1', TRUE),
('Chemistry Basics', 'Michael Davis', 'Science', '978-0-123456-02-2', TRUE),
('Biology Essentials', 'Lisa Garcia', 'Science', '978-0-123456-02-3', TRUE),

-- Social Studies books (LED 3 - Yellow)
('World History', 'Robert Martinez', 'Social Studies', '978-0-123456-03-1', TRUE),
('Philippine History', 'Ana Rodriguez', 'Social Studies', '978-0-123456-03-2', TRUE),
('Geography Today', 'Carlos Lopez', 'Social Studies', '978-0-123456-03-3', FALSE),

-- PEHM books (LED 4 - Red)
('Physical Education Guide', 'Maria Santos', 'PEHM', '978-0-123456-04-1', TRUE),
('Health and Wellness', 'Jose Cruz', 'PEHM', '978-0-123456-04-2', TRUE),
('Music Appreciation', 'Carmen Reyes', 'PEHM', '978-0-123456-04-3', TRUE),

-- Values Education books (LED 5 - Purple)
('Moral Values', 'Pedro Torres', 'Values Education', '978-0-123456-05-1', TRUE),
('Character Building', 'Rosa Mendoza', 'Values Education', '978-0-123456-05-2', TRUE),
('Ethics and Society', 'Manuel Flores', 'Values Education', '978-0-123456-05-3', FALSE),

-- TLE books (LED 6 - Orange)
('Computer Programming', 'Luz Gonzales', 'TLE', '978-0-123456-06-1', TRUE),
('Cooking Basics', 'Antonio Rivera', 'TLE', '978-0-123456-06-2', TRUE),
('Electrical Wiring', 'Elena Morales', 'TLE', '978-0-123456-06-3', TRUE);

-- ========================================
-- INITIALIZE LED STATES (All Off)
-- ========================================

INSERT INTO led_states (led_pin, subject, state) VALUES
(1, 'Mathematics', 'off'),
(2, 'Science', 'off'),
(3, 'Social Studies', 'off'),
(4, 'PEHM', 'off'),
(5, 'Values Education', 'off'),
(6, 'TLE', 'off');

-- ========================================
-- CREATE FUNCTION: Auto-update updated_at timestamp
-- ========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE TRIGGER: Auto-update timestamp on book updates
-- ========================================

DROP TRIGGER IF EXISTS update_books_updated_at ON books;
CREATE TRIGGER update_books_updated_at 
    BEFORE UPDATE ON books
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CREATE FUNCTION: Book Search
-- ========================================

CREATE OR REPLACE FUNCTION search_books(search_term VARCHAR(255))
RETURNS TABLE (
    id BIGINT,
    title VARCHAR(255),
    author VARCHAR(255),
    subject VARCHAR(50),
    available BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id, b.title, b.author, b.subject, b.available, b.created_at
    FROM books b
    WHERE b.title ILIKE '%' || search_term || '%'
       OR b.author ILIKE '%' || search_term || '%'
       OR b.subject ILIKE '%' || search_term || '%'
    ORDER BY b.title ASC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE FUNCTION: Update LED State
-- ========================================

CREATE OR REPLACE FUNCTION update_led_state(
    p_led_pin INTEGER,
    p_subject VARCHAR(50),
    p_state VARCHAR(10)
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO led_states (led_pin, subject, state, last_updated)
    VALUES (p_led_pin, p_subject, p_state, CURRENT_TIMESTAMP)
    ON CONFLICT (led_pin) DO UPDATE SET
        state = EXCLUDED.state,
        subject = EXCLUDED.subject,
        last_updated = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- CREATE VIEW: Book Summary by Subject
-- ========================================

CREATE OR REPLACE VIEW book_summary AS
SELECT 
    subject,
    COUNT(*) as total_books,
    SUM(CASE WHEN available = TRUE THEN 1 ELSE 0 END) as available_books,
    SUM(CASE WHEN available = FALSE THEN 1 ELSE 0 END) as borrowed_books
FROM books 
GROUP BY subject
ORDER BY subject;

-- ========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- Optional - uncomment if you want to enable RLS
-- ========================================

-- Enable RLS on tables
-- ALTER TABLE books ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE led_states ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
-- CREATE POLICY "Allow public read access" ON books FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON led_states FOR SELECT USING (true);

-- Create policies for authenticated users to modify
-- CREATE POLICY "Allow authenticated users to insert" ON books FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Allow authenticated users to update" ON books FOR UPDATE USING (auth.role() = 'authenticated');

-- ========================================
-- VERIFICATION QUERIES
-- Run these to verify everything was created successfully
-- ========================================

-- Check if books were inserted
-- SELECT COUNT(*) as total_books FROM books;

-- View all books by subject
-- SELECT * FROM book_summary;

-- Test search function
-- SELECT * FROM search_books('Math');

-- Check LED states
-- SELECT * FROM led_states;




