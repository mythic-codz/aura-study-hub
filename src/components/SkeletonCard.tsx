import { motion } from 'framer-motion';

interface SkeletonCardProps {
  variant?: 'batch' | 'continue' | 'stat' | 'list';
  index?: number;
}

export function SkeletonCard({ variant = 'batch', index = 0 }: SkeletonCardProps) {
  const shimmerClass = "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent";

  if (variant === 'batch') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="glass-card overflow-hidden"
      >
        <div className={`aspect-video bg-muted/30 ${shimmerClass}`} />
        <div className="p-5 space-y-3">
          <div className={`h-5 bg-muted/30 rounded-lg w-3/4 ${shimmerClass}`} />
          <div className="flex gap-2">
            <div className={`h-6 bg-muted/20 rounded-lg w-16 ${shimmerClass}`} />
            <div className={`h-6 bg-muted/20 rounded-lg w-16 ${shimmerClass}`} />
          </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'continue') {
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="glass-card p-4 flex items-center gap-4"
      >
        <div className={`w-14 h-14 rounded-xl bg-muted/30 flex-shrink-0 ${shimmerClass}`} />
        <div className="flex-1 space-y-2">
          <div className={`h-4 bg-muted/30 rounded-lg w-3/4 ${shimmerClass}`} />
          <div className={`h-3 bg-muted/20 rounded-lg w-1/2 ${shimmerClass}`} />
          <div className={`h-1.5 bg-muted/30 rounded-full w-full ${shimmerClass}`} />
        </div>
      </motion.div>
    );
  }

  if (variant === 'stat') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="glass-card p-4 flex items-center gap-4"
      >
        <div className={`w-12 h-12 rounded-xl bg-muted/30 ${shimmerClass}`} />
        <div className="space-y-2">
          <div className={`h-6 bg-muted/30 rounded-lg w-16 ${shimmerClass}`} />
          <div className={`h-3 bg-muted/20 rounded-lg w-12 ${shimmerClass}`} />
        </div>
      </motion.div>
    );
  }

  // List variant
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-4 flex items-center gap-4"
    >
      <div className={`w-10 h-10 rounded-xl bg-muted/30 ${shimmerClass}`} />
      <div className={`w-12 h-12 rounded-full bg-muted/30 ${shimmerClass}`} />
      <div className="flex-1 space-y-2">
        <div className={`h-4 bg-muted/30 rounded-lg w-1/2 ${shimmerClass}`} />
        <div className={`h-3 bg-muted/20 rounded-lg w-1/4 ${shimmerClass}`} />
      </div>
      <div className={`h-8 bg-muted/30 rounded-lg w-16 ${shimmerClass}`} />
    </motion.div>
  );
}
