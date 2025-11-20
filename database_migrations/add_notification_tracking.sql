-- Database Migration: Add Notification Tracking Fields
-- This migration adds fields needed for automatic email notifications and reminders
-- Run this script in your Supabase SQL Editor

-- ========================================
-- 1. Add last_reminder_sent to borrowing_records
-- ========================================
-- This field tracks when the last reminder email was sent for a book
-- Prevents duplicate daily reminders

DO $$
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'borrowing_records' 
        AND column_name = 'last_reminder_sent'
    ) THEN
        ALTER TABLE borrowing_records 
        ADD COLUMN last_reminder_sent DATE;
        
        RAISE NOTICE 'Added last_reminder_sent column to borrowing_records';
    ELSE
        RAISE NOTICE 'Column last_reminder_sent already exists in borrowing_records';
    END IF;
END $$;

-- ========================================
-- 2. Add emailed_at to user_notifications
-- ========================================
-- This field tracks when an email was sent for a notification
-- Prevents duplicate emails for the same notification

DO $$
BEGIN
    -- Check if column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_notifications' 
        AND column_name = 'emailed_at'
    ) THEN
        ALTER TABLE user_notifications 
        ADD COLUMN emailed_at TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added emailed_at column to user_notifications';
    ELSE
        RAISE NOTICE 'Column emailed_at already exists in user_notifications';
    END IF;
END $$;

-- ========================================
-- 3. Ensure email_notifications table has required fields
-- ========================================
-- The email_notifications table may have different structures
-- This ensures all required fields exist

DO $$
BEGIN
    -- Add user_id if it doesn't exist (some schemas use member_id)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notifications' 
        AND column_name = 'user_id'
    ) THEN
        -- Check if member_id exists instead
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'email_notifications' 
            AND column_name = 'member_id'
        ) THEN
            -- Add user_id as an alias/reference to member_id
            ALTER TABLE email_notifications 
            ADD COLUMN user_id BIGINT;
            
            -- Copy data from member_id to user_id
            UPDATE email_notifications 
            SET user_id = member_id 
            WHERE user_id IS NULL;
            
            RAISE NOTICE 'Added user_id column to email_notifications (copied from member_id)';
        ELSE
            ALTER TABLE email_notifications 
            ADD COLUMN user_id BIGINT;
            
            RAISE NOTICE 'Added user_id column to email_notifications';
        END IF;
    ELSE
        RAISE NOTICE 'Column user_id already exists in email_notifications';
    END IF;

    -- Add email_address if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notifications' 
        AND column_name = 'email_address'
    ) THEN
        ALTER TABLE email_notifications 
        ADD COLUMN email_address VARCHAR(255);
        
        RAISE NOTICE 'Added email_address column to email_notifications';
    ELSE
        RAISE NOTICE 'Column email_address already exists in email_notifications';
    END IF;

    -- Add notification_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notifications' 
        AND column_name = 'notification_type'
    ) THEN
        ALTER TABLE email_notifications 
        ADD COLUMN notification_type VARCHAR(50) DEFAULT 'general';
        
        RAISE NOTICE 'Added notification_type column to email_notifications';
    ELSE
        RAISE NOTICE 'Column notification_type already exists in email_notifications';
    END IF;

    -- Add book_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notifications' 
        AND column_name = 'book_id'
    ) THEN
        ALTER TABLE email_notifications 
        ADD COLUMN book_id BIGINT;
        
        RAISE NOTICE 'Added book_id column to email_notifications';
    ELSE
        RAISE NOTICE 'Column book_id already exists in email_notifications';
    END IF;

    -- Add scheduled_time if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notifications' 
        AND column_name = 'scheduled_time'
    ) THEN
        ALTER TABLE email_notifications 
        ADD COLUMN scheduled_time TIMESTAMP WITH TIME ZONE;
        
        RAISE NOTICE 'Added scheduled_time column to email_notifications';
    ELSE
        RAISE NOTICE 'Column scheduled_time already exists in email_notifications';
    END IF;

    -- Add sent_time if it doesn't exist (some schemas use sent_date)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notifications' 
        AND column_name = 'sent_time'
    ) THEN
        -- Check if sent_date exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'email_notifications' 
            AND column_name = 'sent_date'
        ) THEN
            -- Add sent_time and copy from sent_date
            ALTER TABLE email_notifications 
            ADD COLUMN sent_time TIMESTAMP WITH TIME ZONE;
            
            UPDATE email_notifications 
            SET sent_time = sent_date 
            WHERE sent_time IS NULL AND sent_date IS NOT NULL;
            
            RAISE NOTICE 'Added sent_time column to email_notifications (copied from sent_date)';
        ELSE
            ALTER TABLE email_notifications 
            ADD COLUMN sent_time TIMESTAMP WITH TIME ZONE;
            
            RAISE NOTICE 'Added sent_time column to email_notifications';
        END IF;
    ELSE
        RAISE NOTICE 'Column sent_time already exists in email_notifications';
    END IF;

    -- Add created_at if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notifications' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE email_notifications 
        ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        
        RAISE NOTICE 'Added created_at column to email_notifications';
    ELSE
        RAISE NOTICE 'Column created_at already exists in email_notifications';
    END IF;
END $$;

-- ========================================
-- 4. Create indexes for performance
-- ========================================

-- Index for borrowing_records last_reminder_sent (for querying books needing reminders)
CREATE INDEX IF NOT EXISTS idx_borrowing_records_last_reminder_sent 
ON borrowing_records(last_reminder_sent) 
WHERE last_reminder_sent IS NOT NULL;

-- Index for user_notifications emailed_at (for querying unemailed notifications)
CREATE INDEX IF NOT EXISTS idx_user_notifications_emailed_at 
ON user_notifications(emailed_at) 
WHERE emailed_at IS NULL;

-- Index for email_notifications user_id (if it exists)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notifications' 
        AND column_name = 'user_id'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id 
        ON email_notifications(user_id);
        
        RAISE NOTICE 'Created index on email_notifications.user_id';
    END IF;
END $$;

-- ========================================
-- 5. Add foreign key constraint for user_id if needed
-- ========================================

DO $$
BEGIN
    -- Check if user_id exists and doesn't have a foreign key constraint
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'email_notifications' 
        AND column_name = 'user_id'
    ) THEN
        -- Check if foreign key doesn't exist
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'email_notifications' 
            AND constraint_name LIKE '%user_id%'
            AND constraint_type = 'FOREIGN KEY'
        ) THEN
            -- Try to add foreign key (may fail if library_members table structure differs)
            BEGIN
                ALTER TABLE email_notifications 
                ADD CONSTRAINT email_notifications_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES library_members(id) ON DELETE CASCADE;
                
                RAISE NOTICE 'Added foreign key constraint for email_notifications.user_id';
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Could not add foreign key constraint for user_id: %', SQLERRM;
            END;
        END IF;
    END IF;
END $$;

-- ========================================
-- Migration Complete
-- ========================================

SELECT 
    'Migration completed successfully!' as status,
    'Check the notices above for details' as message;

