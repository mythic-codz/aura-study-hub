-- Fix the Security Definer View issue by recreating as SECURITY INVOKER (default)
DROP VIEW IF EXISTS public.users_public;

CREATE VIEW public.users_public 
WITH (security_invoker = true) AS
SELECT id, name, avatar_url, xp, created_at
FROM public.users;

-- Grant access to the view
GRANT SELECT ON public.users_public TO anon, authenticated;