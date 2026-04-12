import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useStreak } from '@/hooks/useStreak';

export function StreakBadge() {
  const { currentStreak } = useStreak();

  if (currentStreak <= 0) return null;

  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/25 cursor-pointer"
      title={`${currentStreak} day streak! XP multiplier: ${Math.min(1 + currentStreak * 0.1, 2).toFixed(1)}x`}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <Flame className="w-4 h-4 text-orange-400" />
      </motion.div>
      <span className="text-sm font-bold text-orange-400">{currentStreak}</span>
    </motion.div>
  );
}
