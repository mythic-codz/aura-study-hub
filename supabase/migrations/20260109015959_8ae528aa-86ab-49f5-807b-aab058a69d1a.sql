-- Add xp_milestones_claimed column to track which XP milestones have been claimed for each content
ALTER TABLE public.progress 
ADD COLUMN IF NOT EXISTS xp_milestones_claimed TEXT DEFAULT '[]';