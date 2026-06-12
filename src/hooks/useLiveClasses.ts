import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LiveClass {
  id: string;
  batch_id: string;
  title: string;
  stream_url: string | null;
  thumbnail: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch currently-active live classes (ended_at IS NULL) and keep them
 * in sync in real time. Ended lives are filtered out so old lives never show.
 */
export function useLiveClasses() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('live-classes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'live_classes' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['live_classes'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['live_classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('live_classes')
        .select('*')
        .is('ended_at', null)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return (data || []) as LiveClass[];
    },
    refetchInterval: 60_000,
  });
}

/** Returns the active live class for a batch, if any. */
export function useBatchLive(batchId: string) {
  const { data: lives } = useLiveClasses();
  return lives?.find((l) => l.batch_id === batchId) ?? null;
}
