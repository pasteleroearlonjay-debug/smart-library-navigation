-- Simple version: Delete ALL users and their related data
-- WARNING: This permanently deletes all users! Cannot be undone.

-- Delete related data first (in order of dependencies)
DELETE FROM user_notifications;
DELETE FROM book_requests;
DELETE FROM borrowing_records;
DELETE FROM email_verifications;
DELETE FROM email_notifications;
DELETE FROM member_statistics;

-- Finally, delete all users
DELETE FROM library_members;

-- Verify deletion
SELECT 
    (SELECT COUNT(*) FROM library_members) as remaining_users,
    (SELECT COUNT(*) FROM user_notifications) as remaining_notifications,
    (SELECT COUNT(*) FROM book_requests) as remaining_requests,
    (SELECT COUNT(*) FROM borrowing_records) as remaining_borrowing_records;

