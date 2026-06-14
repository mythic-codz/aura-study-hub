
DROP VIEW IF EXISTS public.public_profiles;

CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 10)
RETURNS TABLE (id uuid, name text, avatar_url text, xp integer, current_streak integer, longest_streak integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, avatar_url, xp, current_streak, longest_streak
  FROM public.users
  ORDER BY xp DESC
  LIMIT GREATEST(1, LEAST(_limit, 100));
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can insert users" ON public.users;
CREATE POLICY "Users can insert own record by device"
ON public.users FOR INSERT TO anon, authenticated
WITH CHECK (device_id = ((current_setting('request.headers', true))::json ->> 'x-device-id'));

DROP POLICY IF EXISTS "Users update own profile by device" ON public.users;
CREATE POLICY "Users update own profile by device"
ON public.users FOR UPDATE TO anon, authenticated
USING (device_id = ((current_setting('request.headers', true))::json ->> 'x-device-id'))
WITH CHECK (device_id = ((current_setting('request.headers', true))::json ->> 'x-device-id'));
