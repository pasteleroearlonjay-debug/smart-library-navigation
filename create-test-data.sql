-- Quick Test Data Creation Script
-- Run this in Supabase SQL Editor to create test data for notifications

-- Step 1: Verify member exists (replace email if needed)
SELECT id, name, email 
FROM library_members 
WHERE email = 'alexandergana02@gmail.com';

-- Step 2: Add book_title column if it doesn't exist (for better email notifications)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'borrowing_records' AND column_name = 'book_title'
    ) THEN
        ALTER TABLE borrowing_records ADD COLUMN book_title VARCHAR(255);
        RAISE NOTICE 'Added book_title column to borrowing_records';
    END IF;
END $$;

-- Step 3: Create test borrowing records
-- This creates books due in 1, 2, 3 days and overdue

DO $$
DECLARE
    member_id_var BIGINT;
    book_id_var BIGINT;
    book_title_var VARCHAR(255);
BEGIN
    -- Get member ID
    SELECT id INTO member_id_var 
    FROM library_members 
    WHERE email = 'alexandergana02@gmail.com' 
    LIMIT 1;
    
    IF member_id_var IS NULL THEN
        RAISE EXCEPTION 'Member not found. Please update the email address in the script.';
    END IF;
    
    -- Get a book ID and title
    SELECT id, title INTO book_id_var, book_title_var FROM books LIMIT 1;
    
    IF book_id_var IS NULL THEN
        RAISE EXCEPTION 'No books found. Please add books to the books table first.';
    END IF;
    
    -- Create test records
    -- Due in 1 day
    INSERT INTO borrowing_records (
        member_id, book_id, book_title, borrowed_date, due_date, status, last_reminder_sent
    ) VALUES (
        member_id_var, 
        book_id_var, 
        COALESCE(book_title_var, 'Test Book') || ' - Due Tomorrow', 
        CURRENT_DATE - 10, 
        CURRENT_DATE + 1, 
        'borrowed', 
        NULL
    );
    
    -- Due in 2 days
    INSERT INTO borrowing_records (
        member_id, book_id, book_title, borrowed_date, due_date, status, last_reminder_sent
    ) VALUES (
        member_id_var, 
        book_id_var, 
        COALESCE(book_title_var, 'Test Book') || ' - Due in 2 Days', 
        CURRENT_DATE - 10, 
        CURRENT_DATE + 2, 
        'borrowed', 
        NULL
    );
    
    -- Due in 3 days
    INSERT INTO borrowing_records (
        member_id, book_id, book_title, borrowed_date, due_date, status, last_reminder_sent
    ) VALUES (
        member_id_var, 
        book_id_var, 
        COALESCE(book_title_var, 'Test Book') || ' - Due in 3 Days', 
        CURRENT_DATE - 10, 
        CURRENT_DATE + 3, 
        'borrowed', 
        NULL
    );
    
    -- Overdue (due yesterday)
    INSERT INTO borrowing_records (
        member_id, book_id, book_title, borrowed_date, due_date, status, last_reminder_sent
    ) VALUES (
        member_id_var, 
        book_id_var, 
        COALESCE(book_title_var, 'Test Book') || ' - Overdue', 
        CURRENT_DATE - 15, 
        CURRENT_DATE - 1, 
        'borrowed', 
        NULL
    );
    
    RAISE NOTICE '✅ Test borrowing records created for member ID: %', member_id_var;
    RAISE NOTICE '   - Due in 1 day: % - Due Tomorrow', COALESCE(book_title_var, 'Test Book');
    RAISE NOTICE '   - Due in 2 days: % - Due in 2 Days', COALESCE(book_title_var, 'Test Book');
    RAISE NOTICE '   - Due in 3 days: % - Due in 3 Days', COALESCE(book_title_var, 'Test Book');
    RAISE NOTICE '   - Overdue: % - Overdue', COALESCE(book_title_var, 'Test Book');
END $$;

-- Step 4: Create test user notification
DO $$
DECLARE
    member_id_var BIGINT;
BEGIN
    SELECT id INTO member_id_var 
    FROM library_members 
    WHERE email = 'alexandergana02@gmail.com' 
    LIMIT 1;
    
    INSERT INTO user_notifications (
        member_id, type, title, message, is_read, emailed_at
    ) VALUES (
        member_id_var,
        'book_ready',
        'Test Book Ready Notification',
        'Your requested book "Test Book" is ready for pickup at the library!',
        false,
        NULL
    ) ON CONFLICT DO NOTHING;
    
    RAISE NOTICE '✅ Test user notification created';
END $$;

-- Step 5: Verify test data was created
SELECT 
    br.id,
    br.book_title,
    br.due_date,
    CURRENT_DATE as today,
    br.due_date - CURRENT_DATE as days_until_due,
    br.status,
    br.last_reminder_sent,
    lm.email
FROM borrowing_records br
JOIN library_members lm ON br.member_id = lm.id
WHERE br.book_title LIKE '%Due%' OR br.book_title LIKE '%Overdue%'
ORDER BY br.due_date;

-- Step 6: Check user notifications
SELECT 
    un.id,
    un.type,
    un.title,
    un.is_read,
    un.emailed_at,
    lm.email
FROM user_notifications un
JOIN library_members lm ON un.member_id = lm.id
WHERE un.title LIKE 'Test%';

