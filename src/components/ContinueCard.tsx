import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { IncompleteItem } from '@/hooks/useIncompleteProgress';

interface ContinueCardProps {
  item: IncompleteItem;
  index: number;
}

export function ContinueCard({ item, index }: ContinueCardProps) {
  const Icon = item.type === 'video' ? Play : FileText;
  const isVideo = item.type === 'video';

  return (
    <Link to={`/play/${item.batchId}/${item.type}/${item.index}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.08, duration: 0.4 }}
        whileHover={{ x: 4 }}
        className="glass-card-hover p-4 flex items-center gap-4 group cursor-pointer"
      >
        {/* Icon container */}
        <div className={`
          relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 
          flex items-center justify-center transition-all duration-300
          ${isVideo ? 'bg-gradient-to-br from-primary/20 to-primary/5' : 'bg-gradient-to-br from-accent/20 to-accent/5'}
        `}>
          <Icon className={`w-6 h-6 ${isVideo ? 'text-primary' : 'text-accent'}`} />
          
          {/* Hover overlay */}
          <motion.div
            className={`
              absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300
              ${isVideo ? 'bg-primary/30' : 'bg-accent/30'}
            `}
          >
            <ArrowRight className="w-5 h-5 text-foreground" />
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300 mb-1">
            {item.item.title}
          </h4>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{item.batchName}</p>
          
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress 
              value={item.progressPercent} 
              className="h-1.5 flex-1 bg-muted/50" 
            />
            <span className={`text-xs font-semibold ${isVideo ? 'text-primary' : 'text-accent'}`}>
              {Math.round(item.progressPercent)}%
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
