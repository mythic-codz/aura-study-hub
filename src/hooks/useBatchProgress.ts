import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';
import type { Batch } from './useBatches';

export interface BatchProgress {
  batchId: string;
  totalItems: number;
  completedItems: number;
  progressPercent: number;
}

export function useBatchProgress(batches: Batch[] | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['batch-progress', user?.id, batches?.map(b => b.id).join(',')],
    queryFn: async (): Promise<Record<string, BatchProgress>> => {
      if (!user || !batches?.length) return {};

      const { data: progressData, error } = await supabase
        .from('progress')
        .select('batch_id, content_type, content_index, completed')
        .eq('user_id', user.id);

      if (error) throw error;

      const progressMap: Record<string, BatchProgress> = {};

      for (const batch of batches) {
        const totalItems = batch.videos.length + batch.pdfs.length;
        const batchProgress = progressData?.filter(p => p.batch_id === batch.id) || [];
        const completedItems = batchProgress.filter(p => p.completed).length;
        const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        progressMap[batch.id] = {
          batchId: batch.id,
          totalItems,
          completedItems,
          progressPercent,
        };
      }

      return progressMap;
    },
    enabled: !!user && !!batches?.length,
  });
}

export function useSingleBatchProgress(batch: Batch | undefined) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['single-batch-progress', user?.id, batch?.id],
    queryFn: async (): Promise<BatchProgress | null> => {
      if (!user || !batch) return null;

      const totalItems = batch.videos.length + batch.pdfs.length;

      const { data: progressData, error } = await supabase
        .from('progress')
        .select('completed')
        .eq('user_id', user.id)
        .eq('batch_id', batch.id);

      if (error) throw error;

      const completedItems = progressData?.filter(p => p.completed).length || 0;
      const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        batchId: batch.id,
        totalItems,
        completedItems,
        progressPercent,
      };
    },
    enabled: !!user && !!batch,
  });
}
