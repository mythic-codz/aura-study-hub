
ALTER TABLE public.users DROP COLUMN IF EXISTS password_hash;

DROP POLICY IF EXISTS "Users can view profiles" ON public.users;
CREATE POLICY "Users can view own profile by device"
ON public.users FOR SELECT TO anon, authenticated
USING (device_id = ((current_setting('request.headers', true))::json ->> 'x-device-id'));

CREATE OR REPLACE VIEW public.public_profiles AS
  SELECT id, name, avatar_url, xp, current_streak, longest_streak, created_at
  FROM public.users;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can check bans" ON public.banned_devices;

DROP POLICY IF EXISTS "public full access to batches" ON public.batches;

DROP POLICY IF EXISTS "Public can manage live classes" ON public.live_classes;

DROP POLICY IF EXISTS "Service can insert quizzes" ON public.quizzes;

DROP POLICY IF EXISTS "Anyone can view user achievements" ON public.user_achievements;
CREATE POLICY "Users view own achievements by device"
ON public.user_achievements FOR SELECT TO anon, authenticated
USING (user_id = (SELECT id FROM public.users WHERE device_id = ((current_setting('request.headers', true))::json ->> 'x-device-id') LIMIT 1));

ALTER TABLE public.bot_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extraction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extracted_batches ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
