import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, FileText, Clock, Layers, Rocket, Heart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Batch } from '@/hooks/useBatches';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import { useBatchLive } from '@/hooks/useLiveClasses';
import type { BatchProgress } from '@/hooks/useBatchProgress';
import defaultThumbnail from '@/assets/default-batch-thumbnail.jpg';
import confetti from 'canvas-confetti';
import { useState, useRef, useCallback } from 'react';

interface BatchCardProps {
  batch: Batch;
  index: number;
  progress?: BatchProgress;
  compact?: boolean;
}

export function BatchCard({ batch, index, progress, compact = false }: BatchCardProps) {
  const totalVideos = batch.videos.length;
  const totalPdfs = batch.pdfs.length;
  const totalContent = totalVideos + totalPdfs;
  
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [showHearts, setShowHearts] = useState(false);
  
  const isFavorite = favorites?.some(f => f.batch_id === batch.id) ?? false;
  const progressPercent = progress?.progressPercent ?? 0;
  const isComplete = progressPercent === 100;
  const live = useBatchLive(batch.id);

  const triggerConfetti = useCallback(() => {
    if (!buttonRef.current) return;
    
    const rect = buttonRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    // Heart-shaped confetti burst
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors: ['#ff6b6b', '#ee5a5a', '#ff8787', '#ffa8a8', '#ff4757'],
      shapes: ['circle'],
      scalar: 0.8,
      gravity: 0.8,
      ticks: 60,
    });

    // Show floating hearts
    setShowHearts(true);
    setTimeout(() => setShowHearts(false), 1000);
  }, []);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only trigger confetti when adding to favorites
    if (!isFavorite) {
      triggerConfetti();
    }
    
    toggleFavorite.mutate({ batchId: batch.id, isFavorite });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: compact ? 10 : 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.08, 
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }}
      className={`glass-card overflow-hidden flex ${compact ? 'flex-row items-center gap-4 p-3' : 'flex-col'}`}
    >
      {/* Thumbnail */}
      <div className={`relative overflow-hidden ${compact ? 'w-16 h-16 rounded-lg flex-shrink-0' : 'aspect-video'}`}>
        <img
          src={batch.thumbnail || defaultThumbnail}
          alt={batch.name || 'Course thumbnail'}
          className="w-full h-full object-cover"
        />

        {/* Live badge */}
        {live && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
            </span>
            Live
          </div>
        )}
        

        
        {!compact && (
          <>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-80" />

            {/* Favorite button */}
            <motion.button
              ref={buttonRef}
              onClick={handleFavoriteClick}
              className="absolute top-3 left-3 p-2 rounded-xl bg-background/80 backdrop-blur-md border border-white/10 hover:bg-background/90 transition-colors overflow-visible"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={toggleFavorite.isPending}
            >
              <AnimatePresence>
                {showHearts && (
                  <>
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ 
                          opacity: 1, 
                          scale: 0.5, 
                          x: 0, 
                          y: 0 
                        }}
                        animate={{ 
                          opacity: 0, 
                          scale: 1.2, 
                          x: (Math.random() - 0.5) * 60,
                          y: -40 - Math.random() * 30
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
                      >
                        <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                      </motion.div>
                    ))}
                  </>
                )}
              </AnimatePresence>
              <motion.div
                animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <Heart 
                  className={`w-4 h-4 transition-all duration-300 ${
                    isFavorite 
                      ? 'fill-red-500 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                      : 'text-muted-foreground hover:text-red-400'
                  }`} 
                />
              </motion.div>
            </motion.button>

            {/* Content count badge */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/80 backdrop-blur-md text-xs font-medium border border-white/10">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>{totalContent} items</span>
            </div>

            {/* Completion badge */}
            {isComplete && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/90 backdrop-blur-md text-xs font-medium text-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completed</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Compact mode content */}
      {compact ? (
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{batch.name || 'Untitled Course'}</h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>{totalVideos} videos</span>
            <span>•</span>
            <span>{progressPercent}% complete</span>
          </div>
        </div>
      ) : (
        <>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <h3 className="font-display font-semibold text-lg mb-3 line-clamp-2">
          {batch.name || 'Untitled Course'}
        </h3>
        
        {/* Progress bar */}
        {progressPercent > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Progress</span>
              <span className={`font-medium ${isComplete ? 'text-green-500' : 'text-primary'}`}>
                {progressPercent}%
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className={`h-2 ${isComplete ? '[&>div]:bg-green-500' : ''}`}
            />
            <div className="flex items-center justify-between text-xs mt-1 text-muted-foreground/70">
              <span>{progress?.completedItems || 0} / {progress?.totalItems || totalContent} completed</span>
            </div>
          </div>
        )}
        
        {/* Meta info */}
        <div className="flex items-center flex-wrap gap-2.5 text-sm mb-4">
          {totalVideos > 0 && (
            <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
              <Play className="w-3.5 h-3.5 text-primary" />
              <span className="text-foreground/80 font-medium">{totalVideos}</span>
            </div>
          )}
          {totalPdfs > 0 && (
            <div className="flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20">
              <FileText className="w-3.5 h-3.5 text-accent" />
              <span className="text-foreground/80 font-medium">{totalPdfs}</span>
            </div>
          )}
          {batch.updated_at && (
            <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground/70">
              <Clock className="w-3 h-3" />
              <span>{new Date(batch.updated_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Launch Session Button */}
        <div className="mt-auto pt-2">
          <Link to={`/batch/${batch.id}`} className="block">
            <Button 
              className="w-full group gap-2 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300"
              size="lg"
            >
              <Rocket className="w-4 h-4 group-hover:animate-pulse" />
              {progressPercent > 0 && progressPercent < 100 ? 'Continue' : 'Launch Session'}
            </Button>
          </Link>
        </div>
      </div>

        {/* Bottom gradient line */}
        <div className={`h-1 w-full ${isComplete ? 'bg-green-500' : 'bg-gradient-to-r from-primary via-accent to-primary'}`} />
      </>
      )}
    </motion.div>
  );
}
