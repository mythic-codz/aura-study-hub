import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Define type for the public view (only safe fields)
interface LeaderboardUser {
  id: string;
  name: string;
  avatar_url: string | null;
  xp: number;
}

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: async () => {
      // Use the public view which only exposes safe fields (no IP, device_id)
      const { data, error } = await supabase
        .from('users_public')
        .select('id, name, avatar_url, xp')
        .order('xp', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as LeaderboardUser[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
