import { motion } from 'framer-motion';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { Header } from '@/components/Header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLeaderboard } from '@/hooks/useLeaderboard';
import { useUser } from '@/hooks/useUser';

export default function LeaderboardPage() {
  const { data: users, isLoading } = useLeaderboard(20);
  const { user } = useUser();

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center text-muted-foreground">{rank}</span>;
  };

  return (
    <div className="min-h-screen animated-bg">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-display font-bold gradient-text">Leaderboard</h1>
          <p className="text-muted-foreground mt-2">Top learners by XP</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {users?.map((u, i) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-4 flex items-center gap-4 ${u.id === user?.id ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="w-8 flex justify-center">{getRankIcon(i + 1)}</div>
                <Avatar className="w-10 h-10">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">{u.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="flex-1 font-medium">{u.name}</span>
                <span className="xp-badge">{u.xp} XP</span>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
