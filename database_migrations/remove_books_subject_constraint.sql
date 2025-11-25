-- Remove books table subject constraint entirely
-- This allows any subject value for maximum flexibility

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE books DROP CONSTRAINT IF EXISTS books_subject_check;
    
    RAISE NOTICE 'Removed books_subject_check constraint. Books can now have any subject value.';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error removing constraint: %', SQLERRM;
END $$;





