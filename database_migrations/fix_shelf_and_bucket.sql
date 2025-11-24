-- Fix both shelf column and storage bucket issues
-- Run this in Supabase SQL Editor

-- ========================================
-- PART 1: Add shelf column to books table
-- ========================================

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

-- ========================================
-- PART 2: Add cover_photo_url column to books table
-- ========================================

DO $$
BEGIN
    -- Check if cover_photo_url column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'cover_photo_url'
    ) THEN
        -- Add cover_photo_url column
        ALTER TABLE books 
        ADD COLUMN cover_photo_url TEXT;
        
        RAISE NOTICE 'Added cover_photo_url column to books table.';
    ELSE
        RAISE NOTICE 'Column cover_photo_url already exists in books table.';
    END IF;
END $$;

-- ========================================
-- PART 3: Create storage bucket
-- ========================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'book-covers',
  'book-covers',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE 
SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

-- ========================================
-- PART 4: Create storage policies
-- ========================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for book covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated uploads for book covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated updates for book covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated deletes for book covers" ON storage.objects;

-- Create policy for public read access (anyone can view images)
CREATE POLICY "Public read access for book covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'book-covers');

-- Create policy for authenticated uploads (only logged-in users can upload)
CREATE POLICY "Authenticated uploads for book covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- Create policy for authenticated updates (only logged-in users can update)
CREATE POLICY "Authenticated updates for book covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- Create policy for authenticated deletes (only logged-in users can delete)
CREATE POLICY "Authenticated deletes for book covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- ========================================
-- PART 5: Verify bucket was created
-- ========================================

-- Verify the bucket exists
DO $$
DECLARE
  bucket_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO bucket_count
  FROM storage.buckets
  WHERE id = 'book-covers';
  
  IF bucket_count > 0 THEN
    RAISE NOTICE '✅ Storage bucket "book-covers" verified and exists.';
  ELSE
    RAISE WARNING '⚠️ Storage bucket "book-covers" was not created. Please check for errors above.';
  END IF;
END $$;

-- Success message
SELECT '✅ Shelf column, cover_photo_url column, and storage bucket created successfully!' as message;
SELECT '📝 Next step: Set SUPABASE_SERVICE_ROLE_KEY in your .env.local file for admin uploads.' as hint;

