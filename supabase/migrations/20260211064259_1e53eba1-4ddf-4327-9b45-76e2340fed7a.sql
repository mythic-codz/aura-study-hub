
CREATE TABLE public.banned_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  ip_address text,
  violation_count integer NOT NULL DEFAULT 0,
  banned_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_banned_devices_device_id ON public.banned_devices(device_id);
CREATE INDEX idx_banned_devices_ip_address ON public.banned_devices(ip_address);

ALTER TABLE public.banned_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can check bans"
  ON public.banned_devices FOR SELECT
  USING (true);
