-- Smart Library System Database Schema
-- PostgreSQL Database for ESP32 LED Control System

-- Create database (run this separately if database doesn't exist)
-- CREATE DATABASE smart_library;

-- Connect to the database
\c smart_library;

-- Books table - stores all book information
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL CHECK (subject IN ('Mathematics', 'Science', 'Social Studies', 'PEHM', 'Values Education', 'TLE')),
    isbn VARCHAR(20) UNIQUE,
    available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LED states table - tracks current LED states for ESP32
CREATE TABLE led_states (
    led_pin INTEGER PRIMARY KEY,
    subject VARCHAR(50) NOT NULL,
    state VARCHAR(10) DEFAULT 'off' CHECK (state IN ('on', 'off')),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Search logs table - tracks search activity
CREATE TABLE search_logs (
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255) NOT NULL,
    results_count INTEGER DEFAULT 0,
    subjects_found JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table - for user management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('admin', 'librarian', 'student')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borrowing records table
CREATE TABLE borrowing_records (
    id SERIAL PRIMARY KEY,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    borrowed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date DATE NOT NULL,
    returned_at TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue'))
);

-- Create indexes for better performance
CREATE INDEX idx_books_subject ON books(subject);
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_books_author ON books(author);
CREATE INDEX idx_books_available ON books(available);
CREATE INDEX idx_led_states_state ON led_states(state);
CREATE INDEX idx_led_states_subject ON led_states(subject);
CREATE INDEX idx_search_logs_query ON search_logs(search_query);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_borrowing_records_book_id ON borrowing_records(book_id);
CREATE INDEX idx_borrowing_records_user_id ON borrowing_records(user_id);
CREATE INDEX idx_borrowing_records_status ON borrowing_records(status);
CREATE INDEX idx_borrowing_records_due_date ON borrowing_records(due_date);

-- Insert sample data for books
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
('Electrical Wiring', 'Elena Morales', 'TLE', '978-0-123456-06-3', TRUE);

-- Initialize LED states (all off)
INSERT INTO led_states (led_pin, subject, state) VALUES
(1, 'Mathematics', 'off'),
(2, 'Science', 'off'),
(3, 'Social Studies', 'off'),
(4, 'PEHM', 'off'),
(5, 'Values Education', 'off'),
(6, 'TLE', 'off');

-- Insert sample users
INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@library.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('librarian1', 'librarian@library.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'librarian'),
('student1', 'student@school.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student');

-- Create views for easier querying
CREATE VIEW book_summary AS
SELECT 
    subject,
    COUNT(*) as total_books,
    SUM(CASE WHEN available = TRUE THEN 1 ELSE 0 END) as available_books,
    SUM(CASE WHEN available = FALSE THEN 1 ELSE 0 END) as borrowed_books
FROM books 
GROUP BY subject;

CREATE VIEW recent_searches AS
SELECT 
    search_query,
    results_count,
    subjects_found,
    created_at
FROM search_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create stored procedure for book search (PostgreSQL function)
CREATE OR REPLACE FUNCTION search_books(search_term VARCHAR(255))
RETURNS TABLE (
    id INTEGER,
    title VARCHAR(255),
    author VARCHAR(255),
    subject VARCHAR(50),
    available BOOLEAN,
    created_at TIMESTAMP
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

-- Create stored procedure for LED control (PostgreSQL function)
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
