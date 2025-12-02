-- Create the profile-pictures storage bucket
-- This bucket will store user profile pictures

-- Enable the storage schema (if not already enabled)
BEGIN;

-- Create the bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, owner_id)
VALUES ('profile-pictures', 'profile-pictures', true, auth.uid())
ON CONFLICT DO NOTHING;

-- Set up RLS policies for the profile-pictures bucket
-- Allow users to upload their own pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to read profile pictures
CREATE POLICY "Public can read profile pictures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Allow users to update their own pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;
