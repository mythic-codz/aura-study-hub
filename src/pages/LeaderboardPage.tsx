import { motion } from 'framer-motion';
import { Trophy, Medal, Loader2, Crown, Waves } from 'lucide-react';
import { Header } from '@/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useUser } from '@/hooks/useUser';
import logo from '@/assets/logo.png';

export default function LeaderboardPage() {
  const { data: users, isLoading } = useLeaderboard(20);
  const { user } = useUser();

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
        <Crown className="w-5 h-5 text-yellow-900" />
      </div>
    );
    if (rank === 2) return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
        <Medal className="w-5 h-5 text-gray-700" />
      </div>
    );
    if (rank === 3) return (
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
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
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-2xl"
          >
            <Trophy className="w-8 h-8 text-amber-900" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold gradient-text mb-2">Leaderboard</h1>
          <p className="text-muted-foreground">Top explorers of Study Ocean</p>
        </motion.div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <img src={logo} alt="Loading" className="w-12 h-12 rounded-xl" />
            </motion.div>
            <p className="text-muted-foreground">Loading rankings...</p>
          </div>
        ) : (
          <div className="space-y-3">
            {users?.map((u, i) => {
              const isCurrentUser = u.id === user?.id;
              const isTopThree = i < 3;
              
              return (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ x: 4 }}
                  className={`
                    glass-card-hover p-4 flex items-center gap-4 
                    ${isCurrentUser ? 'ring-2 ring-primary/50' : ''}
                    ${isTopThree ? 'border-amber-500/20' : ''}
                  `}
                >
                  {/* Rank */}
                  {getRankDisplay(i + 1)}
                  
                  {/* Avatar */}
                  <Avatar className={`w-12 h-12 ${isTopThree ? 'ring-2 ring-amber-400/30' : ''}`}>
                    <AvatarImage src={u.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-primary font-bold">
                      {u.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold truncate ${isCurrentUser ? 'text-primary' : 'text-foreground'}`}>
                      {u.name}
                      {isCurrentUser && <span className="text-xs text-primary/70 ml-2">(You)</span>}
                    </p>
                    {isTopThree && (
                      <p className="text-xs text-amber-400/80">
                        {i === 0 ? '🏆 Champion' : i === 1 ? '🥈 Runner-up' : '🥉 Third Place'}
                      </p>
                    )}
                  </div>
                  
                  {/* XP */}
                  <div className="xp-badge">
                    <span className="font-bold">{u.xp}</span>
                    <span className="text-xs">XP</span>
                  </div>
                </motion.div>
              );
            })}

            {/* Empty state */}
            {(!users || users.length === 0) && (
              <div className="glass-card p-12 text-center">
                <Waves className="w-16 h-16 text-primary/30 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground/80 mb-2">No Explorers Yet</h3>
                <p className="text-muted-foreground">Be the first to start learning!</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
