-- Run this in the Supabase SQL Editor

-- 1. Create or Update Users Table (Assumes it exists from Supabase Auth trigger, but let's ensure fields exist)
-- If the table doesn't exist, here is the full schema:
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  prn TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  id_card_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'verified_student', 'admin')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the table already exists, we can add the missing columns safely:
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='full_name') THEN
    ALTER TABLE public.users ADD COLUMN full_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='prn') THEN
    ALTER TABLE public.users ADD COLUMN prn TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='avatar_url') THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='id_card_url') THEN
    ALTER TABLE public.users ADD COLUMN id_card_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='role') THEN
    ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'verified_student', 'admin'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
    ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected'));
  END IF;
END $$;


-- 2. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  target_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS Policies

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;

-- Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Audit logs are insertable by backend (service role) and readable by admins
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Allow everyone to view verified students (might be needed for UI)
CREATE POLICY "Public profiles are viewable by everyone"
ON public.users FOR SELECT
USING (role = 'verified_student' OR role = 'admin');

-- 4. Storage Bucket Setup
-- Ensure the 'afin-storage' bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('afin-storage', 'afin-storage', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own ID card" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

-- Allow users to upload to avatars and id_cards
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'afin-storage' AND 
  (storage.foldername(name))[1] = 'avatars' AND 
  (auth.uid())::text = SPLIT_PART((storage.filename(name)), '.', 1)
);

CREATE POLICY "Users can upload their own ID card"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'afin-storage' AND 
  (storage.foldername(name))[1] = 'id_cards' AND 
  (storage.foldername(name))[2] = (auth.uid())::text
);

-- Allow public read access to all objects in afin-storage
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'afin-storage');

-- Allow users to upload to lost_found, accommodation, and content folders
-- Path format: folder/.../userId-filename-timestamp.ext
CREATE POLICY "Users can upload to campus and content folders"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'afin-storage' AND 
  (
    (storage.foldername(name))[1] IN ('lost_found', 'accommodation', 'content') AND
    (storage.filename(name)) LIKE (auth.uid())::text || '%'
  )
);

-- Allow users to upload their own avatars
-- Path format: avatars/userId.png
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'afin-storage' AND 
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.filename(name)) LIKE (auth.uid())::text || '%'
);

-- Also allow UPDATE for avatars and id_cards since they use upsert: true
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'afin-storage' AND 
  (storage.foldername(name))[1] = 'avatars' AND
  (storage.filename(name)) LIKE (auth.uid())::text || '%'
);

CREATE POLICY "Users can update their own id_cards"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'afin-storage' AND 
  (storage.foldername(name))[1] = 'id_cards' AND
  (storage.foldername(name))[2] = (auth.uid())::text
);
