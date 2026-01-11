-- Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;

-- Create a proper PERMISSIVE INSERT policy for users
CREATE POLICY "Anyone can insert users" 
ON public.users 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- Also need to fix SELECT policy to allow checking for existing users by name
-- The current policy only allows viewing own profile by device_id
-- But we need to search by name for the "same name different device" feature
DROP POLICY IF EXISTS "Users view own profile by device" ON public.users;

-- Create a policy that allows:
-- 1. Users to view their own profile by device
-- 2. Users to search for existing users by name (for linking accounts)
CREATE POLICY "Users can view profiles" 
ON public.users 
FOR SELECT 
USING (true);