import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { VideoPlayer } from '@/components/VideoPlayer';
import { PDFViewer } from '@/components/PDFViewer';
import { useBatch, VideoItem, PdfItem } from '@/hooks/useBatches';
import { useProgress, useUpdateProgress } from '@/hooks/useProgress';

export default function PlayPage() {
  const { batchId, type, index } = useParams<{ batchId: string; type: 'video' | 'pdf'; index: string }>();
  const { data: batch, isLoading } = useBatch(batchId || '');
  const { data: progressData } = useProgress(batchId);
  const updateProgress = useUpdateProgress();
  const [videoDuration, setVideoDuration] = useState<number>(0);

  const contentIndex = parseInt(index || '0', 10);

  // Build flat list of content from structured_data OR legacy arrays
  // This ensures consistent indexing between BatchPage and PlayPage
  const { allVideos, allPdfs } = useMemo(() => {
    if (batch?.structured_data?.subjects && batch.structured_data.subjects.length > 0) {
      const videos: VideoItem[] = [];
      const pdfs: PdfItem[] = [];
      
      batch.structured_data.subjects.forEach((subject) => {
        subject.topics.forEach((topic) => {
          topic.videos.forEach((video) => {
            videos.push(video);
          });
          topic.pdfs.forEach((pdf) => {
            pdfs.push(pdf);
          });
        });
      });
      
      return { allVideos: videos, allPdfs: pdfs };
    }
    
    // Legacy: use flat arrays
    return { 
      allVideos: batch?.videos || [], 
      allPdfs: batch?.pdfs || [] 
    };
  }, [batch]);

  // Get the content item based on type and index
  const content = useMemo(() => {
    if (type === 'video') {
      return allVideos[contentIndex];
    } else {
      return allPdfs[contentIndex];
    }
  }, [type, contentIndex, allVideos, allPdfs]);

  // Get initial position for resume playback
  const existingProgress = progressData?.find(
    p => p.content_type === type && p.content_index === contentIndex
  );
  const initialTime = existingProgress?.last_position || 0;

  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!batch || !content) {
    return (
      <div className="min-h-screen animated-bg">
        <Header />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">Content not found</p>
        </main>
      </div>
    );
  }

  const handleProgress = (percent: number, currentTime?: number, duration?: number) => {
    // Store duration for completion check
    if (duration && duration > 0) {
      setVideoDuration(duration);
    }
    
    updateProgress.mutate({
      batchId: batchId!,
      contentType: type!,
      contentIndex,
      progressPercent: percent,
      lastPosition: currentTime || 0,
      videoDuration: duration || videoDuration,
    });
  };

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-12">
        <Link to={`/batch/${batchId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 text-sm sm:text-base">
          <ArrowLeft className="w-4 h-4" /> Back to {batch.name}
        </Link>

        {type === 'video' ? (
          <VideoPlayer 
            src={content.url} 
            title={content.title} 
            onProgress={handleProgress} 
            initialTime={initialTime}
          />
        ) : (
          <PDFViewer src={content.url} title={content.title} onProgress={handleProgress} />
        )}
      </main>
    </div>
  );
}
