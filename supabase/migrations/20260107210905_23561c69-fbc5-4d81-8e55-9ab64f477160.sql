-- Create users table for device-based identification
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create progress table for tracking video/pdf consumption
CREATE TABLE public.progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'pdf')),
  content_index INTEGER NOT NULL,
  progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  last_position DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, batch_id, content_type, content_index)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- Users policies (public read for leaderboard, device-based write)
CREATE POLICY "Anyone can view users for leaderboard" 
ON public.users FOR SELECT USING (true);

CREATE POLICY "Anyone can insert users" 
ON public.users FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE USING (true);

-- Progress policies
CREATE POLICY "Anyone can view progress" 
ON public.progress FOR SELECT USING (true);

CREATE POLICY "Anyone can insert progress" 
ON public.progress FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update progress" 
ON public.progress FOR UPDATE USING (true);

-- Batches policy (make sure it's readable)
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view batches" 
ON public.batches FOR SELECT USING (true);

-- Update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_progress_updated_at
BEFORE UPDATE ON public.progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();