-- Test what status values are actually allowed by trying to update a record
-- We'll use the first record to test different status values

-- First, let's see what records we have
SELECT 'CURRENT RECORDS:' as info;
SELECT id, status, member_id, book_id 
FROM book_requests 
ORDER BY id 
LIMIT 3;

-- Now let's test updating to different status values
-- We'll use a transaction so we can rollback if it fails
DO $$
DECLARE
    test_record_id INTEGER;
    test_statuses TEXT[] := ARRAY[
        'approved', 'APPROVED', 'Approved',
        'declined', 'DECLINED', 'Declined', 
        'accepted', 'ACCEPTED', 'Accepted',
        'rejected', 'REJECTED', 'Rejected',
        'completed', 'COMPLETED', 'Completed',
        'cancelled', 'CANCELLED', 'Cancelled'
    ];
    test_status TEXT;
BEGIN
    -- Get the first record ID
    SELECT id INTO test_record_id FROM book_requests ORDER BY id LIMIT 1;
    
    IF test_record_id IS NOT NULL THEN
        RAISE NOTICE 'Testing with record ID: %', test_record_id;
        
        FOR i IN 1..array_length(test_statuses, 1) LOOP
            test_status := test_statuses[i];
            
            BEGIN
                -- Try to update the record with this status
                UPDATE book_requests 
                SET status = test_status 
                WHERE id = test_record_id;
                
                -- If we get here, this status is allowed!
                RAISE NOTICE 'SUCCESS: Status "%" is ALLOWED', test_status;
                
                -- Reset back to pending
                UPDATE book_requests 
                SET status = 'pending' 
                WHERE id = test_record_id;
                
            EXCEPTION WHEN check_violation THEN
                RAISE NOTICE 'FAILED: Status "%" is NOT allowed (check constraint violation)', test_status;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'ERROR: Status "%" caused error: %', test_status, SQLERRM;
            END;
        END LOOP;
    ELSE
        RAISE NOTICE 'No records found to test with';
    END IF;
END $$;

