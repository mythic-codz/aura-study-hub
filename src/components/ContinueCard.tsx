import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { IncompleteItem } from '@/hooks/useIncompleteProgress';

interface ContinueCardProps {
  item: IncompleteItem;
  index: number;
}

export function ContinueCard({ item, index }: ContinueCardProps) {
  const Icon = item.type === 'video' ? Play : FileText;

  return (
    <Link to={`/play/${item.batchId}/${item.type}/${item.index}`}>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.1, duration: 0.4 }}
        whileHover={{ scale: 1.02, x: 5 }}
        className="glass-card-hover p-4 flex items-center gap-4 group cursor-pointer"
      >
        <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-primary/10 flex items-center justify-center">
          <Icon className="w-6 h-6 text-primary" />
          <motion.div
            className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Play className="w-5 h-5 text-primary-foreground" />
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {item.item.title}
          </h4>
          <p className="text-xs text-muted-foreground mb-2">{item.batchName}</p>
          <div className="flex items-center gap-2">
            <Progress value={item.progressPercent} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground font-medium">
              {Math.round(item.progressPercent)}%
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
