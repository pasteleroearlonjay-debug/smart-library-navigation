-- Add quantity column to books table
-- This column stores the number of copies available for each book

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'quantity'
    ) THEN
        ALTER TABLE books ADD COLUMN quantity INTEGER DEFAULT 1;
        RAISE NOTICE 'Added quantity column to books table.';
    ELSE
        RAISE NOTICE 'Column quantity already exists in books table.';
    END IF;
END $$;


