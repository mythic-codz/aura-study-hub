import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText } from 'lucide-react';
import type { VideoItem, PdfItem } from '@/hooks/useBatches';
import { Skeleton } from '@/components/ui/skeleton';

interface ContentCardProps {
  type: 'video' | 'pdf';
  item: VideoItem | PdfItem;
  batchId: string;
  batchName: string;
  index: number;
  listIndex: number;
}

export function ContentCard({ type, item, batchId, batchName, index, listIndex }: ContentCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const Icon = type === 'video' ? Play : FileText;
  const href = `/play/${batchId}/${type}/${index}`;
  
  // Get thumbnail from video item if available
  const thumbnail = type === 'video' && 'thumbnail' in item ? (item as VideoItem).thumbnail : null;
  const showThumbnail = type === 'video' && thumbnail && !imageError;

  return (
    <Link to={href}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: listIndex * 0.05, duration: 0.3 }}
        whileHover={{ x: 5 }}
        className="flex items-center gap-4 p-3 glass-card-hover cursor-pointer group"
      >
        {/* Thumbnail or Icon */}
        <div className="relative w-20 h-12 sm:w-24 sm:h-14 rounded-lg overflow-hidden flex-shrink-0">
          {showThumbnail ? (
            <>
              {!imageLoaded && (
                <Skeleton className="absolute inset-0 w-full h-full" />
              )}
              <img
                src={thumbnail}
                alt={item.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
              {/* Play overlay on thumbnail */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="w-5 h-5 text-white fill-white" />
              </div>
            </>
          ) : (
            <div className={`
              w-full h-full flex items-center justify-center
              ${type === 'video' 
                ? 'bg-gradient-to-br from-primary to-accent' 
                : 'bg-gradient-to-br from-accent to-primary'
              }
            `}>
              <Icon className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {batchName}
          </p>
        </div>

        <span className="text-xs px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground uppercase hidden sm:block">
          {type}
        </span>
      </motion.div>
    </Link>
  );
}
