import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, Waves } from 'lucide-react';
import { Header } from '@/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SkeletonCard } from '@/components/SkeletonCard';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useUser } from '@/hooks/useUser';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" as const }
  },
};

export default function LeaderboardPage() {
  const { data: users, isLoading } = useLeaderboard(20);
  const { user } = useUser();

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return (
      <motion.div 
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <Crown className="w-5 h-5 text-yellow-900" />
      </motion.div>
    );
    if (rank === 2) return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center shadow-lg">
        <Medal className="w-5 h-5 text-gray-700" />
      </div>
    );
    if (rank === 3) return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center shadow-lg">
        <Medal className="w-5 h-5 text-amber-200" />
      </div>
    );
    return (
      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
        <span className="text-muted-foreground font-bold">{rank}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl shadow-amber-500/30"
          >
            <Trophy className="w-8 h-8 text-amber-900" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-2"
          >
            Leaderboard
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground"
          >
            Top explorers of Study Ocean
          </motion.p>
        </motion.div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} variant="list" index={i} />
            ))}
          </div>
        ) : (
          <motion.div 
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {users?.map((u, i) => {
              const isCurrentUser = u.id === user?.id;
              const isTopThree = i < 3;
              
              return (
                <motion.div
                  key={u.id}
                  variants={itemVariants}
                  whileHover={{ x: 6, transition: { duration: 0.2 } }}
                  className={`
                    glass-card-hover p-4 flex items-center gap-4 
                    ${isCurrentUser ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/10' : ''}
                    ${isTopThree ? 'border-amber-500/20' : ''}
                  `}
                >
                  {/* Rank */}
                  {getRankDisplay(i + 1)}
                  
                  {/* Avatar */}
                  <motion.div whileHover={{ scale: 1.1 }} transition={{ type: 'spring', stiffness: 400, damping: 17 }}>
                    <Avatar className={`w-12 h-12 ${isTopThree ? 'ring-2 ring-amber-400/30' : ''}`}>
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-primary font-bold">
                        {u.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                      {u.name}
                      {isCurrentUser && <span className="text-xs text-primary/70 ml-2">(You)</span>}
                    </p>
                    {isTopThree && (
                      <motion.p 
                        className="text-xs text-amber-400/80"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        {i === 0 ? '🏆 Champion' : i === 1 ? '🥈 Runner-up' : '🥉 Third Place'}
                      </motion.p>
                    )}
                  </div>
                  
                  {/* XP */}
                  <motion.div 
                    className="xp-badge"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="font-bold">{u.xp}</span>
                    <span className="text-xs">XP</span>
                  </motion.div>
                </motion.div>
              );
            })}

            {/* Empty state */}
            {(!users || users.length === 0) && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-12 text-center"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Waves className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Explorers Yet</h3>
                <p className="text-muted-foreground">Be the first to start learning!</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}
