-- Books Table for Smart Library System
-- MySQL/MariaDB Version
-- Simple and ready to use

-- Create database
CREATE DATABASE IF NOT EXISTS smart_library;
USE smart_library;

-- Books table - stores all book information
CREATE TABLE books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    isbn VARCHAR(20) UNIQUE,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (subject IN ('Mathematics', 'Science', 'Social Studies', 'PEHM', 'Values Education', 'TLE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert all 18 sample books
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

-- Create indexes for better search performance
CREATE INDEX idx_books_subject ON books(subject);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_available ON books(available);

-- Useful queries for your application:

-- 1. Search books by title, author, or subject
-- SELECT * FROM books 
-- WHERE title LIKE '%search_term%' 
--    OR author LIKE '%search_term%' 
--    OR subject LIKE '%search_term%';

-- 2. Get all available books
-- SELECT * FROM books WHERE available = TRUE;

-- 3. Get books by subject
-- SELECT * FROM books WHERE subject = 'Mathematics';

-- 4. Count books per subject
-- SELECT subject, COUNT(*) as total_books, 
--        SUM(available) as available_books,
--        COUNT(*) - SUM(available) as borrowed_books
-- FROM books 
-- GROUP BY subject;

-- 5. Update book availability (when borrowed/returned)
-- UPDATE books SET available = FALSE WHERE id = 1;
-- UPDATE books SET available = TRUE WHERE id = 1;




