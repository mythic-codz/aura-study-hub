import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ContentItem {
  id?: string;
  title: string;
  type: 'video' | 'pdf' | 'test';
  url: string;
  duration?: number;
  pages?: number;
  thumbnail?: string;
  course?: string;
  subject?: string;
  topic?: string;
}

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

// New nested structure: Tile -> Subject -> Topic -> Items
export type TopicContent = ContentItem[];
export type SubjectContent = Record<string, TopicContent>;
export type TileContent = Record<string, SubjectContent>;
export type StructuredData = Record<string, TileContent>;

// Legacy structure for backwards compatibility
export interface Topic {
  name: string;
  videos: VideoItem[];
  pdfs: PdfItem[];
}

export interface Subject {
  name: string;
  topics: Topic[];
}

export interface LegacyStructuredData {
  subjects: Subject[];
}

export interface Batch {
  id: string;
  name: string | null;
  thumbnail: string | null;
  data: Json | null;
  structured_data: StructuredData | null;
  legacy_structured_data: LegacyStructuredData | null;
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

// Parse legacy array-based structured data
function parseLegacyStructuredData(data: Json | null): LegacyStructuredData | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const obj = data as Record<string, Json>;
  if (!obj.subjects || !Array.isArray(obj.subjects)) return null;
  
  return {
    subjects: (obj.subjects as Json[]).map((subject) => {
      const s = subject as Record<string, Json>;
      return {
        name: String(s.name || 'Untitled Subject'),
        topics: Array.isArray(s.topics) 
          ? (s.topics as Json[]).map((topic) => {
              const t = topic as Record<string, Json>;
              return {
                name: String(t.name || 'Untitled Topic'),
                videos: parseVideos(t.videos as Json),
                pdfs: parsePdfs(t.pdfs as Json),
              };
            })
          : [],
      };
    }),
  };
}

// Parse new nested object structure: Tile -> Subject -> Topic -> Items[]
function parseStructuredData(data: Json | null): StructuredData | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  
  const obj = data as Record<string, Json>;
  
  // Check if this is legacy format (has 'subjects' array)
  if (obj.subjects && Array.isArray(obj.subjects)) return null;
  
  // Check if it's the new nested object format
  const tiles: StructuredData = {};
  
  for (const [tileName, tileData] of Object.entries(obj)) {
    if (typeof tileData !== 'object' || tileData === null || Array.isArray(tileData)) continue;
    
    const subjects: TileContent = {};
    const tileObj = tileData as Record<string, Json>;
    
    for (const [subjectName, subjectData] of Object.entries(tileObj)) {
      if (typeof subjectData !== 'object' || subjectData === null || Array.isArray(subjectData)) continue;
      
      const topics: SubjectContent = {};
      const subjectObj = subjectData as Record<string, Json>;
      
      for (const [topicName, topicData] of Object.entries(subjectObj)) {
        if (!Array.isArray(topicData)) continue;
        
        const items: ContentItem[] = (topicData as Json[])
          .filter((item): item is Record<string, Json> => 
            typeof item === 'object' && item !== null && 'title' in item && 'url' in item
          )
          .map((item) => ({
            id: item.id as string | undefined,
            title: String(item.title),
            type: (item.type as 'video' | 'pdf' | 'test') || 'video',
            url: String(item.url),
            duration: item.duration as number | undefined,
            pages: item.pages as number | undefined,
            thumbnail: item.thumbnail as string | undefined,
            course: item.course as string | undefined,
            subject: item.subject as string | undefined,
            topic: item.topic as string | undefined,
          }));
        
        if (items.length > 0) {
          topics[topicName] = items;
        }
      }
      
      if (Object.keys(topics).length > 0) {
        subjects[subjectName] = topics;
      }
    }
    
    if (Object.keys(subjects).length > 0) {
      tiles[tileName] = subjects;
    }
  }
  
  return Object.keys(tiles).length > 0 ? tiles : null;
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
        legacy_structured_data: parseLegacyStructuredData(batch.structured_data),
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
        legacy_structured_data: parseLegacyStructuredData(data.structured_data),
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

// Helper to get all content items with their hierarchy info for a batch
export function getAllContentFromBatch(batch: Batch): Array<{
  item: ContentItem;
  tile: string;
  subject: string;
  topic: string;
  globalIndex: number;
}> {
  const content: Array<{
    item: ContentItem;
    tile: string;
    subject: string;
    topic: string;
    globalIndex: number;
  }> = [];
  
  if (batch.structured_data) {
    let globalIndex = 0;
    for (const [tileName, subjects] of Object.entries(batch.structured_data)) {
      for (const [subjectName, topics] of Object.entries(subjects)) {
        for (const [topicName, items] of Object.entries(topics)) {
          for (const item of items) {
            content.push({
              item,
              tile: tileName,
              subject: subjectName,
              topic: topicName,
              globalIndex,
            });
            globalIndex++;
          }
        }
      }
    }
  }
  
  return content;
}
