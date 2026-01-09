import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, FileText, Loader2, Video, BookOpen, CheckCircle2, ChevronRight, Layers, FolderOpen } from 'lucide-react';
import { Header } from '@/components/Header';
import { useBatch, Subject, Topic } from '@/hooks/useBatches';
import { useProgress } from '@/hooks/useProgress';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ContentFilter = 'all' | 'video' | 'pdf';
type ViewLevel = 'subjects' | 'topics' | 'content';

export default function BatchPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { data: batch, isLoading } = useBatch(batchId || '');
  const { data: progressData } = useProgress(batchId);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Determine current view level
  const viewLevel: ViewLevel = selectedTopic ? 'content' : selectedSubject ? 'topics' : 'subjects';

  // Check if batch has structured data
  const hasStructuredData = batch?.structured_data?.subjects && batch.structured_data.subjects.length > 0;

  // Get all videos and PDFs (flat list for legacy support)
  const allVideos = useMemo(() => {
    if (hasStructuredData && batch?.structured_data) {
      const videos: { video: typeof batch.videos[0]; subjectName: string; topicName: string; globalIndex: number }[] = [];
      let globalIndex = 0;
      batch.structured_data.subjects.forEach((subject) => {
        subject.topics.forEach((topic) => {
          topic.videos.forEach((video) => {
            videos.push({ video, subjectName: subject.name, topicName: topic.name, globalIndex });
            globalIndex++;
          });
        });
      });
      return videos;
    }
    return batch?.videos.map((video, i) => ({ video, subjectName: '', topicName: '', globalIndex: i })) || [];
  }, [batch, hasStructuredData]);

  const allPdfs = useMemo(() => {
    if (hasStructuredData && batch?.structured_data) {
      const pdfs: { pdf: typeof batch.pdfs[0]; subjectName: string; topicName: string; globalIndex: number }[] = [];
      let globalIndex = 0;
      batch.structured_data.subjects.forEach((subject) => {
        subject.topics.forEach((topic) => {
          topic.pdfs.forEach((pdf) => {
            pdfs.push({ pdf, subjectName: subject.name, topicName: topic.name, globalIndex });
            globalIndex++;
          });
        });
      });
      return pdfs;
    }
    return batch?.pdfs.map((pdf, i) => ({ pdf, subjectName: '', topicName: '', globalIndex: i })) || [];
  }, [batch, hasStructuredData]);

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
    const total = allVideos.length + allPdfs.length;
    if (!progressData || total === 0) return { completed: 0, total, percent: 0 };
    const completed = progressData.filter(p => p.completed).length;
    return {
      completed,
      total,
      percent: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [allVideos, allPdfs, progressData]);

  // Get subject progress
  const getSubjectProgress = (subject: Subject) => {
    let total = 0;
    let completed = 0;
    let videoIndex = 0;
    let pdfIndex = 0;

    // Calculate global indices for this subject
    batch?.structured_data?.subjects.forEach((s) => {
      if (s.name === subject.name) {
        s.topics.forEach((topic) => {
          topic.videos.forEach(() => {
            total++;
            const progress = getContentProgress('video', videoIndex);
            if (progress.completed) completed++;
            videoIndex++;
          });
          topic.pdfs.forEach(() => {
            total++;
            const progress = getContentProgress('pdf', pdfIndex);
            if (progress.completed) completed++;
            pdfIndex++;
          });
        });
      } else {
        s.topics.forEach((topic) => {
          videoIndex += topic.videos.length;
          pdfIndex += topic.pdfs.length;
        });
      }
    });

    return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
  };

  // Get topic progress
  const getTopicProgress = (subject: Subject, topic: Topic) => {
    let total = 0;
    let completed = 0;
    let videoIndex = 0;
    let pdfIndex = 0;

    // Navigate to the topic and calculate indices
    batch?.structured_data?.subjects.forEach((s) => {
      s.topics.forEach((t) => {
        if (s.name === subject.name && t.name === topic.name) {
          // This is the target topic
          t.videos.forEach(() => {
            total++;
            const progress = getContentProgress('video', videoIndex);
            if (progress.completed) completed++;
            videoIndex++;
          });
          t.pdfs.forEach(() => {
            total++;
            const progress = getContentProgress('pdf', pdfIndex);
            if (progress.completed) completed++;
            pdfIndex++;
          });
        } else {
          videoIndex += t.videos.length;
          pdfIndex += t.pdfs.length;
        }
      });
    });

    return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
  };

  // Get topic content with global indices
  const getTopicContent = (subject: Subject, topic: Topic) => {
    let videoStartIndex = 0;
    let pdfStartIndex = 0;
    let found = false;

    batch?.structured_data?.subjects.forEach((s) => {
      s.topics.forEach((t) => {
        if (s.name === subject.name && t.name === topic.name) {
          found = true;
          return;
        }
        if (!found) {
          videoStartIndex += t.videos.length;
          pdfStartIndex += t.pdfs.length;
        }
      });
    });

    return {
      videos: topic.videos.map((video, i) => ({
        video,
        globalIndex: videoStartIndex + i,
      })),
      pdfs: topic.pdfs.map((pdf, i) => ({
        pdf,
        globalIndex: pdfStartIndex + i,
      })),
    };
  };

  // Navigation handlers
  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
  };

  const handleTopicClick = (topic: Topic) => {
    setSelectedTopic(topic);
  };

  const handleBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
    } else if (selectedSubject) {
      setSelectedSubject(null);
    }
  };

  // Filter content for current topic
  const currentTopicContent = useMemo(() => {
    if (!selectedSubject || !selectedTopic) return { videos: [], pdfs: [] };
    const content = getTopicContent(selectedSubject, selectedTopic);
    return {
      videos: contentFilter === 'pdf' ? [] : content.videos,
      pdfs: contentFilter === 'video' ? [] : content.pdfs,
    };
  }, [selectedSubject, selectedTopic, contentFilter, batch]);

  // Legacy flat view for batches without structured_data
  const legacyFilteredVideos = useMemo(() => {
    if (contentFilter === 'pdf') return [];
    return batch?.videos || [];
  }, [batch, contentFilter]);

  const legacyFilteredPdfs = useMemo(() => {
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
        {/* Breadcrumb navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <button 
            onClick={() => { setSelectedSubject(null); setSelectedTopic(null); }}
            className={`hover:text-foreground transition-colors ${!selectedSubject ? 'text-foreground font-medium' : ''}`}
          >
            {batch.name || 'Course'}
          </button>
          {selectedSubject && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button 
                onClick={() => setSelectedTopic(null)}
                className={`hover:text-foreground transition-colors ${!selectedTopic ? 'text-foreground font-medium' : ''}`}
              >
                {selectedSubject.name}
              </button>
            </>
          )}
          {selectedTopic && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">{selectedTopic.name}</span>
            </>
          )}
        </div>

        {/* Back button for nested views */}
        {(selectedSubject || selectedTopic) && (
          <button 
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}

        {/* Batch header with progress */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="glass-card p-4 sm:p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">
              {selectedTopic 
                ? selectedTopic.name 
                : selectedSubject 
                  ? selectedSubject.name 
                  : batch.name || 'Untitled Course'}
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

        <AnimatePresence mode="wait">
          {/* SUBJECTS VIEW */}
          {hasStructuredData && viewLevel === 'subjects' && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Subjects
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {batch.structured_data!.subjects.map((subject, i) => {
                  const progress = getSubjectProgress(subject);
                  return (
                    <motion.button
                      key={subject.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleSubjectClick(subject)}
                      className="glass-card-hover p-4 text-left w-full group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <h3 className="font-semibold mb-1 line-clamp-1">{subject.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {subject.topics.length} topic{subject.topics.length !== 1 ? 's' : ''}
                      </p>
                      <Progress value={progress.percent} className="h-1" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {progress.completed}/{progress.total} completed
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TOPICS VIEW */}
          {hasStructuredData && viewLevel === 'topics' && selectedSubject && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Topics in {selectedSubject.name}
              </h2>
              <div className="grid gap-3">
                {selectedSubject.topics.map((topic, i) => {
                  const videoCount = topic.videos.length;
                  const pdfCount = topic.pdfs.length;
                  const topicProgress = getTopicProgress(selectedSubject, topic);
                  const isComplete = topicProgress.percent === 100;
                  return (
                    <motion.button
                      key={topic.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleTopicClick(topic)}
                      className="glass-card-hover p-4 text-left w-full group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isComplete 
                              ? 'bg-green-500/20' 
                              : 'bg-gradient-to-br from-accent to-primary'
                          }`}>
                            {isComplete ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : (
                              <BookOpen className="w-5 h-5 text-primary-foreground" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold line-clamp-1">{topic.name}</h3>
                            <p className="text-xs text-muted-foreground">
                              {videoCount > 0 && <span>{videoCount} video{videoCount !== 1 ? 's' : ''}</span>}
                              {videoCount > 0 && pdfCount > 0 && ' • '}
                              {pdfCount > 0 && <span>{pdfCount} PDF{pdfCount !== 1 ? 's' : ''}</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {topicProgress.completed}/{topicProgress.total}
                          </span>
                          <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </div>
                      <Progress value={topicProgress.percent} className="h-1" />
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* CONTENT VIEW (for structured data) */}
          {hasStructuredData && viewLevel === 'content' && selectedTopic && (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Content type filter tabs */}
              <div className="mb-6">
                <Tabs value={contentFilter} onValueChange={(v) => setContentFilter(v as ContentFilter)}>
                  <TabsList className="glass-card border-0 p-1">
                    <TabsTrigger 
                      value="all" 
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span className="hidden sm:inline">All</span>
                      <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                        {selectedTopic.videos.length + selectedTopic.pdfs.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="video" 
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span className="hidden sm:inline">Videos</span>
                      <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                        {selectedTopic.videos.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pdf" 
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">PDFs</span>
                      <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                        {selectedTopic.pdfs.length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Videos */}
              {currentTopicContent.videos.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" /> Videos
                  </h2>
                  <div className="grid gap-3">
                    {currentTopicContent.videos.map(({ video, globalIndex }, i) => {
                      const { percent, completed } = getContentProgress('video', globalIndex);
                      return (
                        <Link key={i} to={`/play/${batchId}/video/${globalIndex}`}>
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
                </section>
              )}

              {/* PDFs */}
              {currentTopicContent.pdfs.length > 0 && (
                <section>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" /> PDFs
                  </h2>
                  <div className="grid gap-3">
                    {currentTopicContent.pdfs.map(({ pdf, globalIndex }, i) => {
                      const { completed } = getContentProgress('pdf', globalIndex);
                      return (
                        <Link key={i} to={`/play/${batchId}/pdf/${globalIndex}`}>
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
                </section>
              )}

              {/* Empty state */}
              {currentTopicContent.videos.length === 0 && currentTopicContent.pdfs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No {contentFilter === 'all' ? 'content' : contentFilter === 'video' ? 'videos' : 'PDFs'} in this topic
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {/* LEGACY FLAT VIEW (for batches without structured_data) */}
          {!hasStructuredData && (
            <motion.div
              key="legacy"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {/* Content type filter tabs */}
              <div className="mb-6">
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
              </div>

              {/* Videos Section */}
              {legacyFilteredVideos.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" /> Videos
                  </h2>
                  <div className="grid gap-3">
                    {legacyFilteredVideos.map((video, i) => {
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
                </section>
              )}

              {/* PDFs Section */}
              {legacyFilteredPdfs.length > 0 && (
                <section>
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" /> PDFs
                  </h2>
                  <div className="grid gap-3">
                    {legacyFilteredPdfs.map((pdf, i) => {
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
                </section>
              )}

              {/* Empty state */}
              {legacyFilteredVideos.length === 0 && legacyFilteredPdfs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No {contentFilter === 'all' ? 'content' : contentFilter === 'video' ? 'videos' : 'PDFs'} in this batch
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}