import { motion } from 'framer-motion';
import { Trophy, RefreshCw, Sparkles, Award } from 'lucide-react';
import { Header } from '@/components/Header';
import { AchievementsGrid } from '@/components/AchievementsGrid';
import { Button } from '@/components/ui/button';
import { useCheckAchievements, useUserAchievements, useAchievements } from '@/hooks/useAchievements';
import { useUser } from '@/hooks/useUser';
import { useState } from 'react';
import logo from '@/assets/logo.png';

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
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <img src={logo} alt="Loading" className="w-12 h-12 rounded-xl" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="glass-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg"
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
              
              <Button
                onClick={handleCheckAchievements}
                disabled={checking}
                className="btn-ocean gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                Check Progress
              </Button>
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
                  transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-primary/5 rounded-xl p-4 text-center">
                <Award className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{unlockedCount}</p>
                <p className="text-xs text-muted-foreground">Unlocked</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4 text-center">
                <Trophy className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{totalCount - unlockedCount}</p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
              <div className="bg-amber-500/5 rounded-xl p-4 text-center">
                <Sparkles className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-foreground">{Math.round(progressPercent)}%</p>
                <p className="text-xs text-muted-foreground">Complete</p>
              </div>
            </div>
          </div>

          {/* Achievements grid */}
          <AchievementsGrid showAll />
        </motion.div>
      </main>
    </div>
  );
}
