-- Delete ALL users and their related data from the Smart Library System
-- WARNING: This will permanently delete all users and their data!
-- Use with caution - this action cannot be undone.

DO $$
DECLARE
    deleted_count INTEGER := 0;
    notifications_count INTEGER := 0;
    book_requests_count INTEGER := 0;
    borrowing_records_count INTEGER := 0;
    email_verifications_count INTEGER := 0;
    email_notifications_count INTEGER := 0;
    member_stats_count INTEGER := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Starting deletion of all users and data';
    RAISE NOTICE '========================================';
    
    -- Step 1: Delete user_notifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_notifications') THEN
        SELECT COUNT(*) INTO notifications_count FROM user_notifications;
        DELETE FROM user_notifications;
        RAISE NOTICE 'Deleted % user_notifications', notifications_count;
    ELSE
        RAISE NOTICE 'user_notifications table does not exist, skipping...';
    END IF;
    
    -- Step 2: Delete book_requests
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'book_requests') THEN
        SELECT COUNT(*) INTO book_requests_count FROM book_requests;
        DELETE FROM book_requests;
        RAISE NOTICE 'Deleted % book_requests', book_requests_count;
    ELSE
        RAISE NOTICE 'book_requests table does not exist, skipping...';
    END IF;
    
    -- Step 3: Delete borrowing_records
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'borrowing_records') THEN
        SELECT COUNT(*) INTO borrowing_records_count FROM borrowing_records;
        DELETE FROM borrowing_records;
        RAISE NOTICE 'Deleted % borrowing_records', borrowing_records_count;
    ELSE
        RAISE NOTICE 'borrowing_records table does not exist, skipping...';
    END IF;
    
    -- Step 4: Delete email_verifications
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_verifications') THEN
        SELECT COUNT(*) INTO email_verifications_count FROM email_verifications;
        DELETE FROM email_verifications;
        RAISE NOTICE 'Deleted % email_verifications', email_verifications_count;
    ELSE
        RAISE NOTICE 'email_verifications table does not exist, skipping...';
    END IF;
    
    -- Step 5: Delete email_notifications (check for both user_id and member_id columns)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_notifications') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_notifications' AND column_name = 'member_id'
        ) THEN
            SELECT COUNT(*) INTO email_notifications_count FROM email_notifications;
            DELETE FROM email_notifications;
            RAISE NOTICE 'Deleted % email_notifications (using member_id)', email_notifications_count;
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'email_notifications' AND column_name = 'user_id'
        ) THEN
            SELECT COUNT(*) INTO email_notifications_count FROM email_notifications;
            DELETE FROM email_notifications;
            RAISE NOTICE 'Deleted % email_notifications (using user_id)', email_notifications_count;
        END IF;
    ELSE
        RAISE NOTICE 'email_notifications table does not exist, skipping...';
    END IF;
    
    -- Step 6: Delete member_statistics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_statistics') THEN
        SELECT COUNT(*) INTO member_stats_count FROM member_statistics;
        DELETE FROM member_statistics;
        RAISE NOTICE 'Deleted % member_statistics', member_stats_count;
    ELSE
        RAISE NOTICE 'member_statistics table does not exist, skipping...';
    END IF;
    
    -- Step 7: Finally, delete all users from library_members
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'library_members') THEN
        SELECT COUNT(*) INTO deleted_count FROM library_members;
        DELETE FROM library_members;
        RAISE NOTICE 'Deleted % users from library_members', deleted_count;
    ELSE
        RAISE NOTICE 'library_members table does not exist, skipping...';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Deletion Summary:';
    RAISE NOTICE '  - Users deleted: %', deleted_count;
    RAISE NOTICE '  - User notifications: %', notifications_count;
    RAISE NOTICE '  - Book requests: %', book_requests_count;
    RAISE NOTICE '  - Borrowing records: %', borrowing_records_count;
    RAISE NOTICE '  - Email verifications: %', email_verifications_count;
    RAISE NOTICE '  - Email notifications: %', email_notifications_count;
    RAISE NOTICE '  - Member statistics: %', member_stats_count;
    RAISE NOTICE '========================================';
    RAISE NOTICE 'All users and their data have been deleted successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error occurred during deletion: %', SQLERRM;
        RAISE;
END $$;

-- Verify deletion (optional - uncomment to check)
-- SELECT COUNT(*) as remaining_users FROM library_members;
-- SELECT COUNT(*) as remaining_notifications FROM user_notifications;
-- SELECT COUNT(*) as remaining_requests FROM book_requests;
-- SELECT COUNT(*) as remaining_borrowing_records FROM borrowing_records;

