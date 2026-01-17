-- Add password column to users table
ALTER TABLE public.users ADD COLUMN password_hash text;

-- Add more achievements
INSERT INTO public.achievements (name, description, icon, type, requirement, xp_reward, badge_color)
VALUES 
  -- More video achievements
  ('Video Explorer', 'Watch 10 videos', 'tv', 'videos_watched', 10, 15, 'teal'),
  ('Binge Watcher', 'Watch 50 videos', 'monitor-play', 'videos_watched', 50, 40, 'indigo'),
  
  -- PDF achievements
  ('Page Turner', 'Read 5 PDFs', 'file-text', 'first_steps', 5, 15, 'emerald'),
  ('Library Card', 'Read 10 PDFs', 'library', 'first_steps', 10, 25, 'teal'),
  ('Bookmaster', 'Read 25 PDFs', 'book-marked', 'first_steps', 25, 50, 'purple'),
  
  -- More XP milestones
  ('XP Hunter', 'Reach 100 XP', 'target', 'xp_milestone', 100, 15, 'lime'),
  ('XP Champion', 'Reach 300 XP', 'medal', 'xp_milestone', 300, 35, 'amber'),
  ('XP Legend', 'Reach 750 XP', 'flame', 'xp_milestone', 750, 75, 'rose'),
  
  -- More batch completions
  ('Dedicated Learner', 'Complete 5 courses', 'bookmark-check', 'batch_complete', 5, 75, 'blue'),
  ('Course Champion', 'Complete 7 courses', 'shield-check', 'batch_complete', 7, 90, 'violet'),
  
  -- Favorites achievement
  ('Curator', 'Add 3 courses to favorites', 'heart', 'first_steps', 3, 10, 'pink'),
  ('Collector', 'Add 5 courses to favorites', 'heart', 'first_steps', 5, 20, 'rose');
