-- Add profile picture columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_thumbnail_url TEXT;

-- Create professional_links table for storing social/professional links
CREATE TABLE IF NOT EXISTS professional_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- github, linkedin, portfolio, twitter, stackoverflow, blog
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  UNIQUE(user_id, platform)
);

-- Enable RLS on professional_links table
ALTER TABLE professional_links ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for professional_links
CREATE POLICY "Users can insert their own professional links" ON professional_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own professional links" ON professional_links
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own professional links" ON professional_links
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own professional links" ON professional_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS professional_links_user_id_idx ON professional_links(user_id);
