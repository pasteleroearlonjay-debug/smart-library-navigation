-- Test different status values to see which ones are allowed
-- This will help us find the exact values that work

-- First, let's see what's currently in the table
SELECT 'CURRENT DATA:' as info;
SELECT id, status, member_id, book_id 
FROM book_requests 
LIMIT 5;

-- Now let's try to understand the constraint by attempting different values
-- We'll use a temporary approach to test without actually changing data

-- Test 1: Try to understand what the constraint allows
SELECT 'TESTING STATUS VALUES:' as info;

-- Create a temporary test to see what values are allowed
DO $$
DECLARE
    test_statuses TEXT[] := ARRAY[
        'pending', 'PENDING', 'Pending',
        'approved', 'APPROVED', 'Approved', 'APPROVE', 'approve',
        'declined', 'DECLINED', 'Declined', 'DECLINE', 'decline',
        'rejected', 'REJECTED', 'Rejected', 'REJECT', 'reject',
        'accepted', 'ACCEPTED', 'Accepted', 'ACCEPT', 'accept',
        'completed', 'COMPLETED', 'Completed', 'COMPLETE', 'complete',
        'active', 'ACTIVE', 'Active',
        'inactive', 'INACTIVE', 'Inactive',
        'cancelled', 'CANCELLED', 'Cancelled', 'CANCEL', 'cancel'
    ];
    test_status TEXT;
    constraint_error TEXT;
BEGIN
    FOR i IN 1..array_length(test_statuses, 1) LOOP
        test_status := test_statuses[i];
        
        BEGIN
            -- Try to insert a test record with this status
            INSERT INTO book_requests (member_id, book_id, status, request_date)
            VALUES (999, 999, test_status, CURRENT_DATE);
            
            -- If we get here, this status is allowed!
            RAISE NOTICE 'SUCCESS: Status "%" is ALLOWED', test_status;
            
            -- Clean up the test record
            DELETE FROM book_requests WHERE member_id = 999 AND book_id = 999;
            
        EXCEPTION WHEN check_violation THEN
            RAISE NOTICE 'FAILED: Status "%" is NOT allowed (check constraint violation)', test_status;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Status "%" caused error: %', test_status, SQLERRM;
        END;
    END LOOP;
END $$;

