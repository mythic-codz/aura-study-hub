import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText, Clock, Layers } from 'lucide-react';
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
    <Link to={`/batch/${batch.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.5 }}
        whileHover={{ y: -6 }}
        className="glass-card-hover overflow-hidden group cursor-pointer"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={batch.thumbnail || defaultThumbnail}
            alt={batch.name || 'Course thumbnail'}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-80" />
          
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <motion.div
              initial={{ scale: 0.8 }}
              whileHover={{ scale: 1 }}
              className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur-sm flex items-center justify-center glow-effect"
            >
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </motion.div>
          </div>

          {/* Content count badge */}
          <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/70 backdrop-blur-sm text-xs font-medium">
            <Layers className="w-3 h-3 text-primary" />
            <span>{totalContent} items</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="font-display font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {batch.name || 'Untitled Course'}
          </h3>
          
          {/* Meta info */}
          <div className="flex items-center flex-wrap gap-3 text-sm text-muted-foreground">
            {totalVideos > 0 && (
              <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-lg">
                <Play className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground/80">{totalVideos}</span>
              </div>
            )}
            {totalPdfs > 0 && (
              <div className="flex items-center gap-1.5 bg-accent/10 px-2 py-1 rounded-lg">
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span className="text-foreground/80">{totalPdfs}</span>
              </div>
            )}
            {batch.updated_at && (
              <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground/70">
                <Clock className="w-3 h-3" />
                <span>{new Date(batch.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom gradient line */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.div>
    </Link>
  );
}
