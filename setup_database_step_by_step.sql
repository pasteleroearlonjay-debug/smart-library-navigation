-- Smart Library System - Step by Step Database Setup
-- Run these commands ONE BY ONE in Supabase SQL Editor

-- ========================================
-- STEP 1: Check what tables exist
-- ========================================
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ========================================
-- STEP 2: Drop existing tables if they exist (to start fresh)
-- ========================================
DROP TABLE IF EXISTS borrowing_records CASCADE;
DROP TABLE IF EXISTS email_notifications CASCADE;
DROP TABLE IF EXISTS member_statistics CASCADE;
DROP TABLE IF EXISTS library_members CASCADE;

-- ========================================
-- STEP 3: Create library_members table
-- ========================================
CREATE TABLE library_members (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    join_date DATE NOT NULL,
    borrowed_count INTEGER DEFAULT 0,
    overdue_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Inactive')),
    membership_id VARCHAR(20) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- STEP 4: Create borrowing_records table
-- ========================================
CREATE TABLE borrowing_records (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
    book_id BIGINT,
    book_title VARCHAR(255),
    borrowed_date DATE NOT NULL,
    due_date DATE NOT NULL,
    returned_date DATE,
    status VARCHAR(20) DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- STEP 5: Create email_notifications table
-- ========================================
CREATE TABLE email_notifications (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- ========================================
-- STEP 6: Create indexes
-- ========================================
CREATE INDEX idx_library_members_email ON library_members(email);
CREATE INDEX idx_library_members_membership_id ON library_members(membership_id);
CREATE INDEX idx_library_members_status ON library_members(status);
CREATE INDEX idx_borrowing_records_member_id ON borrowing_records(member_id);
CREATE INDEX idx_borrowing_records_status ON borrowing_records(status);
CREATE INDEX idx_borrowing_records_due_date ON borrowing_records(due_date);

-- ========================================
-- STEP 7: Insert sample library members
-- ========================================
INSERT INTO library_members (name, email, password_hash, join_date, borrowed_count, overdue_count, status, membership_id) VALUES
('John Doe', 'john.doe@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-01-15', 2, 0, 'Active', 'LIB001'),
('Jane Smith', 'jane.smith@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-02-20', 1, 1, 'Active', 'LIB002'),
('Mike Johnson', 'mike.johnson@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-03-10', 0, 0, 'Active', 'LIB003'),
('Sarah Wilson', 'sarah.wilson@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-04-05', 3, 0, 'Suspended', 'LIB004');

-- ========================================
-- STEP 8: Insert sample borrowing records
-- ========================================
INSERT INTO borrowing_records (member_id, book_title, borrowed_date, due_date, status) VALUES
(1, 'Algebra Fundamentals', '2024-01-10', '2024-01-24', 'borrowed'),
(1, 'Physics Principles', '2024-01-12', '2024-01-26', 'borrowed'),
(2, 'World History', '2023-12-01', '2023-12-15', 'overdue'),
(2, 'Chemistry Basics', '2024-01-05', '2024-01-19', 'borrowed'),
(4, 'Computer Programming', '2024-01-08', '2024-01-22', 'borrowed'),
(4, 'Music Appreciation', '2024-01-09', '2024-01-23', 'borrowed'),
(4, 'Character Building', '2024-01-11', '2024-01-25', 'borrowed');

-- ========================================
-- STEP 9: Verify everything was created
-- ========================================
SELECT 'library_members' as table_name, COUNT(*) as record_count FROM library_members
UNION ALL
SELECT 'borrowing_records' as table_name, COUNT(*) as record_count FROM borrowing_records
UNION ALL
SELECT 'email_notifications' as table_name, COUNT(*) as record_count FROM email_notifications;

-- ========================================
-- STEP 10: Test the structure
-- ========================================
SELECT 
    lm.id, 
    lm.name, 
    lm.email, 
    lm.membership_id,
    COUNT(br.id) as borrowed_books
FROM library_members lm
LEFT JOIN borrowing_records br ON lm.id = br.member_id
GROUP BY lm.id, lm.name, lm.email, lm.membership_id
ORDER BY lm.id;

