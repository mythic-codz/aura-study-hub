import { useEffect, useState } from 'react';
import { Skull, ShieldAlert, Clock, Ban } from 'lucide-react';

interface BlockedInfo {
  banned_until: string | null;
  violation_count: number;
}

export default function BlockedPage() {
  const [info, setInfo] = useState<BlockedInfo | null>(null);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    // Read ban info from sessionStorage (set by SecurityProvider)
    try {
      const stored = sessionStorage.getItem('ban_info');
      if (stored) setInfo(JSON.parse(stored));
    } catch {}

    // Block all shortcuts on this page too
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey) || 
          (e.ctrlKey && (e.key === 'u' || e.key === 'U')) ||
          (e.metaKey && e.altKey)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const ctxHandler = (e: MouseEvent) => { e.preventDefault(); };
    
    document.addEventListener('keydown', handler, true);
    document.addEventListener('contextmenu', ctxHandler, true);
    
    return () => {
      document.removeEventListener('keydown', handler, true);
      document.removeEventListener('contextmenu', ctxHandler, true);
    };
  }, []);

  useEffect(() => {
    if (!info?.banned_until) return;
    
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(info.banned_until!).getTime();
      const diff = end - now;
      
      if (diff <= 0) {
        setTimeLeft('Ban expired - refresh to try again');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);
      
      setTimeLeft(parts.join(' '));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [info]);

  // Block back navigation
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handler = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" style={{ userSelect: 'none' }}>
      <div className="max-w-md w-full text-center space-y-8">
        {/* Skull icon */}
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-pulse" />
          <div className="absolute inset-2 bg-red-500/10 rounded-full flex items-center justify-center">
            <Skull className="w-20 h-20 text-red-500" strokeWidth={1.5} />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-red-500 flex items-center justify-center gap-2">
            <ShieldAlert className="w-8 h-8" />
            Access Blocked
          </h1>
          <p className="text-gray-400 text-lg">
            Unauthorized activity detected on your device.
          </p>
        </div>

        {/* Ban details */}
        <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-6 space-y-4">
          {info && (
            <>
              <div className="flex items-center justify-center gap-2 text-red-400">
                <Ban className="w-5 h-5" />
                <span className="font-semibold">
                  Violation #{info.violation_count}
                </span>
              </div>
              
              {timeLeft && (
                <div className="flex items-center justify-center gap-2 text-gray-300">
                  <Clock className="w-5 h-5 text-red-400" />
                  <span className="font-mono text-lg">{timeLeft}</span>
                </div>
              )}
            </>
          )}

          <p className="text-gray-500 text-sm">
            Your device and network have been recorded. Clearing cache will not remove this ban.
            Repeated violations will result in longer bans.
          </p>
        </div>

        {/* Warning */}
        <p className="text-gray-600 text-xs">
          Ban escalation: 1 day → 1 week → 1 month → 3 months → 1 year
        </p>
      </div>
    </div>
  );
}
