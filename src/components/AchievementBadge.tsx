import { motion } from 'framer-motion';
import { 
  Trophy, Star, Sparkles, Zap, Crown, Award, 
  Play, Video, BookOpen, GraduationCap 
} from 'lucide-react';
import { Achievement } from '@/hooks/useAchievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  unlockedAt?: string;
  size?: 'sm' | 'md' | 'lg';
}

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  sparkles: Sparkles,
  zap: Zap,
  crown: Crown,
  award: Award,
  play: Play,
  video: Video,
  'book-open': BookOpen,
  'graduation-cap': GraduationCap,
};

const colorMap: Record<string, string> = {
  green: 'from-emerald-400 to-emerald-600',
  blue: 'from-blue-400 to-blue-600',
  cyan: 'from-cyan-400 to-cyan-600',
  purple: 'from-purple-400 to-purple-600',
  gold: 'from-yellow-400 to-amber-500',
  yellow: 'from-yellow-300 to-yellow-500',
  orange: 'from-orange-400 to-orange-600',
  red: 'from-red-400 to-red-600',
};

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-20 h-20',
};

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-7 h-7',
  lg: 'w-9 h-9',
};

export function AchievementBadge({ 
  achievement, 
  unlocked, 
  unlockedAt,
  size = 'md' 
}: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon] || Trophy;
  const gradientClass = colorMap[achievement.badge_color] || colorMap.purple;

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={unlocked ? { scale: 1.05 } : undefined}
      className="flex flex-col items-center gap-2"
    >
      <div className="relative">
        {/* Badge container */}
        <div
          className={`
            ${sizeClasses[size]} rounded-full flex items-center justify-center
            ${unlocked 
              ? `bg-gradient-to-br ${gradientClass} shadow-lg` 
              : 'bg-muted/50 border-2 border-dashed border-muted-foreground/30'
            }
            transition-all duration-300
          `}
          style={unlocked ? {
            boxShadow: `0 0 20px hsl(var(--primary) / 0.3)`,
          } : undefined}
        >
          <Icon 
            className={`
              ${iconSizes[size]} 
              ${unlocked ? 'text-white' : 'text-muted-foreground/40'}
            `} 
          />
        </div>

        {/* Glow effect for unlocked */}
        {unlocked && (
          <div 
            className={`
              absolute inset-0 rounded-full animate-pulse-glow
              bg-gradient-to-br ${gradientClass} opacity-30 blur-md -z-10
            `}
          />
        )}

        {/* Lock overlay for locked achievements */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-4 h-4 text-muted-foreground/50">🔒</div>
          </div>
        )}
      </div>

      {/* Achievement name */}
      <div className="text-center max-w-[100px]">
        <p className={`text-xs font-medium truncate ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
          {achievement.name}
        </p>
        {unlocked && unlockedAt && (
          <p className="text-[10px] text-muted-foreground">
            {new Date(unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </motion.div>
  );
}
