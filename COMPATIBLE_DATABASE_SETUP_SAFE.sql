-- ========================================
-- COMPATIBLE DATABASE SETUP - SAFE VERSION
-- This version is completely safe and won't cause foreign key violations
-- ========================================

-- STEP 1: Add missing columns to existing library_members table
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS membership_id VARCHAR(20) UNIQUE;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255);
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP WITH TIME ZONE;
ALTER TABLE library_members ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- STEP 2: Check if borrowing_records has member_id column, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'borrowing_records' 
        AND column_name = 'member_id'
    ) THEN
        ALTER TABLE borrowing_records ADD COLUMN member_id BIGINT;
    END IF;
END $$;

-- STEP 3: Create book_requests table
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

-- STEP 4: Create user_notifications table (separate from email_notifications)
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

-- STEP 5: Create email_verifications table
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

-- STEP 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_library_members_email ON library_members(email);
CREATE INDEX IF NOT EXISTS idx_library_members_membership_id ON library_members(membership_id);
CREATE INDEX IF NOT EXISTS idx_library_members_status ON library_members(status);
CREATE INDEX IF NOT EXISTS idx_library_members_email_verified ON library_members(email_verified);
CREATE INDEX IF NOT EXISTS idx_library_members_email_verification_token ON library_members(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_library_members_last_login ON library_members(last_login);

-- Create indexes for borrowing_records
CREATE INDEX IF NOT EXISTS idx_borrowing_records_member_id ON borrowing_records(member_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_user_id ON borrowing_records(user_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_status ON borrowing_records(status);
CREATE INDEX IF NOT EXISTS idx_borrowing_records_due_date ON borrowing_records(due_date);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_book_requests_member_id ON book_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_status ON book_requests(status);
CREATE INDEX IF NOT EXISTS idx_book_requests_ready_date ON book_requests(ready_date);
CREATE INDEX IF NOT EXISTS idx_user_notifications_member_id ON user_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_user_notifications_type ON user_notifications(type);
CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at ON user_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_member_id ON email_verifications(member_id);

-- STEP 7: Create function for auto-updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 8: Create triggers for auto-updating timestamps
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

DROP TRIGGER IF EXISTS update_book_requests_updated_at ON book_requests;
CREATE TRIGGER update_book_requests_updated_at 
    BEFORE UPDATE ON book_requests
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- STEP 9: Insert sample library members if they don't exist
-- First, let's get the next available ID
DO $$
DECLARE
    next_id BIGINT;
BEGIN
    -- Get the next available ID
    SELECT COALESCE(MAX(id), 0) + 1 INTO next_id FROM library_members;
    
    -- Insert sample library members
    INSERT INTO library_members (id, name, email, password_hash, join_date, borrowed_count, overdue_count, status, membership_id, email_verified) VALUES
    (next_id, 'John Doe', 'john.doe@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-01-15', 2, 0, 'Active', 'LIB001', true),
    (next_id + 1, 'Jane Smith', 'jane.smith@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-02-20', 1, 1, 'Active', 'LIB002', true),
    (next_id + 2, 'Mike Johnson', 'mike.johnson@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-03-10', 0, 0, 'Active', 'LIB003', true),
    (next_id + 3, 'Sarah Wilson', 'sarah.wilson@email.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '2023-04-05', 3, 0, 'Suspended', 'LIB004', true)
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        join_date = EXCLUDED.join_date,
        borrowed_count = EXCLUDED.borrowed_count,
        overdue_count = EXCLUDED.overdue_count,
        status = EXCLUDED.status,
        membership_id = EXCLUDED.membership_id,
        email_verified = EXCLUDED.email_verified,
        updated_at = CURRENT_TIMESTAMP;
END $$;

-- STEP 10: Update existing members with verification status and last login
UPDATE library_members SET 
    email_verified = true,
    last_login = CURRENT_TIMESTAMP - INTERVAL '1 day'
WHERE email IN ('john.doe@email.com', 'jane.smith@email.com', 'mike.johnson@email.com', 'sarah.wilson@email.com');

-- STEP 11: Insert sample book requests using actual member IDs
DO $$
DECLARE
    john_id BIGINT;
    jane_id BIGINT;
    sarah_id BIGINT;
BEGIN
    -- Get the actual IDs of our sample members
    SELECT id INTO john_id FROM library_members WHERE email = 'john.doe@email.com';
    SELECT id INTO jane_id FROM library_members WHERE email = 'jane.smith@email.com';
    SELECT id INTO sarah_id FROM library_members WHERE email = 'sarah.wilson@email.com';
    
    -- Only insert if we found the members
    IF john_id IS NOT NULL THEN
        INSERT INTO book_requests (member_id, book_title, book_author, subject, status, ready_date) VALUES
        (john_id, 'Advanced Calculus', 'Dr. Mathematics', 'Mathematics', 'ready', CURRENT_TIMESTAMP - INTERVAL '1 hour')
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF jane_id IS NOT NULL THEN
        INSERT INTO book_requests (member_id, book_title, book_author, subject, status, ready_date) VALUES
        (jane_id, 'Physics Laboratory Manual', 'Prof. Physics', 'Science', 'pending', NULL)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF sarah_id IS NOT NULL THEN
        INSERT INTO book_requests (member_id, book_title, book_author, subject, status, ready_date) VALUES
        (sarah_id, 'Computer Programming Basics', 'Tech Author', 'TLE', 'ready', CURRENT_TIMESTAMP - INTERVAL '2 hours')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- STEP 12: Insert sample notifications using actual member IDs
DO $$
DECLARE
    john_id BIGINT;
    jane_id BIGINT;
    sarah_id BIGINT;
BEGIN
    -- Get the actual IDs of our sample members
    SELECT id INTO john_id FROM library_members WHERE email = 'john.doe@email.com';
    SELECT id INTO jane_id FROM library_members WHERE email = 'jane.smith@email.com';
    SELECT id INTO sarah_id FROM library_members WHERE email = 'sarah.wilson@email.com';
    
    -- Only insert if we found the members
    IF john_id IS NOT NULL THEN
        INSERT INTO user_notifications (member_id, type, title, message, is_read) VALUES
        (john_id, 'book_ready', 'Book Ready for Collection', 'Your requested book "Advanced Calculus" is ready for pickup!', false),
        (john_id, 'deadline_reminder', 'Book Due Soon', 'Your book "Algebra Fundamentals" is due in 2 days.', false)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF jane_id IS NOT NULL THEN
        INSERT INTO user_notifications (member_id, type, title, message, is_read) VALUES
        (jane_id, 'deadline_reminder', 'Overdue Book Notice', 'Your book "World History" is overdue. Please return it soon.', false)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF sarah_id IS NOT NULL THEN
        INSERT INTO user_notifications (member_id, type, title, message, is_read) VALUES
        (sarah_id, 'book_ready', 'Book Ready for Collection', 'Your requested book "Computer Programming Basics" is ready for pickup!', false)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- STEP 13: Create enhanced views
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

-- STEP 14: Create notification functions
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

-- Test the structure with existing tables
SELECT 
    lm.id, 
    lm.name, 
    lm.email, 
    lm.membership_id,
    lm.email_verified,
    lm.borrowed_count,
    COUNT(br.id) as borrowing_records,
    COUNT(brn.id) as book_requests,
    COUNT(un.id) as notifications
FROM library_members lm
LEFT JOIN borrowing_records br ON (lm.id = br.member_id OR lm.id = br.user_id)
LEFT JOIN book_requests brn ON lm.id = brn.member_id
LEFT JOIN user_notifications un ON lm.id = un.member_id
GROUP BY lm.id, lm.name, lm.email, lm.membership_id, lm.email_verified, lm.borrowed_count
ORDER BY lm.id;

-- Show all tables in public schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

