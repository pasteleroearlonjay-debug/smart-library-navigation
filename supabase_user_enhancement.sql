-- Smart Library System - User Enhancement for Supabase
-- Run this in Supabase SQL Editor to enhance the library_members table for user authentication

-- ========================================
-- ENHANCE LIBRARY MEMBERS TABLE
-- ========================================

-- Add new columns for enhanced user authentication
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- ========================================
-- BOOK REQUESTS TABLE
-- ========================================

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

-- ========================================
-- USER NOTIFICATIONS TABLE
-- ========================================

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

-- ========================================
-- EMAIL VERIFICATION TABLE
-- ========================================

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

-- ========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ========================================

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

-- ========================================
-- CREATE TRIGGERS FOR AUTO-UPDATE
-- ========================================

-- Trigger for book_requests updated_at
DROP TRIGGER IF EXISTS update_book_requests_updated_at ON book_requests;
CREATE TRIGGER update_book_requests_updated_at 
    BEFORE UPDATE ON book_requests
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- CREATE VIEWS FOR EASY QUERYING
-- ========================================

-- View for user dashboard data
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
    COUNT(CASE WHEN br.status = 'borrowed' THEN 1 END) as current_borrowed,
    COUNT(CASE WHEN br.status = 'overdue' THEN 1 END) as current_overdue,
    COUNT(CASE WHEN br.due_date <= CURRENT_DATE + INTERVAL '3 days' AND br.status = 'borrowed' THEN 1 END) as upcoming_due,
    COUNT(CASE WHEN br.due_date < CURRENT_DATE AND br.status = 'borrowed' THEN 1 END) as overdue_count_new,
    COUNT(CASE WHEN brn.status = 'ready' THEN 1 END) as ready_requests
FROM library_members lm
LEFT JOIN borrowing_records br ON lm.id = br.member_id
LEFT JOIN book_requests brn ON lm.id = brn.member_id
GROUP BY lm.id, lm.name, lm.email, lm.membership_id, lm.profile_picture_url, lm.email_verified, 
         lm.borrowed_count, lm.overdue_count, lm.status, lm.last_login;

-- View for user notifications summary
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

-- ========================================
-- SAMPLE DATA FOR TESTING
-- ========================================

-- Update existing members with verification status
UPDATE library_members SET 
    email_verified = true,
    last_login = CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE email IN ('john.doe@email.com', 'jane.smith@email.com');

-- Insert sample book requests
INSERT INTO book_requests (member_id, book_title, book_author, subject, status, ready_date) VALUES
(1, 'Advanced Calculus', 'Dr. Mathematics', 'Mathematics', 'ready', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
(2, 'Physics Laboratory Manual', 'Prof. Physics', 'Science', 'pending', NULL),
(4, 'Computer Programming Basics', 'Tech Author', 'TLE', 'ready', CURRENT_TIMESTAMP - INTERVAL '2 hours');

-- Insert sample notifications
INSERT INTO user_notifications (member_id, type, title, message, is_read) VALUES
(1, 'book_ready', 'Book Ready for Collection', 'Your requested book "Advanced Calculus" is ready for pickup!', false),
(1, 'deadline_reminder', 'Book Due Soon', 'Your book "Algebra Fundamentals" is due in 2 days.', false),
(2, 'deadline_reminder', 'Overdue Book Notice', 'Your book "World History" is overdue. Please return it soon.', false),
(4, 'book_ready', 'Book Ready for Collection', 'Your requested book "Computer Programming Basics" is ready for pickup!', false);

-- ========================================
-- FUNCTIONS FOR NOTIFICATION MANAGEMENT
-- ========================================

-- Function to create deadline reminder notifications
CREATE OR REPLACE FUNCTION create_deadline_reminders()
RETURNS void AS $$
BEGIN
    INSERT INTO user_notifications (member_id, type, title, message, related_borrowing_record_id, is_read)
    SELECT 
        br.member_id,
        'deadline_reminder',
        'Book Due Soon',
        'Your book "' || br.book_title || '" is due on ' || br.due_date || '. Please return it on time.',
        br.id,
        false
    FROM borrowing_records br
    JOIN library_members lm ON br.member_id = lm.id
    WHERE br.status = 'borrowed' 
    AND br.due_date <= CURRENT_DATE + INTERVAL '3 days'
    AND br.due_date > CURRENT_DATE
    AND NOT EXISTS (
        SELECT 1 FROM user_notifications un 
        WHERE un.member_id = br.member_id 
        AND un.type = 'deadline_reminder' 
        AND un.related_borrowing_record_id = br.id
        AND un.created_at::date = CURRENT_DATE
    );
END;
$$ LANGUAGE plpgsql;

-- Function to create book ready notifications
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

-- ========================================
-- VERIFICATION QUERIES
-- Run these to verify everything was created successfully
-- ========================================

-- Check enhanced library members structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'library_members' 
-- ORDER BY ordinal_position;

-- View user dashboard data
-- SELECT * FROM user_dashboard_data WHERE id = 1;

-- View notifications for a user
-- SELECT * FROM user_notifications WHERE member_id = 1 ORDER BY created_at DESC;

-- View book requests
-- SELECT * FROM book_requests WHERE member_id = 1;

-- ========================================
-- NOTES
-- ========================================

-- NEW FEATURES ADDED:
-- 1. Profile picture support
-- 2. Email verification system
-- 3. Password reset functionality
-- 4. Book request system
-- 5. User notification system
-- 6. Email verification tracking
-- 7. Last login tracking
-- 8. Automated notification functions
-- 9. Dashboard data views
-- 10. Enhanced indexing for performance

-- USAGE:
-- - Profile pictures can be stored as URLs or file paths
-- - Email verification uses tokens with expiration
-- - Notifications support different types (deadline, book ready, etc.)
-- - Book requests track the full lifecycle from request to collection
-- - Dashboard views provide quick access to user data

