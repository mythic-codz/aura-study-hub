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

// New format: Content item with type
export interface ContentItem {
  title: string;
  type: 'video' | 'pdf' | 'test';
  url: string;
  content_index?: number;
  duration?: number;
  pages?: number;
  thumbnail?: string;
}

// New format: Topic is just a map of content items
export interface Topic {
  name: string;
  items: ContentItem[];
  // Legacy support
  videos: VideoItem[];
  pdfs: PdfItem[];
}

export interface Subject {
  name: string;
  topics: Topic[];
}

export interface StructuredData {
  subjects: Subject[];
}

export interface Batch {
  id: string;
  name: string | null;
  thumbnail: string | null;
  data: Json | null;
  structured_data: StructuredData | null;
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

function parseContentItems(items: Json | null): ContentItem[] {
  if (!items || !Array.isArray(items)) return [];
  const result: ContentItem[] = [];
  for (const item of items) {
    if (typeof item === 'object' && item !== null && 'title' in item && 'url' in item) {
      const i = item as Record<string, Json>;
      result.push({
        title: String(i.title || ''),
        type: (i.type as 'video' | 'pdf' | 'test') || 'video',
        url: String(i.url || ''),
        content_index: typeof i.content_index === 'number' ? i.content_index : undefined,
        duration: typeof i.duration === 'number' ? i.duration : undefined,
        pages: typeof i.pages === 'number' ? i.pages : undefined,
        thumbnail: typeof i.thumbnail === 'string' ? i.thumbnail : undefined,
      });
    }
  }
  return result;
}

function parseStructuredData(data: Json | null): StructuredData | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const obj = data as Record<string, Json>;
  
  // NEW FORMAT: { "Subject Name": { "Topic Name": [ { title, type, url } ] } }
  // Check if it's the new format (keys are subject names, not 'subjects' array)
  const keys = Object.keys(obj);
  const isNewFormat = keys.length > 0 && !obj.subjects;
  
  if (isNewFormat) {
    const subjects: Subject[] = keys.map((subjectName, subjectIndex) => {
      const subjectData = obj[subjectName];
      if (typeof subjectData !== 'object' || subjectData === null || Array.isArray(subjectData)) {
        return { name: subjectName, topics: [] };
      }
      
      const topicKeys = Object.keys(subjectData as Record<string, Json>);
      let contentIndex = 0;
      
      const topics: Topic[] = topicKeys.map((topicName) => {
        const topicData = (subjectData as Record<string, Json>)[topicName];
        const items = parseContentItems(topicData as Json);
        
        // Assign content_index if not provided
        items.forEach((item) => {
          if (item.content_index === undefined) {
            item.content_index = contentIndex++;
          }
        });
        
        // Legacy support: split items into videos and pdfs
        const videos: VideoItem[] = items
          .filter(i => i.type === 'video')
          .map(i => ({ id: String(i.content_index), title: i.title, url: i.url, duration: i.duration, thumbnail: i.thumbnail }));
        const pdfs: PdfItem[] = items
          .filter(i => i.type === 'pdf')
          .map(i => ({ id: String(i.content_index), title: i.title, url: i.url, pages: i.pages, thumbnail: i.thumbnail }));
        
        return { name: topicName, items, videos, pdfs };
      });
      
      return { name: subjectName, topics };
    });
    
    return { subjects };
  }
  
  // OLD FORMAT: { subjects: [{ name, topics: [{ name, videos, pdfs }] }] }
  if (!obj.subjects || !Array.isArray(obj.subjects)) return null;
  
  return {
    subjects: (obj.subjects as Json[]).map((subject) => {
      const s = subject as Record<string, Json>;
      return {
        name: String(s.name || 'Untitled Subject'),
        topics: Array.isArray(s.topics) 
          ? (s.topics as Json[]).map((topic) => {
              const t = topic as Record<string, Json>;
              const videos = parseVideos(t.videos as Json);
              const pdfs = parsePdfs(t.pdfs as Json);
              // Create items array from videos and pdfs for unified access
              const items: ContentItem[] = [
                ...videos.map((v, i) => ({ 
                  title: v.title, 
                  type: 'video' as const, 
                  url: v.url, 
                  content_index: i,
                  duration: v.duration,
                  thumbnail: v.thumbnail
                })),
                ...pdfs.map((p, i) => ({ 
                  title: p.title, 
                  type: 'pdf' as const, 
                  url: p.url, 
                  content_index: videos.length + i,
                  pages: p.pages,
                  thumbnail: p.thumbnail
                })),
              ];
              return {
                name: String(t.name || 'Untitled Topic'),
                items,
                videos,
                pdfs,
              };
            })
          : [],
      };
    }),
  };
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
        structured_data: parseStructuredData(batch.structured_data),
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
        structured_data: parseStructuredData(data.structured_data),
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
