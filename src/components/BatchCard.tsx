import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText, Clock, Layers, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Batch } from '@/hooks/useBatches';
import defaultThumbnail from '@/assets/default-batch-thumbnail.jpg';

interface BatchCardProps {
  batch: Batch;
  index: number;
}

export function BatchCard({ batch, index }: BatchCardProps) {
  const totalVideos = batch.videos.length;
  const totalPdfs = batch.pdfs.length;
  const totalContent = totalVideos + totalPdfs;

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

        {/* Content count badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/80 backdrop-blur-md text-xs font-medium border border-white/10">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span>{totalContent} items</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <h3 className="font-display font-semibold text-lg mb-3 line-clamp-2">
          {batch.name || 'Untitled Course'}
        </h3>
        
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
              Launch Session
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary" />
    </motion.div>
  );
}
