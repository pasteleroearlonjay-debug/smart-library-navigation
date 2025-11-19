-- Common SQL Queries for Smart Library System
-- Copy and paste these queries as needed

-- ========================================
-- BASIC BOOK QUERIES
-- ========================================

-- Get all books
SELECT * FROM books ORDER BY title;

-- Get all available books
SELECT * FROM books WHERE available = TRUE ORDER BY title;

-- Get all borrowed books
SELECT * FROM books WHERE available = FALSE ORDER BY title;

-- ========================================
-- SEARCH QUERIES
-- ========================================

-- Search by title
SELECT * FROM books WHERE title LIKE '%Algebra%';

-- Search by author
SELECT * FROM books WHERE author LIKE '%Smith%';

-- Search by subject
SELECT * FROM books WHERE subject = 'Mathematics';

-- Universal search (title, author, OR subject)
SELECT * FROM books 
WHERE title LIKE '%search_term%' 
   OR author LIKE '%search_term%' 
   OR subject LIKE '%search_term%'
ORDER BY title;

-- ========================================
-- SUBJECT-BASED QUERIES (For LED Control)
-- ========================================

-- Get all Mathematics books (LED 1)
SELECT * FROM books WHERE subject = 'Mathematics';

-- Get all Science books (LED 2)
SELECT * FROM books WHERE subject = 'Science';

-- Get all Social Studies books (LED 3)
SELECT * FROM books WHERE subject = 'Social Studies';

-- Get all PEHM books (LED 4)
SELECT * FROM books WHERE subject = 'PEHM';

-- Get all Values Education books (LED 5)
SELECT * FROM books WHERE subject = 'Values Education';

-- Get all TLE books (LED 6)
SELECT * FROM books WHERE subject = 'TLE';

-- ========================================
-- STATISTICS & REPORTS
-- ========================================

-- Count books by subject with availability stats
SELECT 
    subject,
    COUNT(*) as total_books,
    SUM(CASE WHEN available = TRUE THEN 1 ELSE 0 END) as available_books,
    SUM(CASE WHEN available = FALSE THEN 1 ELSE 0 END) as borrowed_books
FROM books 
GROUP BY subject
ORDER BY subject;

-- Get total book count
SELECT COUNT(*) as total_books FROM books;

-- Get availability summary
SELECT 
    available,
    COUNT(*) as count,
    CONCAT(ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM books), 1), '%') as percentage
FROM books 
GROUP BY available;

-- ========================================
-- UPDATE QUERIES
-- ========================================

-- Mark a book as borrowed
UPDATE books SET available = FALSE WHERE id = 1;

-- Mark a book as returned
UPDATE books SET available = TRUE WHERE id = 1;

-- Update book information
UPDATE books 
SET title = 'New Title', 
    author = 'New Author',
    isbn = '978-0-123456-99-9'
WHERE id = 1;

-- ========================================
-- INSERT QUERIES
-- ========================================

-- Add a new book
INSERT INTO books (title, author, subject, isbn, available) 
VALUES ('New Book Title', 'Author Name', 'Mathematics', '978-0-123456-99-9', TRUE);

-- Add multiple books at once
INSERT INTO books (title, author, subject, isbn, available) VALUES
('Book 1', 'Author 1', 'Science', '978-0-111111-11-1', TRUE),
('Book 2', 'Author 2', 'Mathematics', '978-0-222222-22-2', TRUE),
('Book 3', 'Author 3', 'TLE', '978-0-333333-33-3', TRUE);

-- ========================================
-- DELETE QUERIES
-- ========================================

-- Delete a specific book by ID
DELETE FROM books WHERE id = 1;

-- Delete all books by subject
-- DELETE FROM books WHERE subject = 'Mathematics';

-- Delete all borrowed books
-- DELETE FROM books WHERE available = FALSE;

-- ========================================
-- ADVANCED QUERIES
-- ========================================

-- Find duplicate books by title
SELECT title, COUNT(*) as count 
FROM books 
GROUP BY title 
HAVING COUNT(*) > 1;

-- Books added in the last 7 days
SELECT * FROM books 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY created_at DESC;

-- Books updated recently
SELECT * FROM books 
WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY updated_at DESC;

-- Get random book (for featured book display)
SELECT * FROM books WHERE available = TRUE ORDER BY RAND() LIMIT 1;

-- Most common author
SELECT author, COUNT(*) as book_count 
FROM books 
GROUP BY author 
ORDER BY book_count DESC 
LIMIT 5;




