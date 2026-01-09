import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, FileText, Loader2, Video, BookOpen, CheckCircle2, ChevronRight, Layers, FolderOpen, Grid3X3, PenTool } from 'lucide-react';
import { Header } from '@/components/Header';
import { useBatch, getAllContentFromBatch, ContentItem } from '@/hooks/useBatches';
import { useProgress } from '@/hooks/useProgress';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ContentFilter = 'all' | 'video' | 'pdf';
type ViewLevel = 'tiles' | 'subjects' | 'topics' | 'content';

export default function BatchPage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { data: batch, isLoading } = useBatch(batchId || '');
  const { data: progressData } = useProgress(batchId);
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [selectedTile, setSelectedTile] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Determine current view level
  const viewLevel: ViewLevel = selectedTopic 
    ? 'content' 
    : selectedSubject 
      ? 'topics' 
      : selectedTile 
        ? 'subjects' 
        : 'tiles';

  // Check if batch has the new structured data format
  const hasStructuredData = batch?.structured_data && Object.keys(batch.structured_data).length > 0;

  // Get all content items flattened with hierarchy info
  const allContent = useMemo(() => {
    if (!batch) return [];
    return getAllContentFromBatch(batch);
  }, [batch]);

  // Get progress for a specific content item by global index
  const getContentProgress = (globalIndex: number, type: 'video' | 'pdf') => {
    if (!progressData) return { percent: 0, completed: false };
    const progress = progressData.find(
      p => p.content_type === type && p.content_index === globalIndex
    );
    return {
      percent: progress?.progress_percent || 0,
      completed: progress?.completed || false,
    };
  };

  // Calculate overall batch progress
  const batchProgress = useMemo(() => {
    const total = allContent.length;
    if (!progressData || total === 0) return { completed: 0, total, percent: 0 };
    const completed = progressData.filter(p => p.completed).length;
    return {
      completed,
      total,
      percent: total > 0 ? (completed / total) * 100 : 0,
    };
  }, [allContent, progressData]);

  // Get tile names
  const tileNames = useMemo(() => {
    if (!batch?.structured_data) return [];
    return Object.keys(batch.structured_data);
  }, [batch]);

  // Get subjects for selected tile
  const subjectNames = useMemo(() => {
    if (!batch?.structured_data || !selectedTile) return [];
    return Object.keys(batch.structured_data[selectedTile] || {});
  }, [batch, selectedTile]);

  // Get topics for selected subject
  const topicNames = useMemo(() => {
    if (!batch?.structured_data || !selectedTile || !selectedSubject) return [];
    return Object.keys(batch.structured_data[selectedTile]?.[selectedSubject] || {});
  }, [batch, selectedTile, selectedSubject]);

  // Get content items for selected topic
  const topicContent = useMemo(() => {
    if (!batch?.structured_data || !selectedTile || !selectedSubject || !selectedTopic) return [];
    return batch.structured_data[selectedTile]?.[selectedSubject]?.[selectedTopic] || [];
  }, [batch, selectedTile, selectedSubject, selectedTopic]);

  // Get tile progress
  const getTileProgress = (tileName: string) => {
    const tileItems = allContent.filter(c => c.tile === tileName);
    const total = tileItems.length;
    if (!progressData || total === 0) return { completed: 0, total, percent: 0 };
    
    const completed = tileItems.filter(c => {
      const progress = progressData.find(
        p => p.content_type === c.item.type && p.content_index === c.globalIndex
      );
      return progress?.completed;
    }).length;
    
    return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
  };

  // Get subject progress
  const getSubjectProgress = (tileName: string, subjectName: string) => {
    const subjectItems = allContent.filter(c => c.tile === tileName && c.subject === subjectName);
    const total = subjectItems.length;
    if (!progressData || total === 0) return { completed: 0, total, percent: 0 };
    
    const completed = subjectItems.filter(c => {
      const progress = progressData.find(
        p => p.content_type === c.item.type && p.content_index === c.globalIndex
      );
      return progress?.completed;
    }).length;
    
    return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
  };

  // Get topic progress
  const getTopicProgress = (tileName: string, subjectName: string, topicName: string) => {
    const topicItems = allContent.filter(
      c => c.tile === tileName && c.subject === subjectName && c.topic === topicName
    );
    const total = topicItems.length;
    if (!progressData || total === 0) return { completed: 0, total, percent: 0 };
    
    const completed = topicItems.filter(c => {
      const progress = progressData.find(
        p => p.content_type === c.item.type && p.content_index === c.globalIndex
      );
      return progress?.completed;
    }).length;
    
    return { completed, total, percent: total > 0 ? (completed / total) * 100 : 0 };
  };

  // Get global index for a content item
  const getGlobalIndex = (tileName: string, subjectName: string, topicName: string, itemIndex: number) => {
    const items = allContent.filter(
      c => c.tile === tileName && c.subject === subjectName && c.topic === topicName
    );
    return items[itemIndex]?.globalIndex ?? 0;
  };

  // Filter content by type
  const filteredTopicContent = useMemo(() => {
    if (contentFilter === 'all') return topicContent;
    return topicContent.filter(item => item.type === contentFilter);
  }, [topicContent, contentFilter]);

  // Navigation handlers
  const handleTileClick = (tile: string) => {
    setSelectedTile(tile);
    setSelectedSubject(null);
    setSelectedTopic(null);
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
  };

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleBack = () => {
    if (selectedTopic) {
      setSelectedTopic(null);
    } else if (selectedSubject) {
      setSelectedSubject(null);
    } else if (selectedTile) {
      setSelectedTile(null);
    }
  };

  // Get content type icon
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />;
      case 'pdf': return <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />;
      case 'test': return <PenTool className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />;
      default: return <Play className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />;
    }
  };

  // Count items by type
  const countByType = (items: ContentItem[]) => {
    const videos = items.filter(i => i.type === 'video').length;
    const pdfs = items.filter(i => i.type === 'pdf').length;
    const tests = items.filter(i => i.type === 'test').length;
    return { videos, pdfs, tests, total: items.length };
  };

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
            onClick={() => { setSelectedTile(null); setSelectedSubject(null); setSelectedTopic(null); }}
            className={`hover:text-foreground transition-colors ${!selectedTile ? 'text-foreground font-medium' : ''}`}
          >
            {batch.name || 'Course'}
          </button>
          {selectedTile && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button 
                onClick={() => { setSelectedSubject(null); setSelectedTopic(null); }}
                className={`hover:text-foreground transition-colors ${!selectedSubject ? 'text-foreground font-medium' : ''}`}
              >
                {selectedTile}
              </button>
            </>
          )}
          {selectedSubject && (
            <>
              <ChevronRight className="w-4 h-4" />
              <button 
                onClick={() => setSelectedTopic(null)}
                className={`hover:text-foreground transition-colors ${!selectedTopic ? 'text-foreground font-medium' : ''}`}
              >
                {selectedSubject}
              </button>
            </>
          )}
          {selectedTopic && (
            <>
              <ChevronRight className="w-4 h-4" />
              <span className="text-foreground font-medium">{selectedTopic}</span>
            </>
          )}
        </div>

        {/* Back button for nested views */}
        {(selectedTile || selectedSubject || selectedTopic) && (
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
                ? selectedTopic 
                : selectedSubject 
                  ? selectedSubject 
                  : selectedTile
                    ? selectedTile
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
          {/* TILES VIEW */}
          {hasStructuredData && viewLevel === 'tiles' && (
            <motion.div
              key="tiles"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Grid3X3 className="w-5 h-5 text-primary" /> Course Sections
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {tileNames.map((tileName, i) => {
                  const progress = getTileProgress(tileName);
                  const subjectCount = Object.keys(batch.structured_data![tileName]).length;
                  return (
                    <motion.button
                      key={tileName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleTileClick(tileName)}
                      className="glass-card-hover p-4 text-left w-full group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <Grid3X3 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <h3 className="font-semibold mb-1 line-clamp-1">{tileName}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {subjectCount} subject{subjectCount !== 1 ? 's' : ''}
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

          {/* SUBJECTS VIEW */}
          {hasStructuredData && viewLevel === 'subjects' && selectedTile && (
            <motion.div
              key="subjects"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" /> Subjects in {selectedTile}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {subjectNames.map((subjectName, i) => {
                  const progress = getSubjectProgress(selectedTile, subjectName);
                  const topicCount = Object.keys(batch.structured_data![selectedTile][subjectName]).length;
                  return (
                    <motion.button
                      key={subjectName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleSubjectClick(subjectName)}
                      className="glass-card-hover p-4 text-left w-full group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                      <h3 className="font-semibold mb-1 line-clamp-1">{subjectName}</h3>
                      <p className="text-xs text-muted-foreground mb-2">
                        {topicCount} topic{topicCount !== 1 ? 's' : ''}
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
          {hasStructuredData && viewLevel === 'topics' && selectedTile && selectedSubject && (
            <motion.div
              key="topics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" /> Topics in {selectedSubject}
              </h2>
              <div className="grid gap-3">
                {topicNames.map((topicName, i) => {
                  const topicItems = batch.structured_data![selectedTile][selectedSubject][topicName];
                  const counts = countByType(topicItems);
                  const topicProgress = getTopicProgress(selectedTile, selectedSubject, topicName);
                  const isComplete = topicProgress.percent === 100;
                  return (
                    <motion.button
                      key={topicName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleTopicClick(topicName)}
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
                            <h3 className="font-semibold line-clamp-1">{topicName}</h3>
                            <p className="text-xs text-muted-foreground">
                              {counts.videos > 0 && <span>{counts.videos} video{counts.videos !== 1 ? 's' : ''}</span>}
                              {counts.videos > 0 && counts.pdfs > 0 && ' • '}
                              {counts.pdfs > 0 && <span>{counts.pdfs} PDF{counts.pdfs !== 1 ? 's' : ''}</span>}
                              {(counts.videos > 0 || counts.pdfs > 0) && counts.tests > 0 && ' • '}
                              {counts.tests > 0 && <span>{counts.tests} test{counts.tests !== 1 ? 's' : ''}</span>}
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

          {/* CONTENT VIEW */}
          {hasStructuredData && viewLevel === 'content' && selectedTile && selectedSubject && selectedTopic && (
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
                        {topicContent.length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="video" 
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                    >
                      <Video className="w-4 h-4" />
                      <span className="hidden sm:inline">Videos</span>
                      <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                        {topicContent.filter(i => i.type === 'video').length}
                      </span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="pdf" 
                      className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">PDFs</span>
                      <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                        {topicContent.filter(i => i.type === 'pdf').length}
                      </span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Content Items */}
              <div className="grid gap-3">
                {filteredTopicContent.map((item, i) => {
                  const globalIndex = getGlobalIndex(selectedTile, selectedSubject, selectedTopic, 
                    topicContent.findIndex(t => t === item));
                  const { percent, completed } = getContentProgress(globalIndex, item.type as 'video' | 'pdf');
                  const playUrl = item.type === 'pdf' 
                    ? `/play/${batchId}/pdf/${globalIndex}`
                    : `/play/${batchId}/video/${globalIndex}`;
                  
                  return (
                    <Link key={i} to={playUrl}>
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
                              getContentIcon(item.type)
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-sm sm:text-base line-clamp-1">
                              {item.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground capitalize">
                                {item.type === 'pdf' ? 'PDF' : item.type}
                              </span>
                              {percent > 0 && !completed && (
                                <>
                                  <span className="text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(percent)}% complete
                                  </span>
                                </>
                              )}
                              {completed && (
                                <span className="text-xs text-green-500">Completed</span>
                              )}
                            </div>
                            {percent > 0 && !completed && (
                              <Progress value={percent} className="h-1 mt-2" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  );
                })}
              </div>

              {/* Empty state */}
              {filteredTopicContent.length === 0 && (
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
              {contentFilter !== 'pdf' && batch.videos.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                    <Play className="w-5 h-5 text-primary" /> Videos
                  </h2>
                  <div className="grid gap-3">
                    {batch.videos.map((video, i) => {
                      const progress = progressData?.find(
                        p => p.content_type === 'video' && p.content_index === i
                      );
                      const percent = progress?.progress_percent || 0;
                      const completed = progress?.completed || false;
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
              {contentFilter !== 'video' && batch.pdfs.length > 0 && (
                <section>
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-accent" /> PDFs
                  </h2>
                  <div className="grid gap-3">
                    {batch.pdfs.map((pdf, i) => {
                      const progress = progressData?.find(
                        p => p.content_type === 'pdf' && p.content_index === i
                      );
                      const completed = progress?.completed || false;
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
              {((contentFilter === 'all' && batch.videos.length === 0 && batch.pdfs.length === 0) ||
                (contentFilter === 'video' && batch.videos.length === 0) ||
                (contentFilter === 'pdf' && batch.pdfs.length === 0)) && (
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
