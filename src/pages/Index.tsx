import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, X, Waves, Zap, Target, Heart } from 'lucide-react';
import { Header } from '@/components/Header';
import { OnboardingModal } from '@/components/OnboardingModal';
import { BatchCard } from '@/components/BatchCard';
import { LiveBanner } from '@/components/LiveBanner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SkeletonCard } from '@/components/SkeletonCard';
import { useUser } from '@/hooks/useUser';
import { useBatches } from '@/hooks/useBatches';
import { useFavorites } from '@/hooks/useFavorites';
import { useBatchProgress } from '@/hooks/useBatchProgress';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const }
  },
};

type ViewFilter = 'all' | 'favorites';

const Index = () => {
  const { user, loading: userLoading, needsOnboarding, createUser } = useUser();
  const { data: batches, isLoading: batchesLoading } = useBatches();
  const { data: favorites } = useFavorites();
  const { data: batchProgressMap } = useBatchProgress(batches);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');

  // Filter batches based on search query and view filter
  const filteredBatches = useMemo(() => {
    if (!batches) return [];
    
    let filtered = batches;
    
    // Apply favorites filter
    if (viewFilter === 'favorites' && favorites) {
      const favoriteIds = new Set(favorites.map(f => f.batch_id));
      filtered = filtered.filter(batch => favoriteIds.has(batch.id));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(batch => {
        if (batch.name?.toLowerCase().includes(query)) return true;
        if (batch.videos.some(v => v.title.toLowerCase().includes(query))) return true;
        if (batch.pdfs.some(p => p.title.toLowerCase().includes(query))) return true;
        return false;
      });
    }
    
    return filtered;
  }, [batches, searchQuery, viewFilter, favorites]);

  const favoriteCount = favorites?.length || 0;

  if (userLoading) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <LoadingSpinner size="lg" message="Diving into Study Ocean..." />
      </div>
    );
  }

  if (needsOnboarding) {
    return <OnboardingModal onComplete={createUser} />;
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-16">
        <LiveBanner />

        {/* Hero Section */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-16"
        >
          {/* Welcome Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card mb-8 shimmer"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Waves className="w-4 h-4 text-primary" />
            </motion.div>
            <span className="text-sm font-medium text-foreground/80">Welcome to Study Ocean</span>
          </motion.div>
          
          {/* Main Heading */}
          <motion.h1 
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4"
          >
            <span className="text-foreground">Ahoy, </span>
            <motion.span 
              className="text-gradient inline-block"
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              {user?.name || 'Explorer'}!
            </motion.span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10"
          >
            Dive deep into knowledge. Watch videos, explore PDFs, and earn XP as you navigate through your learning journey.
          </motion.p>

          {/* Stats Cards */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
          >
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="stat-card"
            >
              <motion.div 
                className="stat-icon bg-gradient-to-br from-primary/20 to-primary/5"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Zap className="w-6 h-6 text-primary" />
              </motion.div>
              <div className="text-left">
                <motion.p 
                  className="text-2xl sm:text-3xl font-bold text-foreground"
                  key={user?.xp}
                  initial={{ scale: 1.2, color: 'hsl(var(--primary))' }}
                  animate={{ scale: 1, color: 'hsl(var(--foreground))' }}
                  transition={{ duration: 0.3 }}
                >
                  {user?.xp || 0}
                </motion.p>
                <p className="text-xs text-muted-foreground font-medium">Total XP</p>
              </div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="stat-card"
            >
              <motion.div 
                className="stat-icon bg-gradient-to-br from-accent/20 to-accent/5"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <BookOpen className="w-6 h-6 text-accent" />
              </motion.div>
              <div className="text-left">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{batches?.length || 0}</p>
                <p className="text-xs text-muted-foreground font-medium">Courses</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="stat-card"
            >
              <motion.div 
                className="stat-icon bg-gradient-to-br from-orange-500/20 to-orange-500/5"
                whileHover={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Target className="w-6 h-6 text-orange-400" />
              </motion.div>
              <div className="text-left">
                <p className="text-2xl sm:text-3xl font-bold text-foreground">{favorites?.length || 0}</p>
                <p className="text-xs text-muted-foreground font-medium">Favorites</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* Continue section removed */}

        {/* All Batches Section with Search and Favorites Filter */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-1.5 h-8 bg-gradient-to-b from-accent to-primary rounded-full"
                animate={{ scaleY: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
              <BookOpen className="w-5 h-5 text-accent" />
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">Courses</h2>
            </div>

            {/* Search and Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              {/* Tabs for All/Favorites */}
              <Tabs value={viewFilter} onValueChange={(v) => setViewFilter(v as ViewFilter)}>
                <TabsList className="glass-card border-0 p-1">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary gap-2"
                  >
                    <BookOpen className="w-4 h-4" />
                    All
                    <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                      {batches?.length || 0}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="favorites" 
                    className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 gap-2"
                  >
                    <Heart className="w-4 h-4" />
                    Favorites
                    <span className="text-xs bg-white/10 px-1.5 py-0.5 rounded">
                      {favoriteCount}
                    </span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Search Bar */}
              <motion.div 
                className="relative max-w-sm w-full group"
                whileFocus={{ scale: 1.02 }}
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-300" />
                <Input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-10 h-11 glass-card border-white/10 focus:border-primary/50 rounded-xl placeholder:text-muted-foreground/50"
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </motion.button>
                )}
              </motion.div>
            </div>
          </div>

          {batchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} variant="batch" index={i} />
              ))}
            </div>
          ) : filteredBatches.length > 0 ? (
            <>
              {searchQuery && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-muted-foreground mb-4"
                >
                  Found <span className="text-primary font-medium">{filteredBatches.length}</span> course{filteredBatches.length !== 1 ? 's' : ''} matching "{searchQuery}"
                </motion.p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBatches.map((batch, index) => (
                  <BatchCard 
                    key={batch.id} 
                    batch={batch} 
                    index={index} 
                    progress={batchProgressMap?.[batch.id]}
                  />
                ))}
              </div>
            </>
          ) : viewFilter === 'favorites' ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 rounded-2xl text-center"
            >
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Favorites Yet</h3>
              <p className="text-muted-foreground">
                Click the heart icon on any course to add it to your favorites.
              </p>
            </motion.div>
          ) : searchQuery ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 rounded-2xl text-center"
            >
              <Search className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Results Found</h3>
              <p className="text-muted-foreground">
                No courses match "<span className="text-primary">{searchQuery}</span>". Try a different search term.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 rounded-2xl text-center"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Waves className="w-16 h-16 text-primary/30 mx-auto mb-4" />
              </motion.div>
              <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Courses Yet</h3>
              <p className="text-muted-foreground">Courses will appear here once added</p>
            </motion.div>
          )}
        </motion.section>
      </main>
    </div>
  );
};

export default Index;
