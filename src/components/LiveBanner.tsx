import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, ArrowRight } from 'lucide-react';
import { useLiveClasses } from '@/hooks/useLiveClasses';
import { useFavorites } from '@/hooks/useFavorites';
import { useBatches } from '@/hooks/useBatches';
import { toast } from '@/hooks/use-toast';

/**
 * Shows live classes for the user's favorited batches and pops a toast
 * the moment a favorited batch goes live. Ended lives are excluded by the hook.
 */
export function LiveBanner() {
  const { data: lives } = useLiveClasses();
  const { data: favorites } = useFavorites();
  const { data: batches } = useBatches();
  const notified = useRef<Set<string>>(new Set());

  const favoriteIds = useMemo(
    () => new Set((favorites || []).map((f) => f.batch_id)),
    [favorites]
  );

  const batchNameById = useMemo(() => {
    const m = new Map<string, string>();
    (batches || []).forEach((b) => m.set(b.id, b.name || 'Your course'));
    return m;
  }, [batches]);

  const favoriteLives = useMemo(
    () => (lives || []).filter((l) => favoriteIds.has(l.batch_id)),
    [lives, favoriteIds]
  );

  // Toast when a favorited batch newly goes live
  useEffect(() => {
    favoriteLives.forEach((live) => {
      if (notified.current.has(live.id)) return;
      notified.current.add(live.id);
      toast({
        title: '🔴 Live class started!',
        description: `${batchNameById.get(live.batch_id) || 'A favorite course'} — ${live.title}`,
      });
    });
  }, [favoriteLives, batchNameById]);

  if (favoriteLives.length === 0) return null;

  return (
    <div className="mb-10 space-y-3">
      <AnimatePresence>
        {favoriteLives.map((live) => (
          <motion.div
            key={live.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Link
              to={`/batch/${live.batch_id}`}
              className="glass-card flex items-center gap-4 p-4 rounded-2xl border border-red-500/30 hover:border-red-500/50 transition-colors group"
            >
              <span className="relative flex h-3 w-3 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Radio className="w-4 h-4 text-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-red-500">Live</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm truncate">
                  {batchNameById.get(live.batch_id) || 'Your favorite course'}
                </p>
                <p className="text-xs text-muted-foreground truncate">{live.title}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
