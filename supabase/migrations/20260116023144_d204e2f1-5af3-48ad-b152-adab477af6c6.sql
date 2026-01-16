-- Create favorites table for batch favorites
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  batch_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate favorites
CREATE UNIQUE INDEX idx_favorites_user_batch ON public.favorites (user_id, batch_id);

-- Enable Row Level Security
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorites" 
ON public.favorites 
FOR SELECT 
USING (user_id = (SELECT id FROM users WHERE device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

CREATE POLICY "Users can add their own favorites" 
ON public.favorites 
FOR INSERT 
WITH CHECK (user_id = (SELECT id FROM users WHERE device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));

CREATE POLICY "Users can remove their own favorites" 
ON public.favorites 
FOR DELETE 
USING (user_id = (SELECT id FROM users WHERE device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text) LIMIT 1));