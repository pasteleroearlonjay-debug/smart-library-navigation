-- Smart Library System - Shelf Management Database Setup
-- This script creates the necessary tables for the new shelf management functionality
-- Run this in your database (PostgreSQL/Supabase recommended)

-- ========================================
-- SHELVES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS shelves (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., "Shelf 1", "Shelf 2", etc.
    title VARCHAR(255) NOT NULL, -- Custom shelf title
    author VARCHAR(255) NOT NULL, -- Shelf author/creator
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- SHELF_BOOKS TABLE (Many-to-Many relationship)
-- ========================================

CREATE TABLE IF NOT EXISTS shelf_books (
    id BIGSERIAL PRIMARY KEY,
    shelf_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    CONSTRAINT fk_shelf_books_shelf FOREIGN KEY (shelf_id) REFERENCES shelves(id) ON DELETE CASCADE,
    CONSTRAINT fk_shelf_books_book FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    
    -- Ensure unique book per shelf
    CONSTRAINT unique_book_per_shelf UNIQUE (shelf_id, book_id)
);

-- ========================================
-- UPDATE BOOKS TABLE (if needed)
-- ========================================

-- Ensure books table exists with proper structure
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
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_shelves_name ON shelves(name);
CREATE INDEX IF NOT EXISTS idx_shelves_title ON shelves(title);
CREATE INDEX IF NOT EXISTS idx_shelf_books_shelf_id ON shelf_books(shelf_id);
CREATE INDEX IF NOT EXISTS idx_shelf_books_book_id ON shelf_books(book_id);
CREATE INDEX IF NOT EXISTS idx_books_subject ON books(subject);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);

-- ========================================
-- INSERT DEFAULT SHELF
-- ========================================

-- Insert the default "Shelf 1" if it doesn't exist
INSERT INTO shelves (name, title, author, description) 
VALUES ('Shelf 1', 'Default Subject Areas', 'System', 'Default shelf for the 6 subject areas with LED control')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- SAMPLE DATA (Optional)
-- ========================================

-- Insert some sample books if they don't exist
INSERT INTO books (title, author, subject, isbn, available) VALUES
-- Mathematics books
('Algebra Fundamentals', 'John Smith', 'Mathematics', '978-0-123456-01-1', TRUE),
('Calculus Made Easy', 'Mary Johnson', 'Mathematics', '978-0-123456-01-2', TRUE),
('Geometry Basics', 'David Wilson', 'Mathematics', '978-0-123456-01-3', FALSE),

-- Science books
('Physics Principles', 'Sarah Brown', 'Science', '978-0-123456-02-1', TRUE),
('Chemistry Basics', 'Michael Davis', 'Science', '978-0-123456-02-2', TRUE),
('Biology Essentials', 'Lisa Garcia', 'Science', '978-0-123456-02-3', TRUE),

-- Social Studies books
('World History', 'Robert Martinez', 'Social Studies', '978-0-123456-03-1', TRUE),
('Philippine History', 'Ana Rodriguez', 'Social Studies', '978-0-123456-03-2', TRUE),
('Geography Today', 'Carlos Lopez', 'Social Studies', '978-0-123456-03-3', FALSE),

-- PEHM books
('Physical Education Guide', 'Maria Santos', 'PEHM', '978-0-123456-04-1', TRUE),
('Health and Wellness', 'Jose Cruz', 'PEHM', '978-0-123456-04-2', TRUE),
('Music Appreciation', 'Carmen Reyes', 'PEHM', '978-0-123456-04-3', TRUE),

-- Values Education books
('Moral Values', 'Pedro Torres', 'Values Education', '978-0-123456-05-1', TRUE),
('Character Building', 'Rosa Mendoza', 'Values Education', '978-0-123456-05-2', TRUE),
('Ethics and Society', 'Manuel Flores', 'Values Education', '978-0-123456-05-3', FALSE),

-- TLE books
('Computer Programming', 'Luz Gonzales', 'TLE', '978-0-123456-06-1', TRUE),
('Cooking Basics', 'Antonio Rivera', 'TLE', '978-0-123456-06-2', TRUE),
('Electrical Wiring', 'Elena Morales', 'TLE', '978-0-123456-06-3', TRUE)
ON CONFLICT (isbn) DO NOTHING;

-- ========================================
-- USEFUL QUERIES FOR THE APPLICATION
-- ========================================

-- Get all shelves with book counts
-- SELECT s.*, COUNT(sb.book_id) as book_count 
-- FROM shelves s 
-- LEFT JOIN shelf_books sb ON s.id = sb.shelf_id 
-- GROUP BY s.id, s.name, s.title, s.author, s.description, s.created_at, s.updated_at 
-- ORDER BY s.name;

-- Get books in a specific shelf
-- SELECT b.*, sb.added_at 
-- FROM books b 
-- JOIN shelf_books sb ON b.id = sb.book_id 
-- WHERE sb.shelf_id = ? 
-- ORDER BY sb.added_at DESC;

-- Get next shelf number
-- SELECT COALESCE(MAX(CAST(SUBSTRING(name FROM 'Shelf (\d+)') AS INTEGER)), 0) + 1 as next_shelf_number 
-- FROM shelves 
-- WHERE name LIKE 'Shelf %';
