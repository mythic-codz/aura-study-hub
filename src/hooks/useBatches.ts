import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface VideoItem {
  id?: string;
  title: string;
  url: string;
  duration?: number;
  thumbnail?: string;
}

export interface PdfItem {
  id?: string;
  title: string;
  url: string;
  pages?: number;
  thumbnail?: string;
}

export interface Batch {
  id: string;
  name: string | null;
  thumbnail: string | null;
  data: Json | null;
  videos: VideoItem[];
  pdfs: PdfItem[];
  updated_at: string | null;
}

function parseVideos(videos: Json | null): VideoItem[] {
  if (!videos || !Array.isArray(videos)) return [];
  return videos.map((v) => {
    if (typeof v === 'object' && v !== null && 'title' in v && 'url' in v) {
      return v as unknown as VideoItem;
    }
    return null;
  }).filter((v): v is VideoItem => v !== null);
}

function parsePdfs(pdfs: Json | null): PdfItem[] {
  if (!pdfs || !Array.isArray(pdfs)) return [];
  return pdfs.map((p) => {
    if (typeof p === 'object' && p !== null && 'title' in p && 'url' in p) {
      return p as unknown as PdfItem;
    }
    return null;
  }).filter((p): p is PdfItem => p !== null);
}

export function useBatches() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(batch => ({
        ...batch,
        videos: parseVideos(batch.videos),
        pdfs: parsePdfs(batch.pdfs),
      })) as Batch[];
    },
  });
}

export function useBatch(batchId: string) {
  return useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        videos: parseVideos(data.videos),
        pdfs: parsePdfs(data.pdfs),
      } as Batch;
    },
    enabled: !!batchId,
  });
}

export function useLatestContent() {
  return useQuery({
    queryKey: ['latestContent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const allContent: Array<{
        type: 'video' | 'pdf';
        item: VideoItem | PdfItem;
        batchId: string;
        batchName: string;
        index: number;
      }> = [];

      (data || []).forEach(batch => {
        const videos = parseVideos(batch.videos);
        const pdfs = parsePdfs(batch.pdfs);
        
        videos.forEach((video, index) => {
          allContent.push({
            type: 'video',
            item: video,
            batchId: batch.id,
            batchName: batch.name || 'Untitled',
            index,
          });
        });

        pdfs.forEach((pdf, index) => {
          allContent.push({
            type: 'pdf',
            item: pdf,
            batchId: batch.id,
            batchName: batch.name || 'Untitled',
            index,
          });
        });
      });

      return allContent.slice(0, 10);
    },
  });
}
