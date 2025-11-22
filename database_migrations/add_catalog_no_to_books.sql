-- Add catalog_no column to books table
-- Migration: Add Catalog Number Support

-- Add catalog_no column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' AND column_name = 'catalog_no'
    ) THEN
        ALTER TABLE books ADD COLUMN catalog_no VARCHAR(50);
        
        -- Create index for catalog_no for better search performance
        CREATE INDEX IF NOT EXISTS idx_books_catalog_no ON books(catalog_no);
        
        RAISE NOTICE 'Added catalog_no column to books table';
    ELSE
        RAISE NOTICE 'catalog_no column already exists in books table';
    END IF;
END $$;

