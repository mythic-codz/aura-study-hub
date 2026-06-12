import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface VideoItem {
  id?: string;
  title: string;
  url: string;
  duration?: number;
  thumbnail?: string;
  subject?: string;
  topic?: string;
}

export interface PdfItem {
  id?: string;
  title: string;
  url: string;
  pages?: number;
  thumbnail?: string;
  subject?: string;
  topic?: string;
}

// Content item with type (new unified format)
export interface ContentItem {
  title: string;
  type: 'video' | 'pdf';
  url: string;
  thumbnail?: string;
  subject?: string;
  topic?: string;
  globalIndex?: number;
}

// Topic contains an array of content items
export interface Topic {
  name: string;
  items: ContentItem[];
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
      const item = v as Record<string, Json>;
      const type = String(item.type || '').toLowerCase();
      // Only include actual videos, not tests or other types
      if (type === 'video') {
        return {
          title: String(item.title || ''),
          url: String(item.url || ''),
          thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : undefined,
          subject: typeof item.subject === 'string' ? item.subject : undefined,
          topic: typeof item.topic === 'string' ? item.topic : undefined,
        } as VideoItem;
      }
    }
    return null;
  }).filter((v): v is VideoItem => v !== null);
}

function parsePdfs(pdfs: Json | null): PdfItem[] {
  if (!pdfs || !Array.isArray(pdfs)) return [];
  return pdfs.map((p) => {
    if (typeof p === 'object' && p !== null && 'title' in p && 'url' in p) {
      const item = p as Record<string, Json>;
      const type = String(item.type || '').toLowerCase();
      // Only include actual pdfs
      if (type === 'pdf') {
        return {
          title: String(item.title || ''),
          url: String(item.url || ''),
          thumbnail: typeof item.thumbnail === 'string' ? item.thumbnail : undefined,
          subject: typeof item.subject === 'string' ? item.subject : undefined,
          topic: typeof item.topic === 'string' ? item.topic : undefined,
        } as PdfItem;
      }
    }
    return null;
  }).filter((p): p is PdfItem => p !== null);
}

/**
 * Parse the flat 'data' array from batches table
 * This contains all content items with type field
 */
function parseDataColumn(data: Json | null): { videos: VideoItem[]; pdfs: PdfItem[] } {
  if (!data || !Array.isArray(data)) return { videos: [], pdfs: [] };
  
  const videos: VideoItem[] = [];
  const pdfs: PdfItem[] = [];
  
  data.forEach((item, index) => {
    if (typeof item !== 'object' || item === null) return;
    
    const i = item as Record<string, Json>;
    const title = String(i.title || '');
    const url = String(i.url || '');
    const type = String(i.type || '').toLowerCase();
    const thumbnail = typeof i.thumbnail === 'string' ? i.thumbnail : undefined;
    const subject = typeof i.subject === 'string' ? i.subject : undefined;
    const topic = typeof i.topic === 'string' ? i.topic : undefined;
    
    if (!title || !url) return;
    
    // Skip tests and other non-video/pdf types
    if (type === 'video') {
      videos.push({ id: String(index), title, url, thumbnail, subject, topic });
    } else if (type === 'pdf') {
      pdfs.push({ id: String(index), title, url, thumbnail, subject, topic });
    }
  });
  
  return { videos, pdfs };
}

/**
 * Parse structured_data which has the format:
 * {
 *   "Source/BatchName": {
 *     "SubjectName": {
 *       "TopicName": [{ title, type, url, thumbnail, subject, topic }]
 *     }
 *   }
 * }
 * 
 * We flatten the first level (Source) and treat Subject -> Topic -> Items as our hierarchy
 */
