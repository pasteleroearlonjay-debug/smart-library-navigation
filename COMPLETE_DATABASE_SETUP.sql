-- ========================================
-- COMPLETE DATABASE SETUP FOR SMART LIBRARY SYSTEM
-- Copy and paste this ENTIRE code into Supabase SQL Editor and run it
-- ========================================

-- STEP 1: Clean slate - Drop all existing tables
DROP TABLE IF EXISTS borrowing_records CASCADE;
DROP TABLE IF EXISTS email_notifications CASCADE;
DROP TABLE IF EXISTS member_statistics CASCADE;
DROP TABLE IF EXISTS library_members CASCADE;

-- STEP 2: Create library_members table
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

-- STEP 3: Create borrowing_records table
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

-- STEP 4: Create email_notifications table
CREATE TABLE email_notifications (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- STEP 5: Create indexes for performance
CREATE INDEX idx_library_members_email ON library_members(email);
CREATE INDEX idx_library_members_membership_id ON library_members(membership_id);
CREATE INDEX idx_library_members_status ON library_members(status);
CREATE INDEX idx_borrowing_records_member_id ON borrowing_records(member_id);
CREATE INDEX idx_borrowing_records_status ON borrowing_records(status);
CREATE INDEX idx_borrowing_records_due_date ON borrowing_records(due_date);

-- STEP 6: Insert sample library members
INSERT INTO library_members (name, email, password_hash, join_date, borrowed_count, overdue_count, status, membership_id) VALUES
('John Doe', 'john.doe@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-01-15', 2, 0, 'Active', 'LIB001'),
('Jane Smith', 'jane.smith@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-02-20', 1, 1, 'Active', 'LIB002'),
('Mike Johnson', 'mike.johnson@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-03-10', 0, 0, 'Active', 'LIB003'),
('Sarah Wilson', 'sarah.wilson@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-04-05', 3, 0, 'Suspended', 'LIB004');

-- STEP 7: Insert sample borrowing records
INSERT INTO borrowing_records (member_id, book_title, borrowed_date, due_date, status) VALUES
(1, 'Algebra Fundamentals', '2024-01-10', '2024-01-24', 'borrowed'),
(1, 'Physics Principles', '2024-01-12', '2024-01-26', 'borrowed'),
(2, 'World History', '2023-12-01', '2023-12-15', 'overdue'),
(2, 'Chemistry Basics', '2024-01-05', '2024-01-19', 'borrowed'),
(4, 'Computer Programming', '2024-01-08', '2024-01-22', 'borrowed'),
(4, 'Music Appreciation', '2024-01-09', '2024-01-23', 'borrowed'),
(4, 'Character Building', '2024-01-11', '2024-01-25', 'borrowed');

-- STEP 8: Create function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 9: Create triggers for auto-updating timestamps
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

-- STEP 10: Create view for member summary
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
-- ENHANCED USER FEATURES
-- ========================================

-- STEP 11: Add new columns to library_members for enhanced user features
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- STEP 12: Create book_requests table
CREATE TABLE IF NOT EXISTS book_requests (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
    book_title VARCHAR(255) NOT NULL,
    book_author VARCHAR(255),
    subject VARCHAR(50) CHECK (subject IN ('Mathematics', 'Science', 'Social Studies', 'PEHM', 'Values Education', 'TLE')),
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'collected', 'cancelled')),
    ready_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 13: Create user_notifications table
