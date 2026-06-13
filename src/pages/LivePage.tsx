import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Radio } from 'lucide-react';
import { Header } from '@/components/Header';
import { VideoPlayer } from '@/components/VideoPlayer';
import { useBatch } from '@/hooks/useBatches';
import { useBatchLive, useLiveClasses } from '@/hooks/useLiveClasses';

export default function LivePage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { isLoading: livesLoading } = useLiveClasses();
  const { data: batch } = useBatch(batchId || '');
  const live = useBatchLive(batchId || '');

  if (livesLoading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-12">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Link
            to={batchId ? `/batch/${batchId}` : '/'}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" /> Back to {batch?.name || 'course'}
          </Link>
          {live && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold uppercase tracking-wider">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
              Live
            </div>
          )}
        </div>

        {live && live.stream_url ? (
          <>
            <VideoPlayer src={live.stream_url} title={live.title} />
            <div className="glass-card p-4 mt-4">
              <h1 className="text-lg sm:text-xl font-display font-bold flex items-center gap-2">
                <Radio className="w-5 h-5 text-red-500" />
                {live.title}
              </h1>
              {batch?.name && (
                <p className="text-sm text-muted-foreground mt-1">{batch.name}</p>
              )}
            </div>
          </>
        ) : (
          <div className="glass-card p-12 rounded-2xl text-center">
            <Radio className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Live Class Right Now</h3>
            <p className="text-muted-foreground">
              This class isn't streaming live at the moment. Check back when a session starts.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
