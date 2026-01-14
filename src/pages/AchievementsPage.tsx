import { motion } from 'framer-motion';
import { Trophy, RefreshCw, Sparkles, Award } from 'lucide-react';
import { Header } from '@/components/Header';
import { AchievementsGrid } from '@/components/AchievementsGrid';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { useCheckAchievements, useUserAchievements, useAchievements } from '@/hooks/useAchievements';
import { useUser } from '@/hooks/useUser';
import { useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  },
};

export default function AchievementsPage() {
  const { user, loading } = useUser();
  const { checkAndUnlock } = useCheckAchievements();
  const { data: userAchievements } = useUserAchievements();
  const { data: allAchievements } = useAchievements();
  const [checking, setChecking] = useState(false);

  const handleCheckAchievements = async () => {
    setChecking(true);
    await checkAndUnlock();
    setChecking(false);
  };

  const unlockedCount = userAchievements?.length || 0;
  const totalCount = allAchievements?.length || 0;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  if (loading || !user) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <LoadingSpinner size="lg" message="Loading achievements..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="glass-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30"
                >
                  <Trophy className="w-7 h-7 text-amber-900" />
                </motion.div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Achievements</h1>
                  <p className="text-sm text-muted-foreground">
                    Unlock badges by learning and exploring
                  </p>
                </div>
              </div>
              
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleCheckAchievements}
                  disabled={checking}
                  className="btn-ocean gap-2"
                >
                  <motion.div
                    animate={checking ? { rotate: 360 } : {}}
                    transition={{ duration: 1, repeat: checking ? Infinity : 0, ease: 'linear' }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                  Check Progress
                </Button>
              </motion.div>
            </div>

            {/* Progress bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-semibold text-foreground">
                  <span className="text-primary">{unlockedCount}</span> / {totalCount} unlocked
                </span>
              </div>
              <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full relative overflow-hidden"
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                  />
                </motion.div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {[
                { icon: Award, value: unlockedCount, label: 'Unlocked', color: 'primary' },
                { icon: Trophy, value: totalCount - unlockedCount, label: 'Remaining', color: 'muted' },
                { icon: Sparkles, value: `${Math.round(progressPercent)}%`, label: 'Complete', color: 'amber' },
              ].map((stat, i) => (
                <motion.div 
                  key={i}
                  className={`bg-${stat.color === 'amber' ? 'amber-500' : stat.color}/5 rounded-xl p-4 text-center`}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color === 'amber' ? 'text-amber-400' : stat.color === 'muted' ? 'text-muted-foreground' : 'text-primary'} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Achievements grid */}
          <motion.div variants={itemVariants}>
            <AchievementsGrid showAll />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
