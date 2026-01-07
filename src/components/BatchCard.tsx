import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText, Clock } from 'lucide-react';
import type { Batch } from '@/hooks/useBatches';

interface BatchCardProps {
  batch: Batch;
  index: number;
}

export function BatchCard({ batch, index }: BatchCardProps) {
  const totalVideos = batch.videos.length;
  const totalPdfs = batch.pdfs.length;

  return (
    <Link to={`/batch/${batch.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="glass-card-hover overflow-hidden group cursor-pointer"
      >
        <div className="relative aspect-video overflow-hidden">
          {batch.thumbnail ? (
            <img
              src={batch.thumbnail}
              alt={batch.name || 'Batch thumbnail'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Play className="w-12 h-12 text-primary/50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          
          {/* Play overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm"
          >
            <motion.div
              whileHover={{ scale: 1.1 }}
              className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center glow-effect"
            >
              <Play className="w-8 h-8 text-primary-foreground ml-1" />
            </motion.div>
          </motion.div>
        </div>

        <div className="p-4">
          <h3 className="font-display font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {batch.name || 'Untitled Batch'}
          </h3>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {totalVideos > 0 && (
              <div className="flex items-center gap-1">
                <Play className="w-4 h-4" />
                <span>{totalVideos} video{totalVideos !== 1 ? 's' : ''}</span>
              </div>
            )}
            {totalPdfs > 0 && (
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{totalPdfs} PDF{totalPdfs !== 1 ? 's' : ''}</span>
              </div>
            )}
            {batch.updated_at && (
              <div className="flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                <span className="text-xs">
                  {new Date(batch.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
