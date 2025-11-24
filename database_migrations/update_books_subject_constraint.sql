-- Update books table subject constraint to include all subjects
-- This allows additional subjects like Thesis, Fiction, Medicine, etc.

DO $$
BEGIN
    -- Drop the existing constraint if it exists
    ALTER TABLE books DROP CONSTRAINT IF EXISTS books_subject_check;
    
    -- Add new constraint with all allowed subjects
    ALTER TABLE books 
    ADD CONSTRAINT books_subject_check 
    CHECK (subject IN (
        'Mathematics',
        'Science',
        'Social Studies',
        'PEHM',
        'Values Education',
        'TLE',
        'Thesis',
        'Fiction',
        'Medicine',
        'Agriculture',
        'Computer Studies',
        'Comics'
    ));
    
    RAISE NOTICE 'Updated books_subject_check constraint to include all subjects.';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error updating constraint: %', SQLERRM;
END $$;


