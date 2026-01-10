-- Create achievement types enum
CREATE TYPE public.achievement_type AS ENUM (
  'batch_complete',
  'videos_watched', 
  'xp_milestone',
  'streak',
  'first_steps'
);

-- Create achievements table (predefined achievements)
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'trophy',
  type achievement_type NOT NULL,
  requirement INTEGER NOT NULL DEFAULT 1,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  badge_color TEXT NOT NULL DEFAULT 'purple',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table (unlocked achievements)
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS on both tables
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for achievements (everyone can view)
CREATE POLICY "Anyone can view achievements"
ON public.achievements FOR SELECT
USING (true);

-- RLS policies for user_achievements
CREATE POLICY "Anyone can view user achievements"
ON public.user_achievements FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK (true);

-- Insert predefined achievements
INSERT INTO public.achievements (name, description, icon, type, requirement, xp_reward, badge_color) VALUES
-- First steps achievements
('First Step', 'Watch your first video', 'play', 'first_steps', 1, 5, 'green'),
('Bookworm Begins', 'Read your first PDF', 'book-open', 'first_steps', 1, 5, 'blue'),

-- Video milestone achievements
('Video Enthusiast', 'Watch 5 videos', 'video', 'videos_watched', 5, 10, 'cyan'),
('Video Addict', 'Watch 25 videos', 'video', 'videos_watched', 25, 25, 'purple'),
('Video Master', 'Watch 100 videos', 'video', 'videos_watched', 100, 50, 'gold'),

-- Batch completion achievements  
('Course Complete', 'Complete your first course', 'graduation-cap', 'batch_complete', 1, 20, 'green'),
('Scholar', 'Complete 3 courses', 'award', 'batch_complete', 3, 50, 'purple'),
('Knowledge Seeker', 'Complete 10 courses', 'crown', 'batch_complete', 10, 100, 'gold'),

-- XP milestone achievements
('Rising Star', 'Reach 50 XP', 'star', 'xp_milestone', 50, 10, 'yellow'),
('Shooting Star', 'Reach 200 XP', 'sparkles', 'xp_milestone', 200, 25, 'orange'),
('Supernova', 'Reach 500 XP', 'zap', 'xp_milestone', 500, 50, 'red'),
('Legendary', 'Reach 1000 XP', 'trophy', 'xp_milestone', 1000, 100, 'gold');

-- Create index for faster lookups
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX idx_achievements_type ON public.achievements(type);