CREATE TABLE IF NOT EXISTS user_notifications (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('deadline_reminder', 'book_ready', 'overdue_notice', 'welcome', 'email_verification')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_book_id BIGINT,
    related_borrowing_record_id BIGINT,
    related_request_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- STEP 14: Create email_verifications table
CREATE TABLE IF NOT EXISTS email_verifications (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL REFERENCES library_members(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- STEP 15: Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_library_members_email_verified ON library_members(email_verified);
CREATE INDEX IF NOT EXISTS idx_library_members_email_verification_token ON library_members(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_library_members_last_login ON library_members(last_login);
CREATE INDEX IF NOT EXISTS idx_book_requests_member_id ON book_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_status ON book_requests(status);
CREATE INDEX IF NOT EXISTS idx_book_requests_ready_date ON book_requests(ready_date);
CREATE INDEX IF NOT EXISTS idx_user_notifications_member_id ON user_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_member_id ON email_verifications(member_id);

-- STEP 16: Create triggers for new tables
DROP TRIGGER IF EXISTS update_book_requests_updated_at ON book_requests;
CREATE TRIGGER update_book_requests_updated_at 
    BEFORE UPDATE ON book_requests
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 17: Update existing members with verification status
UPDATE library_members SET 
    email_verified = true,
    last_login = CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE email IN ('john.doe@email.com', 'jane.smith@email.com');

-- STEP 18: Insert sample book requests
INSERT INTO book_requests (member_id, book_title, book_author, subject, status, ready_date) VALUES
(1, 'Advanced Calculus', 'Dr. Mathematics', 'Mathematics', 'ready', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(2, 'Physics Laboratory Manual', 'Prof. Physics', 'Science', 'pending', NULL),
(4, 'Computer Programming Basics', 'Tech Author', 'TLE', 'ready', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- STEP 19: Insert sample notifications
INSERT INTO user_notifications (member_id, type, title, message, is_read) VALUES
(1, 'book_ready', 'Book Ready for Collection', 'Your requested book "Advanced Calculus" is ready for pickup!', false),
(1, 'deadline_reminder', 'Book Due Soon', 'Your book "Algebra Fundamentals" is due in 2 days.', false),
(2, 'deadline_reminder', 'Overdue Book Notice', 'Your book "World History" is overdue. Please return it soon.', false),
(4, 'book_ready', 'Book Ready for Collection', 'Your requested book "Computer Programming Basics" is ready for pickup!', false);

-- STEP 20: Create enhanced views
CREATE OR REPLACE VIEW user_dashboard_data AS
SELECT 
    lm.id,
    lm.name,
    lm.email,
    lm.membership_id,
    lm.profile_picture_url,
    lm.email_verified,
    lm.borrowed_count,
    lm.overdue_count,
    lm.status,
    lm.last_login,
    lm.borrowed_count as current_borrowed,
    lm.overdue_count as current_overdue,
    0 as upcoming_due,
    lm.overdue_count as overdue_count_new,
    COUNT(CASE WHEN brn.status = 'ready' THEN 1 END) as ready_requests
FROM library_members lm
LEFT JOIN book_requests brn ON lm.id = brn.member_id
GROUP BY lm.id, lm.name, lm.email, lm.membership_id, lm.profile_picture_url, lm.email_verified, 
         lm.borrowed_count, lm.overdue_count, lm.status, lm.last_login;

CREATE OR REPLACE VIEW user_notifications_summary AS
SELECT 
    un.member_id,
    COUNT(*) as total_notifications,
    COUNT(CASE WHEN un.is_read = false THEN 1 END) as unread_notifications,
    COUNT(CASE WHEN un.type = 'deadline_reminder' AND un.is_read = false THEN 1 END) as unread_deadlines,
    COUNT(CASE WHEN un.type = 'book_ready' AND un.is_read = false THEN 1 END) as unread_ready_books,
    MAX(un.created_at) as latest_notification
FROM user_notifications un
GROUP BY un.member_id;

-- STEP 21: Create notification functions
CREATE OR REPLACE FUNCTION create_book_ready_notification(request_id BIGINT)
RETURNS void AS $$
DECLARE
    request_data RECORD;
BEGIN
    SELECT * INTO request_data FROM book_requests WHERE id = request_id;
    
    INSERT INTO user_notifications (member_id, type, title, message, related_request_id, is_read)
    VALUES (
        request_data.member_id,
        'book_ready',
        'Book Ready for Collection',
        'Your requested book "' || request_data.book_title || '" is ready for pickup at the library!',
        request_id,
        false
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_deadline_reminders()
RETURNS void AS $$
BEGIN
    INSERT INTO user_notifications (member_id, type, title, message, is_read)
    SELECT 
        lm.id,
        'deadline_reminder',
        'Library Notice',
        'Please check your borrowed books for any upcoming due dates.',
        false
    FROM library_members lm
    WHERE lm.overdue_count > 0
    AND NOT EXISTS (
        SELECT 1 FROM user_notifications un 
        WHERE un.member_id = lm.id 
        AND un.type = 'deadline_reminder'
        AND un.created_at::date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check if everything was created successfully
SELECT 'library_members' as table_name, COUNT(*) as record_count FROM library_members
UNION ALL
SELECT 'borrowing_records' as table_name, COUNT(*) as record_count FROM borrowing_records
UNION ALL
SELECT 'email_notifications' as table_name, COUNT(*) as record_count FROM email_notifications
UNION ALL
SELECT 'book_requests' as table_name, COUNT(*) as record_count FROM book_requests
UNION ALL
SELECT 'user_notifications' as table_name, COUNT(*) as record_count FROM user_notifications
UNION ALL
SELECT 'email_verifications' as table_name, COUNT(*) as record_count FROM email_verifications;

-- Test the structure
SELECT 
    lm.id, 
    lm.name, 
    lm.email, 
    lm.membership_id,
    lm.email_verified,
    COUNT(br.id) as borrowed_books,
    COUNT(brn.id) as book_requests,
    COUNT(un.id) as notifications
FROM library_members lm
LEFT JOIN borrowing_records br ON lm.id = br.member_id
LEFT JOIN book_requests brn ON lm.id = brn.member_id
LEFT JOIN user_notifications un ON lm.id = un.member_id
GROUP BY lm.id, lm.name, lm.email, lm.membership_id, lm.email_verified
ORDER BY lm.id;

-- Show all tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

