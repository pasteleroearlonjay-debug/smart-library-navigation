-- Delete all data for user with email: leolansangan27@gmail.com
-- This script will delete the user and all related data from all tables

DO $$
DECLARE
    target_email VARCHAR(255) := 'leolansangan27@gmail.com';
    user_member_id BIGINT;
BEGIN
    -- Find the member_id for the email
    SELECT id INTO user_member_id
    FROM library_members
    WHERE email = target_email;

    -- If user exists, delete all related data
    IF user_member_id IS NOT NULL THEN
        RAISE NOTICE 'Found user with ID: %', user_member_id;
        
        -- Delete from user_notifications (CASCADE should handle this, but being explicit)
        DELETE FROM user_notifications WHERE member_id = user_member_id;
        RAISE NOTICE 'Deleted user_notifications for member_id: %', user_member_id;
        
        -- Delete from book_requests
        DELETE FROM book_requests WHERE member_id = user_member_id;
        RAISE NOTICE 'Deleted book_requests for member_id: %', user_member_id;
        
        -- Delete from email_verifications
        DELETE FROM email_verifications WHERE member_id = user_member_id;
        RAISE NOTICE 'Deleted email_verifications for member_id: %', user_member_id;
        
        -- Delete from borrowing_records (if table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'borrowing_records') THEN
            DELETE FROM borrowing_records WHERE member_id = user_member_id;
            RAISE NOTICE 'Deleted borrowing_records for member_id: %', user_member_id;
        END IF;
        
        -- Delete from email_notifications (if table exists)
        -- Check which column exists: user_id or member_id
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_notifications') THEN
            IF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'email_notifications' AND column_name = 'user_id'
            ) THEN
                DELETE FROM email_notifications WHERE user_id = user_member_id;
                RAISE NOTICE 'Deleted email_notifications for user_id: %', user_member_id;
            ELSIF EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'email_notifications' AND column_name = 'member_id'
            ) THEN
                DELETE FROM email_notifications WHERE member_id = user_member_id;
                RAISE NOTICE 'Deleted email_notifications for member_id: %', user_member_id;
            END IF;
        END IF;
        
        -- Finally, delete the user from library_members
        DELETE FROM library_members WHERE id = user_member_id;
        RAISE NOTICE 'Deleted library_member with email: %', target_email;
        
        RAISE NOTICE 'Successfully deleted all data for user: %', target_email;
    ELSE
        RAISE NOTICE 'User with email % not found', target_email;
    END IF;
END $$;

