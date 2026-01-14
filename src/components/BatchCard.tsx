import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText, Clock, Layers, ArrowUpRight } from 'lucide-react';
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
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          delay: index * 0.08, 
          duration: 0.5,
          ease: [0.22, 1, 0.36, 1]
        }}
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="glass-card-hover overflow-hidden group cursor-pointer"
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <motion.img
            src={batch.thumbnail || defaultThumbnail}
            alt={batch.name || 'Course thumbnail'}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent opacity-80 group-hover:opacity-70 transition-opacity duration-300" />
          
          {/* Play button overlay */}
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
          >
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              whileHover={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="w-16 h-16 rounded-2xl bg-primary/90 backdrop-blur-sm flex items-center justify-center shadow-2xl shadow-primary/30"
            >
              <Play className="w-7 h-7 text-primary-foreground ml-1" fill="currentColor" />
            </motion.div>
          </motion.div>

          {/* Content count badge */}
          <motion.div 
            className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background/80 backdrop-blur-md text-xs font-medium border border-white/10"
            whileHover={{ scale: 1.05 }}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>{totalContent} items</span>
          </motion.div>

          {/* Hover arrow indicator */}
          <motion.div
            className="absolute bottom-3 right-3 w-8 h-8 rounded-lg bg-primary/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
            initial={{ x: -10, opacity: 0 }}
            whileHover={{ x: 0, opacity: 1 }}
          >
            <ArrowUpRight className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="font-display font-semibold text-lg mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
            {batch.name || 'Untitled Course'}
          </h3>
          
          {/* Meta info */}
          <div className="flex items-center flex-wrap gap-2.5 text-sm">
            {totalVideos > 0 && (
              <motion.div 
                className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20"
                whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--primary) / 0.15)' }}
              >
                <Play className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground/80 font-medium">{totalVideos}</span>
              </motion.div>
            )}
            {totalPdfs > 0 && (
              <motion.div 
                className="flex items-center gap-1.5 bg-accent/10 px-2.5 py-1 rounded-lg border border-accent/20"
                whileHover={{ scale: 1.05, backgroundColor: 'hsl(var(--accent) / 0.15)' }}
              >
                <FileText className="w-3.5 h-3.5 text-accent" />
                <span className="text-foreground/80 font-medium">{totalPdfs}</span>
              </motion.div>
            )}
            {batch.updated_at && (
              <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground/70">
                <Clock className="w-3 h-3" />
                <span>{new Date(batch.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom gradient line with animation */}
        <motion.div 
          className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary"
          initial={{ scaleX: 0, opacity: 0 }}
          whileHover={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{ originX: 0 }}
        />
      </motion.div>
    </Link>
  );
}
