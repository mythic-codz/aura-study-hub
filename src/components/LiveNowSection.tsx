import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Play } from 'lucide-react';
import { useLiveClasses } from '@/hooks/useLiveClasses';
import { useBatches } from '@/hooks/useBatches';
import { useMemo } from 'react';

/**
 * Dedicated "Live Now" section showing every currently-running live class.
 * Ended lives are filtered out by the hook, so old lives never appear.
 */
export function LiveNowSection() {
  const { data: lives } = useLiveClasses();
  const { data: batches } = useBatches();

  const batchNameById = useMemo(() => {
    const m = new Map<string, string>();
    (batches || []).forEach((b) => m.set(b.id, b.name || 'Course'));
    return m;
  }, [batches]);

  if (!lives || lives.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-12"
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
        </span>
        <Radio className="w-5 h-5 text-red-500" />
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Live Now</h2>
        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
          {lives.length} live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {lives.map((live) => (
            <motion.div
              key={live.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            >
              <Link
                to={`/live/${live.batch_id}`}
                className="glass-card-hover block p-4 rounded-2xl border border-red-500/30 hover:border-red-500/60 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    Live
                  </div>
                  <span className="text-xs text-muted-foreground truncate">
                    {batchNameById.get(live.batch_id) || 'Course'}
                  </span>
                </div>
                <h3 className="font-semibold line-clamp-2 mb-3">{live.title}</h3>
                <div className="flex items-center gap-2 text-sm text-red-400 font-medium">
                  <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Watch live
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}
