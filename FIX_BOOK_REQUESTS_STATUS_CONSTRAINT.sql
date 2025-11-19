-- Fix the book_requests status constraint to include the status values we need
-- Current constraint only allows: 'pending', 'ready', 'collected', 'cancelled'
-- We need to add: 'accepted', 'approved', 'declined', 'rejected'

-- First, let's see the current constraint
SELECT 'CURRENT CONSTRAINT:' as info;
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'book_requests' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name = 'book_requests_status_check';

-- Drop the existing constraint
ALTER TABLE public.book_requests 
DROP CONSTRAINT IF EXISTS book_requests_status_check;

-- Add the new constraint with all the status values we need
ALTER TABLE public.book_requests 
ADD CONSTRAINT book_requests_status_check 
CHECK (status::text = ANY (ARRAY[
    'pending'::character varying, 
    'ready'::character varying, 
    'collected'::character varying, 
    'cancelled'::character varying,
    'accepted'::character varying,
    'approved'::character varying,
    'declined'::character varying,
    'rejected'::character varying
]::text[]));

-- Verify the new constraint
SELECT 'NEW CONSTRAINT:' as info;
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'book_requests' 
    AND tc.constraint_type = 'CHECK'
    AND tc.constraint_name = 'book_requests_status_check';

