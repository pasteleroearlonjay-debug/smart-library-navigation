-- Smart Library System - Library Members Setup for Supabase (FIXED VERSION)
-- Run this in Supabase SQL Editor to create the library_members table and populate it

-- ========================================
-- LIBRARY MEMBERS TABLE
-- ========================================

-- Create table only if it doesn't exist
CREATE TABLE IF NOT EXISTS library_members (
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

-- Add columns if they don't exist (for existing tables)
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS membership_id VARCHAR(20);
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS borrowed_count INTEGER DEFAULT 0;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS overdue_count INTEGER DEFAULT 0;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Active';

-- Create unique constraint for membership_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'library_members_membership_id_key' 
        AND table_name = 'library_members'
    ) THEN
        ALTER TABLE library_members ADD CONSTRAINT library_members_membership_id_key UNIQUE (membership_id);
    END IF;
END $$;

-- ========================================
-- MEMBER STATISTICS TABLE (Optional - for analytics)
-- ========================================

CREATE TABLE IF NOT EXISTS member_statistics (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT REFERENCES library_members(id) ON DELETE CASCADE,
    total_borrowed INTEGER DEFAULT 0,
    total_returned INTEGER DEFAULT 0,
    total_overdue INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- BORROWING RECORDS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS borrowing_records (
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
-- EMAIL NOTIFICATIONS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS email_notifications (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_library_members_email ON library_members(email);
CREATE INDEX IF NOT EXISTS idx_library_members_membership_id ON library_members(membership_id);
CREATE INDEX IF NOT EXISTS idx_library_members_status ON library_members(status);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_member_id ON borrowing_records(member_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_status ON borrowing_records(status);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_due_date ON borrowing_records(due_date);

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
-- CREATE TRIGGERS: Auto-update timestamps
-- ========================================

DROP TRIGGER IF EXISTS update_library_members_updated_at ON library_members;
CREATE TRIGGER update_library_members_updated_at 
    BEFORE UPDATE ON library_members
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_borrowing_records_updated_at ON borrowing_records;
CREATE TRIGGER update_borrowing_records_updated_at 
    BEFORE UPDATE ON borrowing_records
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- INSERT LIBRARY MEMBERS DATA
-- ========================================

-- Insert library members data
INSERT INTO library_members (name, email, password_hash, join_date, borrowed_count, overdue_count, status, membership_id) VALUES
('John Doe', 'john.doe@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-01-15', 2, 0, 'Active', 'LIB001'),
('Jane Smith', 'jane.smith@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-02-20', 1, 1, 'Active', 'LIB002'),
('Mike Johnson', 'mike.johnson@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-03-10', 0, 0, 'Active', 'LIB003'),
('Sarah Wilson', 'sarah.wilson@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-04-05', 3, 0, 'Suspended', 'LIB004')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    password_hash = EXCLUDED.password_hash,
    join_date = EXCLUDED.join_date,
    borrowed_count = EXCLUDED.borrowed_count,
    overdue_count = EXCLUDED.overdue_count,
    status = EXCLUDED.status,
    membership_id = EXCLUDED.membership_id,
    updated_at = CURRENT_TIMESTAMP;

-- ========================================
-- INSERT SAMPLE BORROWING RECORDS
-- ========================================

-- Clear existing borrowing records first to avoid conflicts
DELETE FROM borrowing_records;

-- John Doe's borrowed books (2 books)
INSERT INTO borrowing_records (member_id, book_title, borrowed_date, due_date, status) VALUES
(1, 'Algebra Fundamentals', '2024-01-10', '2024-01-24', 'borrowed'),
(1, 'Physics Principles', '2024-01-12', '2024-01-26', 'borrowed');

-- Jane Smith's borrowed books (1 book, 1 overdue)
INSERT INTO borrowing_records (member_id, book_title, borrowed_date, due_date, status) VALUES
(2, 'World History', '2023-12-01', '2023-12-15', 'overdue'),
(2, 'Chemistry Basics', '2024-01-05', '2024-01-19', 'borrowed');

-- Sarah Wilson's borrowed books (3 books)
INSERT INTO borrowing_records (member_id, book_title, borrowed_date, due_date, status) VALUES
(4, 'Computer Programming', '2024-01-08', '2024-01-22', 'borrowed'),
(4, 'Music Appreciation', '2024-01-09', '2024-01-23', 'borrowed'),
(4, 'Character Building', '2024-01-11', '2024-01-25', 'borrowed');

-- ========================================
-- CREATE VIEWS FOR EASY QUERYING
-- ========================================

-- View for member summary with borrowing statistics
CREATE OR REPLACE VIEW member_summary AS
SELECT 
    lm.id,
    lm.name,
    lm.email,
    lm.membership_id,
    lm.join_date,
    lm.borrowed_count,
    lm.overdue_count,
    lm.status,
    COUNT(br.id) as total_borrowings,
    COUNT(CASE WHEN br.status = 'overdue' THEN 1 END) as current_overdue,
    COUNT(CASE WHEN br.status = 'borrowed' THEN 1 END) as currently_borrowed
FROM library_members lm
LEFT JOIN borrowing_records br ON lm.id = br.member_id
GROUP BY lm.id, lm.name, lm.email, lm.membership_id, lm.join_date, lm.borrowed_count, lm.overdue_count, lm.status
ORDER BY lm.name;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if everything was created successfully
SELECT 'library_members' as table_name, COUNT(*) as record_count FROM library_members
UNION ALL
SELECT 'borrowing_records' as table_name, COUNT(*) as record_count FROM borrowing_records
UNION ALL
SELECT 'email_notifications' as table_name, COUNT(*) as record_count FROM email_notifications;

-- View all members
SELECT id, name, email, membership_id, status FROM library_members ORDER BY id;

-- View borrowing records
SELECT br.id, lm.name, br.book_title, br.status, br.due_date 
FROM borrowing_records br 
JOIN library_members lm ON br.member_id = lm.id 
ORDER BY br.id;

