import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';
import { useFavorites } from './useFavorites';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'batch_complete' | 'videos_watched' | 'xp_milestone' | 'streak' | 'first_steps';
  requirement: number;
  xp_reward: number;
  badge_color: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

// Fetch all achievements
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('type', { ascending: true })
        .order('requirement', { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });
}

// Fetch user's unlocked achievements
export function useUserAchievements() {
  const { user } = useUser();

  return useQuery({
    queryKey: ['user_achievements', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      return data.map(ua => ({
        ...ua,
        achievement: ua.achievement as unknown as Achievement,
      })) as UserAchievement[];
    },
    enabled: !!user,
  });
}

// Hook to unlock achievements
export function useUnlockAchievement() {
  const { user, addXP } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (achievementId: string) => {
      if (!user) throw new Error('No user');

      // Check if already unlocked
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', user.id)
        .eq('achievement_id', achievementId)
        .maybeSingle();

      if (existing) return null; // Already unlocked

      // Get achievement details for XP reward
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (!achievement) throw new Error('Achievement not found');

      // Unlock achievement
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievementId,
        })
        .select()
        .single();

      if (error) throw error;

      // Award XP
      if (achievement.xp_reward > 0) {
        await addXP(achievement.xp_reward);
      }

      return { userAchievement: data, achievement };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['user_achievements'] });
      
      if (result?.achievement) {
        toast.success(`🏆 Achievement Unlocked: ${result.achievement.name}!`, {
          description: `+${result.achievement.xp_reward} XP`,
          duration: 5000,
        });
      }
    },
  });
}

// Hook to check and unlock achievements based on current stats
export function useCheckAchievements() {
  const { user } = useUser();
  const { data: achievements } = useAchievements();
  const { data: userAchievements } = useUserAchievements();
  const { data: favorites } = useFavorites();
  const unlockAchievement = useUnlockAchievement();

  const checkAndUnlock = async () => {
    if (!user || !achievements || !userAchievements) return;

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievement_id));

    // Get user stats
    const { data: progressData } = await supabase
      .from('progress')
      .select('*')
      .eq('user_id', user.id);

    const completedVideos = progressData?.filter(p => p.content_type === 'video' && p.completed).length || 0;
    const completedPdfs = progressData?.filter(p => p.content_type === 'pdf' && p.completed).length || 0;
    const favoriteCount = favorites?.length || 0;
    
    // Count completed batches (unique batch_ids where all content is done)
    const batchProgress = new Map<string, { total: number; completed: number }>();
    progressData?.forEach(p => {
      if (!batchProgress.has(p.batch_id)) {
        batchProgress.set(p.batch_id, { total: 0, completed: 0 });
      }
      const bp = batchProgress.get(p.batch_id)!;
      bp.total++;
      if (p.completed) bp.completed++;
    });
    
    // Count batches where user has started learning
    const batchesStarted = batchProgress.size;
    const currentXP = user.xp;

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      let shouldUnlock = false;

      switch (achievement.type) {
        case 'first_steps':
          // Handle different first_steps achievements
          if (achievement.icon === 'play' && completedVideos >= 1) shouldUnlock = true;
          if (achievement.icon === 'book-open' && completedPdfs >= 1) shouldUnlock = true;
          // PDF milestones
          if (achievement.icon === 'file-text' && completedPdfs >= achievement.requirement) shouldUnlock = true;
          if (achievement.icon === 'library' && completedPdfs >= achievement.requirement) shouldUnlock = true;
          if (achievement.icon === 'book-marked' && completedPdfs >= achievement.requirement) shouldUnlock = true;
          // Favorites achievements
          if (achievement.icon === 'heart' && favoriteCount >= achievement.requirement) shouldUnlock = true;
          break;
        
        case 'videos_watched':
          if (completedVideos >= achievement.requirement) shouldUnlock = true;
          break;
        
        case 'batch_complete':
          if (batchesStarted >= achievement.requirement) shouldUnlock = true;
          break;
        
        case 'xp_milestone':
          if (currentXP >= achievement.requirement) shouldUnlock = true;
          break;
      }

      if (shouldUnlock) {
        try {
          await unlockAchievement.mutateAsync(achievement.id);
        } catch (err) {
          console.error('Error unlocking achievement:', err);
        }
      }
    }
  };

  return { checkAndUnlock };
}