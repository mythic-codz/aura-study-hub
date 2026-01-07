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
}

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
    }: {
      batchId: string;
      contentType: 'video' | 'pdf';
      contentIndex: number;
      progressPercent: number;
      lastPosition: number;
    }) => {
      if (!user) throw new Error('No user');

      const completed = progressPercent >= 95;
      
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

      if (existing) {
        const { data, error } = await supabase
          .from('progress')
          .update({
            progress_percent: progressPercent,
            last_position: lastPosition,
            completed,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;

        // Award XP on first completion
        if (completed && !wasAlreadyCompleted) {
          await addXP(contentType === 'video' ? 10 : 5);
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
          })
          .select()
          .single();

        if (error) throw error;

        // Award XP on first completion
        if (completed) {
          await addXP(contentType === 'video' ? 10 : 5);
        }

        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}
