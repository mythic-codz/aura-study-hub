import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from './useUser';

export interface Note {
  id: string;
  user_id: string;
  batch_id: string;
  content_type: string;
  content_index: number;
  timestamp_pos: number;
  text: string;
  is_bookmark: boolean;
  created_at: string;
  updated_at: string;
}

export function useNotes(batchId: string, contentType: string, contentIndex: number) {
  const { user } = useUser();

  return useQuery({
    queryKey: ['notes', user?.id, batchId, contentType, contentIndex],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('batch_id', batchId)
        .eq('content_type', contentType)
        .eq('content_index', contentIndex)
        .order('timestamp_pos', { ascending: true });

      if (error) throw error;
      return (data || []) as Note[];
    },
    enabled: !!user && !!batchId,
  });
}

export function useAddNote() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      batchId, contentType, contentIndex, timestampPos, text, isBookmark,
    }: {
      batchId: string;
      contentType: string;
      contentIndex: number;
      timestampPos: number;
      text: string;
      isBookmark?: boolean;
    }) => {
      if (!user) throw new Error('No user');
      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          batch_id: batchId,
          content_type: contentType,
          content_index: contentIndex,
          timestamp_pos: timestampPos,
          text,
          is_bookmark: isBookmark || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, text, isBookmark }: { id: string; text?: string; isBookmark?: boolean }) => {
      const updates: Record<string, unknown> = {};
      if (text !== undefined) updates.text = text;
      if (isBookmark !== undefined) updates.is_bookmark = isBookmark;

      const { data, error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
