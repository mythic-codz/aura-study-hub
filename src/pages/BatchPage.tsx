import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, FileText, Loader2, Video, BookOpen, CheckCircle2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { useBatch } from '@/hooks/useBatches';
import { useProgress } from '@/hooks/useProgress';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ContentFilter = 'all' | 'video' | 'pdf';

export default function BatchPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { data: batch, isLoading } = useBatch(batchId || '');
  const { data: progressData } = useProgress(batchId);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');

  // Get progress for a specific content item
  const getContentProgress = (type: 'video' | 'pdf', index: number) => {
    if (!progressData) return { percent: 0, completed: false };
    const progress = progressData.find(
      p => p.content_type === type && p.content_index === index
    );
    return {
      percent: progress?.progress_percent || 0,
      completed: progress?.completed || false,
    };
  };

  // Calculate overall batch progress
  const batchProgress = useMemo(() => {
    if (!batch || !progressData) return { completed: 0, total: 0, percent: 0 };
    const total = batch.videos.length + batch.pdfs.length;
    const completed = progressData.filter(p => p.completed).length;
    return {
      completed,
      total,
      percent: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [batch, progressData]);

  // Filter content based on selected tab
  const filteredVideos = useMemo(() => {
    if (contentFilter === 'pdf') return [];
    return batch?.videos || [];
  }, [batch, contentFilter]);

  const filteredPdfs = useMemo(() => {
    if (contentFilter === 'video') return [];
    return batch?.pdfs || [];
  }, [batch, contentFilter]);

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
      <main className="container mx-auto px-4 pt-20 sm:pt-24 pb-12">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 sm:mb-6 text-sm sm:text-base">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Batch header with progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card p-4 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-2xl sm:text-3xl font-display font-bold">
              {batch.name || 'Untitled Batch'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{batchProgress.completed}/{batchProgress.total} completed</span>
              {batchProgress.percent === 100 && (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
            </div>
          </div>
          
          {/* Overall progress bar */}
          <div className="space-y-2">
            <Progress value={batchProgress.percent} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {Math.round(batchProgress.percent)}% complete
            </p>
          </div>
        </motion.div>

        {/* Content type filter tabs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={contentFilter} onValueChange={(v) => setContentFilter(v as ContentFilter)}>
            <TabsList className="glass-card border-0 p-1">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">All Content</span>
                <span className="sm:hidden">All</span>
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                  {(batch.videos.length || 0) + (batch.pdfs.length || 0)}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="video" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
              >
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Videos</span>
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                  {batch.videos.length || 0}
                </span>
              </TabsTrigger>
              <TabsTrigger 
                value="pdf" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
              >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">PDFs</span>
                <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                  {batch.pdfs.length || 0}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Videos Section */}
        {filteredVideos.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" /> Videos
            </h2>
            <div className="grid gap-3">
              {filteredVideos.map((video, i) => {
                const { percent, completed } = getContentProgress('video', i);
                return (
                  <Link key={i} to={`/play/${batchId}/video/${i}`}>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.05 }} 
                      className="glass-card-hover p-3 sm:p-4"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          completed 
                            ? 'bg-green-500/20' 
                            : 'bg-gradient-to-br from-primary to-accent'
                        }`}>
                          {completed ? (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                          ) : (
                            <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm sm:text-base line-clamp-1">
                            {video.title}
                          </span>
                          {percent > 0 && !completed && (
                            <div className="mt-1 flex items-center gap-2">
                              <Progress value={percent} className="h-1 flex-1" />
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {Math.round(percent)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* PDFs Section */}
        {filteredPdfs.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" /> PDFs
            </h2>
            <div className="grid gap-3">
              {filteredPdfs.map((pdf, i) => {
                const { percent, completed } = getContentProgress('pdf', i);
                return (
                  <Link key={i} to={`/play/${batchId}/pdf/${i}`}>
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.05 }} 
                      className="glass-card-hover p-3 sm:p-4"
                    >
                      <div className="flex items-center gap-3 sm:gap-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          completed 
                            ? 'bg-green-500/20' 
                            : 'bg-gradient-to-br from-accent to-primary'
                        }`}>
                          {completed ? (
                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                          ) : (
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-sm sm:text-base line-clamp-1">
                            {pdf.title}
                          </span>
                          {completed && (
                            <span className="text-xs text-green-500">Completed</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Empty state */}
        {filteredVideos.length === 0 && filteredPdfs.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">
              No {contentFilter === 'all' ? 'content' : contentFilter === 'video' ? 'videos' : 'PDFs'} in this batch
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
