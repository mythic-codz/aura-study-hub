import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, TrendingUp, Search, Clock, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { OnboardingModal } from '@/components/OnboardingModal';
import { BatchCard } from '@/components/BatchCard';
import { ContinueCard } from '@/components/ContinueCard';
import { useUser } from '@/hooks/useUser';
import { useBatches } from '@/hooks/useBatches';
import { useIncompleteProgress } from '@/hooks/useIncompleteProgress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';

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
      // Search in batch name
      if (batch.name?.toLowerCase().includes(query)) return true;
      // Search in video titles
      if (batch.videos.some(v => v.title.toLowerCase().includes(query))) return true;
      // Search in PDF titles
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
        <div className="glass-card p-8 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-foreground/80">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingModal onComplete={async (name) => { await createUser(name); }} />;
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground/80">Welcome to Aura Study</span>
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-gradient">Hello, {user?.name || 'Learner'}!</span>
          </h1>
          
          <p className="text-lg text-foreground/60 max-w-2xl mx-auto">
            Continue your learning journey. Watch videos, study PDFs, and earn XP as you progress.
          </p>

          <div className="flex items-center justify-center gap-6 mt-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="glass-card px-6 py-4 rounded-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground">{user?.xp || 0}</p>
                <p className="text-xs text-foreground/60">Total XP</p>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="glass-card px-6 py-4 rounded-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-foreground">{batches?.length || 0}</p>
                <p className="text-xs text-foreground/60">Batches</p>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Continue Where You Left Off Section */}
        {!incompleteLoading && incompleteItems && incompleteItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-12"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full" />
              <Clock className="w-5 h-5 text-yellow-500" />
              <h2 className="text-2xl font-bold text-foreground">Continue Where You Left Off</h2>
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
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-primary to-accent rounded-full" />
            <h2 className="text-2xl font-bold text-foreground">Latest Added</h2>
          </div>

          {batchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-xl" />
              ))}
            </div>
          ) : latestBatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestBatches.map((batch, index) => (
                <BatchCard key={batch.id} batch={batch} index={index} />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 rounded-xl text-center">
              <BookOpen className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
              <p className="text-foreground/60">No batches available yet</p>
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
              <div className="w-1 h-6 bg-gradient-to-b from-accent to-primary rounded-full" />
              <h2 className="text-2xl font-bold text-foreground">All Batches</h2>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search batches, videos, PDFs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 glass-card border-white/10 focus:border-primary/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {batchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-xl" />
              ))}
            </div>
          ) : filteredBatches.length > 0 ? (
            <>
              {searchQuery && (
                <p className="text-sm text-muted-foreground mb-4">
                  Found {filteredBatches.length} batch{filteredBatches.length !== 1 ? 'es' : ''} matching "{searchQuery}"
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches.map((batch, index) => (
                  <BatchCard key={batch.id} batch={batch} index={index} />
                ))}
              </div>
            </>
          ) : searchQuery ? (
            <div className="glass-card p-12 rounded-xl text-center">
              <Search className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Results Found</h3>
              <p className="text-foreground/60">
                No batches match "{searchQuery}". Try a different search term.
              </p>
            </div>
          ) : (
            <div className="glass-card p-12 rounded-xl text-center">
              <BookOpen className="w-16 h-16 text-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Batches Yet</h3>
              <p className="text-foreground/60">Content batches will appear here once added</p>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default Index;
