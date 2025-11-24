-- Create book-covers storage bucket and policies
-- Run this in Supabase SQL Editor

-- Step 1: Create the storage bucket
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

-- Step 2: Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for book covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated uploads for book covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated updates for book covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated deletes for book covers" ON storage.objects;

-- Step 3: Create policy for public read access (anyone can view images)
CREATE POLICY "Public read access for book covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'book-covers');

-- Step 4: Create policy for authenticated uploads (only logged-in users can upload)
CREATE POLICY "Authenticated uploads for book covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- Step 5: Create policy for authenticated updates (only logged-in users can update)
CREATE POLICY "Authenticated updates for book covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- Step 6: Create policy for authenticated deletes (only logged-in users can delete)
CREATE POLICY "Authenticated deletes for book covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'book-covers' 
  AND auth.role() = 'authenticated'
);

-- Success message
SELECT 'Storage bucket "book-covers" created successfully with all policies!' as message;

