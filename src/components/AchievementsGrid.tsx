import { motion } from 'framer-motion';
import { Trophy, Loader2 } from 'lucide-react';
import { useAchievements, useUserAchievements } from '@/hooks/useAchievements';
import { AchievementBadge } from './AchievementBadge';
import { Progress } from '@/components/ui/progress';

interface AchievementsGridProps {
  showAll?: boolean;
}

const typeLabels: Record<string, string> = {
  first_steps: '🌟 First Steps',
  videos_watched: '📺 Video Milestones',
  batch_complete: '🎓 Course Completion',
  xp_milestone: '⚡ XP Milestones',
  streak: '🔥 Streaks',
};

export function AchievementsGrid({ showAll = false }: AchievementsGridProps) {
  const { data: achievements, isLoading: loadingAchievements } = useAchievements();
  const { data: userAchievements, isLoading: loadingUser } = useUserAchievements();

  if (loadingAchievements || loadingUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!achievements?.length) {
    return (
      <div className="text-center text-muted-foreground p-4">
        No achievements available yet.
      </div>
    );
  }

  const unlockedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
  const unlockedCount = unlockedIds.size;
  const totalCount = achievements.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  // Group achievements by type
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const type = achievement.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  // Filter to show only unlocked if not showing all
  const displayAchievements = showAll 
    ? achievements 
    : achievements.filter(a => unlockedIds.has(a.id));

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-semibold">Achievements</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {unlockedCount} / {totalCount}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {showAll ? (
        // Grouped view when showing all
        <div className="space-y-6">
          {Object.entries(groupedAchievements).map(([type, typeAchievements]) => (
            <motion.div
              key={type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4"
            >
              <h3 className="font-semibold mb-4 text-sm">
                {typeLabels[type] || type}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {typeAchievements.map((achievement) => {
                  const userAchievement = userAchievements?.find(
                    ua => ua.achievement_id === achievement.id
                  );
                  return (
                    <AchievementBadge
                      key={achievement.id}
                      achievement={achievement}
                      unlocked={unlockedIds.has(achievement.id)}
                      unlockedAt={userAchievement?.unlocked_at}
                      size="sm"
                    />
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        // Compact view for unlocked only
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {displayAchievements.length > 0 ? (
            displayAchievements.map((achievement) => {
              const userAchievement = userAchievements?.find(
                ua => ua.achievement_id === achievement.id
              );
              return (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={true}
                  unlockedAt={userAchievement?.unlocked_at}
                  size="sm"
                />
              );
            })
          ) : (
            <div className="col-span-full text-center text-muted-foreground py-4">
              No achievements unlocked yet. Start learning to earn badges!
            </div>
          )}
        </div>
      )}
    </div>
  );
}
