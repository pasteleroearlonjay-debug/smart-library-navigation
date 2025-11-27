-- Add publication_date column to books table
-- This column stores the publication date of the book for filtering purposes

DO $$
BEGIN
    -- Check if publication_date column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'publication_date'
    ) THEN
        -- Add publication_date column with DATE type
        ALTER TABLE books 
        ADD COLUMN publication_date DATE;
        
        RAISE NOTICE 'Added publication_date column to books table.';
    ELSE
        RAISE NOTICE 'Column publication_date already exists in books table.';
    END IF;
END $$;

