import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText } from 'lucide-react';
import type { VideoItem, PdfItem } from '@/hooks/useBatches';

interface ContentCardProps {
  type: 'video' | 'pdf';
  item: VideoItem | PdfItem;
  batchId: string;
  batchName: string;
  index: number;
  listIndex: number;
}

export function ContentCard({ type, item, batchId, batchName, index, listIndex }: ContentCardProps) {
  const Icon = type === 'video' ? Play : FileText;
  const href = `/play/${batchId}/${type}/${index}`;

  return (
    <Link to={href}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: listIndex * 0.05, duration: 0.3 }}
        whileHover={{ x: 5 }}
        className="flex items-center gap-4 p-4 glass-card-hover cursor-pointer group"
      >
        <div className={`
          w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
          ${type === 'video' 
            ? 'bg-gradient-to-br from-primary to-accent' 
            : 'bg-gradient-to-br from-accent to-primary'
          }
        `}>
          <Icon className="w-5 h-5 text-primary-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {batchName}
          </p>
        </div>

        <span className="text-xs px-2 py-1 rounded-full bg-secondary/50 text-muted-foreground uppercase">
          {type}
        </span>
      </motion.div>
    </Link>
  );
}
