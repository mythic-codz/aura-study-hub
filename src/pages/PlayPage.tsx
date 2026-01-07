import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { VideoPlayer } from '@/components/VideoPlayer';
import { PDFViewer } from '@/components/PDFViewer';
import { useBatch } from '@/hooks/useBatches';
import { useUpdateProgress } from '@/hooks/useProgress';

export default function PlayPage() {
  const { batchId, type, index } = useParams<{ batchId: string; type: 'video' | 'pdf'; index: string }>();
  const { data: batch, isLoading } = useBatch(batchId || '');
  const updateProgress = useUpdateProgress();

  const contentIndex = parseInt(index || '0', 10);

  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const content = type === 'video' ? batch?.videos[contentIndex] : batch?.pdfs[contentIndex];

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

  const handleProgress = (percent: number, currentTime?: number) => {
    updateProgress.mutate({
      batchId: batchId!,
      contentType: type!,
      contentIndex,
      progressPercent: percent,
      lastPosition: currentTime || 0,
    });
  };

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Link to={`/batch/${batchId}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to {batch.name}
        </Link>

        {type === 'video' ? (
          <VideoPlayer src={content.url} title={content.title} onProgress={handleProgress} />
        ) : (
          <PDFViewer src={content.url} title={content.title} onProgress={handleProgress} />
        )}
      </main>
    </div>
  );
}
