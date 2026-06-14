import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_leaderboard', { _limit: limit });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
