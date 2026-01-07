import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, FileText, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { useBatch } from '@/hooks/useBatches';

export default function BatchPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { data: batch, isLoading } = useBatch(batchId || '');

  if (isLoading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen animated-bg">
        <Header />
        <main className="container mx-auto px-4 pt-24 text-center">
          <p className="text-muted-foreground">Batch not found</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-display font-bold mb-8">
          {batch.name || 'Untitled Batch'}
        </motion.h1>

        {batch.videos.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Play className="w-5 h-5 text-primary" /> Videos</h2>
            <div className="grid gap-3">
              {batch.videos.map((video, i) => (
                <Link key={i} to={`/play/${batchId}/video/${i}`}>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-hover p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <Play className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-medium">{video.title}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {batch.pdfs.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-accent" /> PDFs</h2>
            <div className="grid gap-3">
              {batch.pdfs.map((pdf, i) => (
                <Link key={i} to={`/play/${batchId}/pdf/${i}`}>
                  <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass-card-hover p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <span className="font-medium">{pdf.title}</span>
                  </motion.div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
