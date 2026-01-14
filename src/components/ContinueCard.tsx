import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText, ArrowRight, Clock } from 'lucide-react';
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
        transition={{ 
          delay: index * 0.08, 
          duration: 0.4,
          ease: [0.22, 1, 0.36, 1]
        }}
        whileHover={{ x: 6, transition: { duration: 0.2 } }}
        className="glass-card-hover p-4 flex items-center gap-4 group cursor-pointer"
      >
        {/* Icon container */}
        <motion.div 
          className={`
            relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 
            flex items-center justify-center transition-all duration-300
            ${isVideo ? 'bg-gradient-to-br from-primary/25 to-primary/10' : 'bg-gradient-to-br from-accent/25 to-accent/10'}
          `}
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
          <motion.div
            initial={{ scale: 1 }}
            whileHover={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className={`w-6 h-6 ${isVideo ? 'text-primary' : 'text-accent'}`} />
          </motion.div>
          
          {/* Hover overlay */}
          <motion.div
            className={`
              absolute inset-0 flex items-center justify-center 
              ${isVideo ? 'bg-primary/40' : 'bg-accent/40'}
            `}
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <ArrowRight className="w-5 h-5 text-foreground" />
          </motion.div>

          {/* Subtle pulse ring */}
          <motion.div
            className={`absolute inset-0 rounded-xl ${isVideo ? 'bg-primary/20' : 'bg-accent/20'}`}
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          />
        </motion.div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-300 mb-1">
            {item.item.title}
          </h4>
          <p className="text-xs text-muted-foreground mb-2.5 line-clamp-1 flex items-center gap-1.5">
            <Clock className="w-3 h-3" />
            {item.batchName}
          </p>
          
          {/* Progress bar */}
          <div className="flex items-center gap-3">
            <Progress 
              value={item.progressPercent} 
              className="h-1.5 flex-1" 
            />
            <motion.span 
              className={`text-xs font-bold ${isVideo ? 'text-primary' : 'text-accent'}`}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {Math.round(item.progressPercent)}%
            </motion.span>
          </div>
        </div>

        {/* Continue indicator */}
        <motion.div
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          whileHover={{ scale: 1.1 }}
        >
          <ArrowRight className="w-4 h-4 text-primary" />
        </motion.div>
      </motion.div>
    </Link>
  );
}
