-- Add cover_photo_url column to books table
-- This column stores the Supabase Storage URL for book cover images

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'cover_photo_url'
    ) THEN
        ALTER TABLE books ADD COLUMN cover_photo_url TEXT;
        RAISE NOTICE 'Added cover_photo_url column to books table.';
    ELSE
        RAISE NOTICE 'Column cover_photo_url already exists in books table.';
    END IF;
END $$;


