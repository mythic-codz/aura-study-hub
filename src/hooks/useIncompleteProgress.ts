import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';
import { useBatches, VideoItem, PdfItem } from './useBatches';

export interface IncompleteItem {
  type: 'video' | 'pdf';
  item: VideoItem | PdfItem;
  batchId: string;
  batchName: string;
  index: number;
  progressPercent: number;
  lastPosition: number;
}

export function useIncompleteProgress() {
  const { user } = useUser();
  const { data: batches } = useBatches();

  return useQuery({
    queryKey: ['incompleteProgress', user?.id],
    queryFn: async () => {
      if (!user || !batches) return [];

      const { data: progressData, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', false)
        .gt('progress_percent', 0)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const incompleteItems: IncompleteItem[] = [];

      (progressData || []).forEach((progress) => {
        const batch = batches.find((b) => b.id === progress.batch_id);
        if (!batch) return;

        if (progress.content_type === 'video') {
          const video = batch.videos[progress.content_index];
          if (video) {
            incompleteItems.push({
              type: 'video',
              item: video,
              batchId: batch.id,
              batchName: batch.name || 'Untitled',
              index: progress.content_index,
              progressPercent: progress.progress_percent,
              lastPosition: progress.last_position || 0,
            });
          }
        } else if (progress.content_type === 'pdf') {
          const pdf = batch.pdfs[progress.content_index];
          if (pdf) {
            incompleteItems.push({
              type: 'pdf',
              item: pdf,
              batchId: batch.id,
              batchName: batch.name || 'Untitled',
              index: progress.content_index,
              progressPercent: progress.progress_percent,
              lastPosition: progress.last_position || 0,
            });
          }
        }
      });

      return incompleteItems;
    },
    enabled: !!user && !!batches,
  });
}
