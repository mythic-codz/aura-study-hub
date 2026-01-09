import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';

export interface Progress {
  id: string;
  user_id: string;
  batch_id: string;
  content_type: 'video' | 'pdf';
  content_index: number;
  progress_percent: number;
  completed: boolean;
  last_position: number;
  xp_milestones_claimed?: string; // JSON array of claimed milestones: ["25", "50", "75", "complete"]
}

// XP milestones for video watching
const VIDEO_XP_MILESTONES = {
  25: 2,   // 25% watched = 2 XP
  50: 3,   // 50% watched = 3 XP
  75: 3,   // 75% watched = 3 XP
  complete: 2, // completion = 2 XP (total 10 XP for full video)
};

export function useProgress(batchId?: string) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['progress', user?.id, batchId],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id);

      if (batchId) {
        query = query.eq('batch_id', batchId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as Progress[];
    },
    enabled: !!user,
  });
}

export function useUpdateProgress() {
  const { user, addXP } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId,
      contentType,
      contentIndex,
      progressPercent,
      lastPosition,
      videoDuration,
    }: {
      batchId: string;
      contentType: 'video' | 'pdf';
      contentIndex: number;
      progressPercent: number;
      lastPosition: number;
      videoDuration?: number; // Duration in seconds for video completion check
    }) => {
      if (!user) throw new Error('No user');

      // For videos: complete 5 minutes before end OR at 95%
      // For PDFs: complete at 95%
      let completed = progressPercent >= 95;
      if (contentType === 'video' && videoDuration && videoDuration > 300) {
        // If more than 5 minutes of video, complete 5 min before end
        const timeRemaining = videoDuration - lastPosition;
        if (timeRemaining <= 300) {
          completed = true;
        }
      }
      
      // Check if progress exists
      const { data: existing } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('batch_id', batchId)
        .eq('content_type', contentType)
        .eq('content_index', contentIndex)
        .maybeSingle();

      const wasAlreadyCompleted = existing?.completed;
      let claimedMilestones: string[] = [];
      
      try {
        // Cast to any since the column may not be in types yet
        const existingData = existing as Record<string, unknown> | null;
        const storedMilestones = existingData?.xp_milestones_claimed;
        claimedMilestones = storedMilestones 
          ? JSON.parse(storedMilestones as string) 
          : [];
      } catch {
        claimedMilestones = [];
      }

      // Calculate XP to award for video milestones
      let xpToAward = 0;
      const newMilestones: string[] = [...claimedMilestones];

      if (contentType === 'video') {
        // Check each milestone
        if (progressPercent >= 25 && !claimedMilestones.includes('25')) {
          xpToAward += VIDEO_XP_MILESTONES[25];
          newMilestones.push('25');
        }
        if (progressPercent >= 50 && !claimedMilestones.includes('50')) {
          xpToAward += VIDEO_XP_MILESTONES[50];
          newMilestones.push('50');
        }
        if (progressPercent >= 75 && !claimedMilestones.includes('75')) {
          xpToAward += VIDEO_XP_MILESTONES[75];
          newMilestones.push('75');
        }
        if (completed && !claimedMilestones.includes('complete')) {
          xpToAward += VIDEO_XP_MILESTONES.complete;
          newMilestones.push('complete');
        }
      } else if (contentType === 'pdf') {
        // PDF gets 5 XP on completion
        if (completed && !wasAlreadyCompleted) {
          xpToAward = 5;
        }
      }

      const milestonesJson = JSON.stringify(newMilestones);

      if (existing) {
        const { data, error } = await supabase
          .from('progress')
          .update({
            progress_percent: progressPercent,
            last_position: lastPosition,
            completed,
            xp_milestones_claimed: milestonesJson,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;

        // Award accumulated XP
        if (xpToAward > 0) {
          await addXP(xpToAward);
        }

        return data;
      } else {
        const { data, error } = await supabase
          .from('progress')
          .insert({
            user_id: user.id,
            batch_id: batchId,
            content_type: contentType,
            content_index: contentIndex,
            progress_percent: progressPercent,
            last_position: lastPosition,
            completed,
            xp_milestones_claimed: milestonesJson,
          })
          .select()
          .single();

        if (error) throw error;

        // Award XP
        if (xpToAward > 0) {
          await addXP(xpToAward);
        }

        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