function parseStructuredData(data: Json | null): StructuredData | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  
  const obj = data as Record<string, Json>;
  const keys = Object.keys(obj);
  
  if (keys.length === 0) return null;
  
  // Check if it's the legacy format with 'subjects' array
  if (obj.subjects && Array.isArray(obj.subjects)) {
    return parseLegacyStructuredData(obj);
  }
  
  // NEW FORMAT: { "Source": { "Subject": { "Topic": [items] } } }
  // We iterate through each source (usually just one) and collect all subjects
  const allSubjects: Subject[] = [];
  let globalVideoIndex = 0;
  let globalPdfIndex = 0;
  
  for (const sourceKey of keys) {
    const sourceData = obj[sourceKey];
    
    // sourceData should be { "SubjectName": { "TopicName": [items] } }
    if (typeof sourceData !== 'object' || sourceData === null || Array.isArray(sourceData)) {
      continue;
    }
    
    const subjectMap = sourceData as Record<string, Json>;
    
    for (const subjectName of Object.keys(subjectMap)) {
      const subjectData = subjectMap[subjectName];
      
      // subjectData should be { "TopicName": [items] }
      if (typeof subjectData !== 'object' || subjectData === null || Array.isArray(subjectData)) {
        continue;
      }
      
      const topicMap = subjectData as Record<string, Json>;
      const topics: Topic[] = [];
      
      for (const topicName of Object.keys(topicMap)) {
        const topicItems = topicMap[topicName];
        
        // topicItems should be an array of content items
        if (!Array.isArray(topicItems)) continue;
        
        const items: ContentItem[] = [];
        const videos: VideoItem[] = [];
        const pdfs: PdfItem[] = [];
        
        for (const item of topicItems) {
          if (typeof item !== 'object' || item === null) continue;
          
          const i = item as Record<string, Json>;
          const title = String(i.title || '');
          const url = String(i.url || '');
          const type = String(i.type || '').toLowerCase() as 'video' | 'pdf';
          const thumbnail = typeof i.thumbnail === 'string' ? i.thumbnail : undefined;
          
          if (!title || !url) continue;
          
          if (type === 'video') {
            const videoItem: VideoItem = {
              id: String(globalVideoIndex),
              title,
              url,
              thumbnail,
              subject: subjectName,
              topic: topicName,
            };
            videos.push(videoItem);
            items.push({
              title,
              type: 'video',
              url,
              thumbnail,
              subject: subjectName,
              topic: topicName,
              globalIndex: globalVideoIndex,
            });
            globalVideoIndex++;
          } else if (type === 'pdf') {
            const pdfItem: PdfItem = {
              id: String(globalPdfIndex),
              title,
              url,
              thumbnail,
              subject: subjectName,
              topic: topicName,
            };
            pdfs.push(pdfItem);
            items.push({
              title,
              type: 'pdf',
              url,
              thumbnail,
              subject: subjectName,
              topic: topicName,
              globalIndex: globalPdfIndex,
            });
            globalPdfIndex++;
          }
        }
        
        if (items.length > 0) {
          topics.push({ name: topicName, items, videos, pdfs });
        }
      }
      
      if (topics.length > 0) {
        // Check if subject already exists (from another source)
        const existingSubject = allSubjects.find(s => s.name === subjectName);
        if (existingSubject) {
          existingSubject.topics.push(...topics);
        } else {
          allSubjects.push({ name: subjectName, topics });
        }
      }
    }
  }
  
  if (allSubjects.length === 0) return null;
  
  return { subjects: allSubjects };
}

/**
 * Parse legacy format: { subjects: [{ name, topics: [{ name, videos, pdfs }] }] }
 */
