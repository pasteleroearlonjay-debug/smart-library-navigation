-- Safe Book Requests Setup
-- This script creates the book_requests table WITHOUT foreign key constraints
-- to avoid "column does not exist" errors

-- Create book_requests table without foreign key constraints
CREATE TABLE IF NOT EXISTS book_requests (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    book_id BIGINT NOT NULL,
    requested_days INTEGER NOT NULL CHECK (requested_days > 0 AND requested_days <= 30),
    due_date DATE NOT NULL,
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    processed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user_notifications table without foreign key constraints
CREATE TABLE IF NOT EXISTS user_notifications (
    id BIGSERIAL PRIMARY KEY,
    member_id BIGINT NOT NULL,
    type VARCHAR NOT NULL,
    title VARCHAR NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance (safe - no foreign key dependencies)
CREATE INDEX IF NOT EXISTS idx_book_requests_member_id ON book_requests(member_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_book_id ON book_requests(book_id);
CREATE INDEX IF NOT EXISTS idx_book_requests_status ON book_requests(status);
CREATE INDEX IF NOT EXISTS idx_book_requests_date ON book_requests(request_date);

CREATE INDEX IF NOT EXISTS idx_user_notifications_member_id ON user_notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_is_read ON user_notifications(is_read);

-- Success message
SELECT 'Safe book requests setup completed successfully!' as message;

