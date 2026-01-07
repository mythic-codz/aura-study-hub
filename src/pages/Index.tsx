import { motion } from 'framer-motion';
import { BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { Header } from '@/components/Header';
import { OnboardingModal } from '@/components/OnboardingModal';
import { BatchCard } from '@/components/BatchCard';
import { ContentCard } from '@/components/ContentCard';
import { useUser } from '@/hooks/useUser';
import { useBatches, useLatestContent } from '@/hooks/useBatches';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const { user, loading: userLoading, needsOnboarding, createUser } = useUser();
  const { data: batches, isLoading: batchesLoading } = useBatches();
  const { data: latestContent, isLoading: contentLoading } = useLatestContent();

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

        {/* Latest Content Section */}
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

          {contentLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : latestContent && latestContent.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {latestContent.map((content, listIndex) => (
                <ContentCard
                  key={`${content.batchId}-${content.type}-${content.index}`}
                  type={content.type}
                  item={content.item}
                  batchId={content.batchId}
                  batchName={content.batchName}
                  index={content.index}
                  listIndex={listIndex}
                />
              ))}
            </div>
          ) : (
            <div className="glass-card p-8 rounded-xl text-center">
              <BookOpen className="w-12 h-12 text-foreground/30 mx-auto mb-3" />
              <p className="text-foreground/60">No content available yet</p>
            </div>
          )}
        </motion.section>

        {/* All Batches Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 bg-gradient-to-b from-accent to-primary rounded-full" />
            <h2 className="text-2xl font-bold text-foreground">All Batches</h2>
          </div>

          {batchesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : batches && batches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((batch, index) => (
                <BatchCard key={batch.id} batch={batch} index={index} />
              ))}
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