function parseLegacyStructuredData(obj: Record<string, Json>): StructuredData | null {
  if (!obj.subjects || !Array.isArray(obj.subjects)) return null;
  
  let globalVideoIndex = 0;
  let globalPdfIndex = 0;
  
  return {
    subjects: (obj.subjects as Json[]).map((subject) => {
      const s = subject as Record<string, Json>;
      return {
        name: String(s.name || 'Untitled Subject'),
        topics: Array.isArray(s.topics) 
          ? (s.topics as Json[]).map((topic) => {
              const t = topic as Record<string, Json>;
              const videos = parseVideos(t.videos as Json).map(v => ({
                ...v,
                id: String(globalVideoIndex++),
              }));
              const pdfs = parsePdfs(t.pdfs as Json).map(p => ({
                ...p,
                id: String(globalPdfIndex++),
              }));
              
              // Create items array from videos and pdfs for unified access
              const items: ContentItem[] = [
                ...videos.map((v) => ({ 
                  title: v.title, 
                  type: 'video' as const, 
                  url: v.url, 
                  thumbnail: v.thumbnail,
                  globalIndex: parseInt(v.id || '0'),
                })),
                ...pdfs.map((p) => ({ 
                  title: p.title, 
                  type: 'pdf' as const, 
                  url: p.url, 
                  thumbnail: p.thumbnail,
                  globalIndex: parseInt(p.id || '0'),
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

/**
 * Map a row from the `batches` table into a normalized Batch.
 */
function mapBatchRow(batch: Record<string, Json> & { id: string }): Batch {
  const structured = parseStructuredData(batch.structured_data ?? null);

  let videos = parseVideos(batch.videos ?? null);
  let pdfs = parsePdfs(batch.pdfs ?? null);

  if (videos.length === 0 && pdfs.length === 0 && batch.data) {
    const fromData = parseDataColumn(batch.data);
    videos = fromData.videos;
    pdfs = fromData.pdfs;
  }

  return {
    id: batch.id,
    name: (batch.name as string) ?? null,
    thumbnail: (batch.thumbnail as string) ?? null,
    data: batch.data ?? null,
    updated_at: (batch.updated_at as string) ?? null,
    videos,
    pdfs,
    structured_data: structured,
  };
}

/**
 * Derive a human-friendly course name for an extracted batch.
 */
function extractedName(row: Record<string, Json>): string {
  const sources: Json[] = [];
  if (Array.isArray(row.all_items)) sources.push(...(row.all_items as Json[]));
  if (Array.isArray(row.videos)) sources.push(...(row.videos as Json[]));
  if (Array.isArray(row.pdfs)) sources.push(...(row.pdfs as Json[]));
  for (const item of sources) {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const course = (item as Record<string, Json>).course;
      if (typeof course === 'string' && course.trim()) return course;
    }
  }
  return String(row.batch_name || row.batch_id || 'Untitled Course');
}

/**
 * Build a Source -> Subject -> Topic structured_data object from the
 * extracted_batches `structured` field: { Subject: { videos:[], pdfs:[] } }
 */
function buildExtractedStructured(structured: Json | null, batchName: string): Json | null {
  if (!structured || typeof structured !== 'object' || Array.isArray(structured)) return null;
  const subjects = structured as Record<string, Json>;
  const inner: Record<string, Json> = {};

  for (const subjectName of Object.keys(subjects)) {
    const group = subjects[subjectName];
    if (!group || typeof group !== 'object' || Array.isArray(group)) continue;
    const g = group as Record<string, Json>;
    const vids = Array.isArray(g.videos) ? (g.videos as Json[]) : [];
    const pds = Array.isArray(g.pdfs) ? (g.pdfs as Json[]) : [];
    const items = [...vids, ...pds].filter((i) => {
      if (!i || typeof i !== 'object' || Array.isArray(i)) return false;
      const it = i as Record<string, Json>;
      const type = String(it.type || '').toLowerCase();
      return !!it.title && !!it.url && (type === 'video' || type === 'pdf');
    });
    if (items.length > 0) inner[subjectName] = { Recorded: items as Json };
  }

  if (Object.keys(inner).length === 0) return null;
  return { [batchName]: inner as Json } as Json;
}

/**
 * Map a row from the `extracted_batches` table into a normalized Batch.
 */
function mapExtractedRow(row: Record<string, Json>): Batch {
  const name = extractedName(row);
  const structured = parseStructuredData(buildExtractedStructured(row.structured ?? null, name));
  const videos = parseVideos(row.videos ?? null);
  const pdfs = parsePdfs(row.pdfs ?? null);

  return {
    id: String(row.batch_id),
    name,
    thumbnail: null,
    data: row.all_items ?? null,
    updated_at: (row.extracted_at as string) ?? null,
    videos,
    pdfs,
    structured_data: structured,
  };
}

export function useBatches() {
  return useQuery({
    queryKey: ['batches'],
    queryFn: async () => {
      const [batchesRes, extractedRes] = await Promise.all([
        supabase.from('batches').select('*').order('updated_at', { ascending: false }),
        supabase.from('extracted_batches').select('*').order('extracted_at', { ascending: false }),
      ]);

      if (batchesRes.error) throw batchesRes.error;

      const byId = new Map<string, Batch>();

      (batchesRes.data || []).forEach((b) => {
        const mapped = mapBatchRow(b as Record<string, Json> & { id: string });
        byId.set(mapped.id, mapped);
      });

      // Extracted batches fill in any not already present
      if (!extractedRes.error) {
        (extractedRes.data || []).forEach((row) => {
          const mapped = mapExtractedRow(row as Record<string, Json>);
          if (!byId.has(mapped.id)) byId.set(mapped.id, mapped);
        });
      }

      const all = Array.from(byId.values());
      all.sort((a, b) => {
        const ta = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const tb = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return tb - ta;
      });

      return all;
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
      if (data) return mapBatchRow(data as Record<string, Json> & { id: string });

      // Fall back to extracted_batches
      const { data: ex, error: exError } = await supabase
        .from('extracted_batches')
        .select('*')
        .eq('batch_id', batchId)
        .maybeSingle();

      if (exError) throw exError;
      if (!ex) return null;

      return mapExtractedRow(ex as Record<string, Json>);
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
