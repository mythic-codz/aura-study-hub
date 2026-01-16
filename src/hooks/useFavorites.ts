import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';

export interface Favorite {
  id: string;
  user_id: string;
  batch_id: string;
  created_at: string;
}

export function useFavorites() {
  const { user } = useUser();
  
  return useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Favorite[];
    },
    enabled: !!user?.id,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useUser();

  return useMutation({
    mutationFn: async ({ batchId, isFavorite }: { batchId: string; isFavorite: boolean }) => {
      if (!user?.id) throw new Error('User not found');

      if (isFavorite) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('batch_id', batchId);

        if (error) throw error;
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            batch_id: batchId,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}

export function useIsFavorite(batchId: string) {
  const { data: favorites } = useFavorites();
  return favorites?.some(f => f.batch_id === batchId) ?? false;
}
