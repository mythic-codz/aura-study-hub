import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, TrendingUp, Search, Clock, X, Waves, Zap, Target } from 'lucide-react';
import { Header } from '@/components/Header';
import { OnboardingModal } from '@/components/OnboardingModal';
import { BatchCard } from '@/components/BatchCard';
import { ContinueCard } from '@/components/ContinueCard';
import { useUser } from '@/hooks/useUser';
import { useBatches } from '@/hooks/useBatches';
import { useIncompleteProgress } from '@/hooks/useIncompleteProgress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import logo from '@/assets/logo.png';

const Index = () => {
  const { user, loading: userLoading, needsOnboarding, createUser } = useUser();
  const { data: batches, isLoading: batchesLoading } = useBatches();
  const { data: incompleteItems, isLoading: incompleteLoading } = useIncompleteProgress();
  
  const [searchQuery, setSearchQuery] = useState('');

  // Filter batches based on search query
  const filteredBatches = useMemo(() => {
    if (!batches) return [];
    if (!searchQuery.trim()) return batches;
    
    const query = searchQuery.toLowerCase();
    return batches.filter(batch => {
      if (batch.name?.toLowerCase().includes(query)) return true;
      if (batch.videos.some(v => v.title.toLowerCase().includes(query))) return true;
      if (batch.pdfs.some(p => p.title.toLowerCase().includes(query))) return true;
      return false;
    });
  }, [batches, searchQuery]);

  // Get latest 6 batches for "Latest Added" section
  const latestBatches = useMemo(() => {
    if (!batches) return [];
    return batches.slice(0, 6);
  }, [batches]);

  if (userLoading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 rounded-2xl flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-primary/30"
          >
            <img src={logo} alt="Study Ocean" className="w-full h-full object-cover" />
          </motion.div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-foreground/80 font-medium">Diving into Study Ocean...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingModal onComplete={async (name) => { await createUser(name); }} />;
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Welcome Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 shimmer"
          >
            <Waves className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">Welcome to Study Ocean</span>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
          >
            <span className="text-foreground">Ahoy, </span>
            <span className="text-gradient">{user?.name || 'Explorer'}!</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Dive deep into knowledge. Watch videos, explore PDFs, and earn XP as you navigate through your learning journey.
          </motion.p>

          {/* Stats Cards */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="stat-card"
            >
              <div className="stat-icon bg-gradient-to-br from-primary/20 to-primary/5">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{user?.xp || 0}</p>
                <p className="text-xs text-muted-foreground font-medium">Total XP</p>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="stat-card"
            >
              <div className="stat-icon bg-gradient-to-br from-accent/20 to-accent/5">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{batches?.length || 0}</p>
                <p className="text-xs text-muted-foreground font-medium">Courses</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="stat-card"
            >
              <div className="stat-icon bg-gradient-to-br from-orange-500/20 to-orange-500/5">
                <Target className="w-6 h-6 text-orange-400" />
              </div>
              <div className="text-left">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{incompleteItems?.length || 0}</p>
                <p className="text-xs text-muted-foreground font-medium">In Progress</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Continue Where You Left Off Section */}
        {!incompleteLoading && incompleteItems && incompleteItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-8 bg-gradient-to-b from-orange-400 to-amber-500 rounded-full" />
              <Clock className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Continue Learning</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incompleteItems.slice(0, 6).map((item, index) => (
                <ContinueCard
                  key={`${item.batchId}-${item.type}-${item.index}`}
                  item={item}
                  index={index}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Latest Added Batches Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-8 bg-gradient-to-b from-primary to-accent rounded-full" />
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Latest Courses</h2>
          </div>

          {batchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-2xl" />
              ))}
            </div>
          ) : latestBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestBatches.map((batch, index) => (
                <BatchCard key={batch.id} batch={batch} index={index} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Waves className="w-16 h-16 text-primary/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground/80 mb-2">Ocean is Calm</h3>
              <p className="text-muted-foreground">No courses available yet. Check back soon!</p>
            </div>
          )}
        </motion.section>

        {/* All Batches Section with Search */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-gradient-to-b from-accent to-primary rounded-full" />
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">All Courses</h2>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-10 h-11 glass-card border-white/10 focus:border-primary/50 rounded-xl placeholder:text-muted-foreground/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {batchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-2xl" />
              ))}
            </div>
          ) : filteredBatches.length > 0 ? (
            <>
              {searchQuery && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground mb-4"
                >
                  Found <span className="text-primary font-medium">{filteredBatches.length}</span> course{filteredBatches.length !== 1 ? 's' : ''} matching "{searchQuery}"
                </motion.p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches.map((batch, index) => (
                  <BatchCard key={batch.id} batch={batch} index={index} />
                ))}
              </div>
            </>
          ) : searchQuery ? (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                No courses match "<span className="text-primary">{searchQuery}</span>". Try a different search term.
              </p>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-2xl text-center">
              <Waves className="w-16 h-16 text-primary/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground">Courses will appear here once added</p>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default Index;
