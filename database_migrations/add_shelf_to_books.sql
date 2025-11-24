-- Add shelf column to books table
-- This column stores which shelf the book is located on (Shelf 1, Shelf 2, etc.)

DO $$
BEGIN
    -- Check if shelf column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'shelf'
    ) THEN
        -- Add shelf column with default value 'Shelf 1'
        ALTER TABLE books 
        ADD COLUMN shelf VARCHAR(50) DEFAULT 'Shelf 1';
        
        -- Update existing books to have 'Shelf 1' as default
        UPDATE books SET shelf = 'Shelf 1' WHERE shelf IS NULL;
        
        RAISE NOTICE 'Added shelf column to books table with default value "Shelf 1".';
    ELSE
        RAISE NOTICE 'Column shelf already exists in books table.';
    END IF;
END $$;


