import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText, Clock, Layers, Rocket, Heart, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Batch } from '@/hooks/useBatches';
import { useFavorites, useToggleFavorite } from '@/hooks/useFavorites';
import type { BatchProgress } from '@/hooks/useBatchProgress';
import defaultThumbnail from '@/assets/default-batch-thumbnail.jpg';

interface BatchCardProps {
  batch: Batch;
  index: number;
  progress?: BatchProgress;
}

export function BatchCard({ batch, index, progress }: BatchCardProps) {
  const totalVideos = batch.videos.length;
  const totalPdfs = batch.pdfs.length;
  const totalContent = totalVideos + totalPdfs;
  
  const { data: favorites } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  
  const isFavorite = favorites?.some(f => f.batch_id === batch.id) ?? false;
  const progressPercent = progress?.progressPercent ?? 0;
  const isComplete = progressPercent === 100;

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite.mutate({ batchId: batch.id, isFavorite });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.08, 
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="glass-card overflow-hidden flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={batch.thumbnail || defaultThumbnail}
          alt={batch.name || 'Course thumbnail'}
          className="w-full h-full object-cover"
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-80" />

        {/* Favorite button */}
        <motion.button
          onClick={handleFavoriteClick}
          className="absolute top-3 left-3 p-2 rounded-xl bg-background/80 backdrop-blur-md border border-white/10 hover:bg-background/90 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          disabled={toggleFavorite.isPending}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isFavorite 
                ? 'fill-red-500 text-red-500' 
                : 'text-muted-foreground hover:text-red-400'
            }`} 
          />
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
      </div>

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
    </motion.div>
  );
}
