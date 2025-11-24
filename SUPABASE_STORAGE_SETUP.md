# 📦 Supabase Storage Setup for Book Cover Photos

## Problem
You're seeing the error: **"Bucket not found"** when trying to upload book cover photos.

## Solution: Create the Storage Bucket

### Step 1: Go to Supabase Dashboard
1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project

### Step 2: Navigate to Storage
1. Click on **"Storage"** in the left sidebar
2. You should see a list of storage buckets (or an empty list if none exist)

### Step 3: Create New Bucket
1. Click the **"New bucket"** button (or **"Create bucket"**)
2. Fill in the bucket details:
   - **Name**: `book-covers` (must be exactly this name)
   - **Public bucket**: ✅ **Enable this** (check the box)
   - **File size limit**: `10 MB` (optional, but recommended)
   - **Allowed MIME types**: (optional) You can add:
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `image/webp`
     - `image/gif`

3. Click **"Create bucket"**

### Step 4: Set Bucket Policies (Important!)

After creating the bucket, you need to set up policies so users can upload and view images:

1. Click on the `book-covers` bucket you just created
2. Go to the **"Policies"** tab
3. Click **"New policy"** or **"Add policy"**

#### Policy 1: Allow Public Read Access
- **Policy name**: `Public read access`
- **Allowed operation**: `SELECT` (read)
- **Policy definition**: 
  ```sql
  true
  ```
- Click **"Save"**

#### Policy 2: Allow Authenticated Uploads
- **Policy name**: `Authenticated uploads`
- **Allowed operation**: `INSERT` (upload)
- **Policy definition**:
  ```sql
  auth.role() = 'authenticated'
  ```
- Click **"Save"**

#### Policy 3: Allow Authenticated Updates
- **Policy name**: `Authenticated updates`
- **Allowed operation**: `UPDATE`
- **Policy definition**:
  ```sql
  auth.role() = 'authenticated'
  ```
- Click **"Save"**

#### Policy 4: Allow Authenticated Deletes
- **Policy name**: `Authenticated deletes`
- **Allowed operation**: `DELETE`
- **Policy definition**:
  ```sql
  auth.role() = 'authenticated'
  ```
- Click **"Save"**

### Alternative: Use RLS (Row Level Security) Templates

If your Supabase dashboard has policy templates, you can use:
- **For SELECT**: "Public Access" template
- **For INSERT/UPDATE/DELETE**: "Authenticated users only" template

## Verify Setup

After creating the bucket and policies:

1. Try uploading a book cover photo again
2. The upload should now work without errors
3. The cover photo URL should be accessible publicly

## Troubleshooting

### Still getting "Bucket not found" error?
- Make sure the bucket name is exactly `book-covers` (case-sensitive)
- Check that the bucket was created successfully in the Storage section
- Refresh your browser and try again

### Getting "Permission denied" error?
- Check that the bucket policies are set up correctly
- Make sure the bucket is set to **Public**
- Verify that your Supabase service role key has proper permissions

### Images not displaying?
- Check that the bucket is set to **Public**
- Verify the public URL is accessible
- Check browser console for CORS errors

## Quick SQL Setup (Alternative)

If you prefer using SQL, you can run this in the Supabase SQL Editor:

```sql
-- Create the bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public read access
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT
USING (bucket_id = 'book-covers');

-- Allow authenticated uploads
CREATE POLICY "Authenticated uploads" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'book-covers' AND auth.role() = 'authenticated');

-- Allow authenticated updates
CREATE POLICY "Authenticated updates" ON storage.objects
FOR UPDATE
USING (bucket_id = 'book-covers' AND auth.role() = 'authenticated');

-- Allow authenticated deletes
CREATE POLICY "Authenticated deletes" ON storage.objects
FOR DELETE
USING (bucket_id = 'book-covers' AND auth.role() = 'authenticated');
```

## Notes

- The bucket name `book-covers` is hardcoded in the application
- Cover photos are optional - books can be created without them
- Maximum file size is 10MB
- Supported formats: JPG, PNG, WebP, GIF


