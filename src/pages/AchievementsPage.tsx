import { motion } from 'framer-motion';
import { Trophy, RefreshCw } from 'lucide-react';
import { Header } from '@/components/Header';
import { AchievementsGrid } from '@/components/AchievementsGrid';
import { Button } from '@/components/ui/button';
import { useCheckAchievements } from '@/hooks/useAchievements';
import { useUser } from '@/hooks/useUser';
import { useState } from 'react';

export default function AchievementsPage() {
  const { user, loading } = useUser();
  const { checkAndUnlock } = useCheckAchievements();
  const [checking, setChecking] = useState(false);

  const handleCheckAchievements = async () => {
    setChecking(true);
    await checkAndUnlock();
    setChecking(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="w-8 h-8 animate-spin text-primary">⏳</div>
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
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold">Achievements</h1>
                <p className="text-sm text-muted-foreground">
                  Unlock badges by learning and earning XP
                </p>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckAchievements}
              disabled={checking}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
              Check Progress
            </Button>
          </div>

          {/* Achievements grid */}
          <AchievementsGrid showAll />
        </motion.div>
      </main>
    </div>
  );
}
