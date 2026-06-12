-- Allow public read of extracted batches so they show on the site
CREATE POLICY "Anyone can view extracted batches"
ON public.extracted_batches
FOR SELECT
TO anon, authenticated
USING (true);

GRANT SELECT ON public.extracted_batches TO anon, authenticated;
GRANT ALL ON public.extracted_batches TO service_role;

-- Live classes table
CREATE TABLE public.live_classes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id text NOT NULL,
  title text NOT NULL,
  stream_url text,
  thumbnail text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_classes TO anon, authenticated;
GRANT ALL ON public.live_classes TO service_role;

ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live classes"
ON public.live_classes FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Public can manage live classes"
ON public.live_classes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_live_classes_updated_at
BEFORE UPDATE ON public.live_classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_live_classes_active ON public.live_classes (batch_id) WHERE ended_at IS NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_classes;