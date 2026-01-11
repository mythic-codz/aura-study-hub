-- =====================================================
-- SECURITY FIX: Comprehensive RLS Policy Updates
-- =====================================================

-- 1. CREATE PUBLIC VIEW FOR LEADERBOARD (safe user data only)
-- This exposes only non-sensitive fields for public access
CREATE VIEW public.users_public AS
SELECT id, name, avatar_url, xp, created_at
FROM public.users;

-- Grant access to the view
GRANT SELECT ON public.users_public TO anon, authenticated;

-- 2. FIX USERS TABLE RLS POLICIES
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view users for leaderboard" ON public.users;

-- Users can only view their own full profile (with device_id, ip_address)
-- This uses the x-device-id header passed from the client
CREATE POLICY "Users view own profile by device"
ON public.users FOR SELECT
USING (
  device_id = current_setting('request.headers', true)::json->>'x-device-id'
);

-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Users can only update their own profile (validated by device_id header)
CREATE POLICY "Users update own profile by device"
ON public.users FOR UPDATE
USING (
  device_id = current_setting('request.headers', true)::json->>'x-device-id'
);

-- 3. FIX PROGRESS TABLE RLS POLICIES
-- Drop all permissive policies
DROP POLICY IF EXISTS "Anyone can view progress" ON public.progress;
DROP POLICY IF EXISTS "Anyone can insert progress" ON public.progress;
DROP POLICY IF EXISTS "Anyone can update progress" ON public.progress;

-- Users can only view their own progress
CREATE POLICY "Users view own progress by device"
ON public.progress FOR SELECT
USING (
  user_id = (
    SELECT id FROM public.users 
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
    LIMIT 1
  )
);

-- Users can only insert their own progress
CREATE POLICY "Users insert own progress by device"
ON public.progress FOR INSERT
WITH CHECK (
  user_id = (
    SELECT id FROM public.users 
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
    LIMIT 1
  )
);

-- Users can only update their own progress
CREATE POLICY "Users update own progress by device"
ON public.progress FOR UPDATE
USING (
  user_id = (
    SELECT id FROM public.users 
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
    LIMIT 1
  )
);

-- 4. FIX USER_ACHIEVEMENTS TABLE RLS POLICIES
-- Drop the permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;

-- Users can only insert their own achievements
CREATE POLICY "Users insert own achievements by device"
ON public.user_achievements FOR INSERT
WITH CHECK (
  user_id = (
    SELECT id FROM public.users 
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
    LIMIT 1
  )
);

-- 5. FIX BATCHES TABLE RLS POLICIES
-- Batches should be read-only for regular users, only admins can modify
-- For now, we'll make it completely read-only (no INSERT/UPDATE from client)
DROP POLICY IF EXISTS "Anyone can insert batches" ON public.batches;
DROP POLICY IF EXISTS "Anyone can update batches" ON public.batches;

-- Keep the SELECT policy as batches are public educational content
-- Note: The "Anyone can view batches" policy already exists and is appropriate

-- 6. FIX STORAGE POLICIES FOR AVATARS BUCKET
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete avatars" ON storage.objects;

-- Users can only upload avatars with their user ID as prefix in filename
CREATE POLICY "Users upload own avatars by device"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  -- Filename must start with user's ID
  SPLIT_PART(name, '-', 1) = (
    SELECT id::text FROM public.users 
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
    LIMIT 1
  )
);

-- Users can only update their own avatars
CREATE POLICY "Users update own avatars by device"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  SPLIT_PART(name, '-', 1) = (
    SELECT id::text FROM public.users 
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
    LIMIT 1
  )
);

-- Users can only delete their own avatars
CREATE POLICY "Users delete own avatars by device"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  SPLIT_PART(name, '-', 1) = (
    SELECT id::text FROM public.users 
    WHERE device_id = current_setting('request.headers', true)::json->>'x-device-id'
    LIMIT 1
  )
);

-- 7. ADD DATABASE CONSTRAINTS FOR INPUT VALIDATION
-- Add length constraints to prevent abuse
ALTER TABLE public.users 
  ADD CONSTRAINT users_name_length CHECK (length(name) >= 1 AND length(name) <= 100);

-- Note: The avatars bucket public SELECT policy should remain for public avatar URLs to work