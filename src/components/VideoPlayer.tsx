import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Check 
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VideoPlayerProps {
  src: string;
  title: string;
  onProgress?: (percent: number, currentTime: number) => void;
  initialTime?: number;
}

const PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3];
const VOLUME_STORAGE_KEY = 'aura-study-volume';

function getStoredVolume(): number {
  try {
    const stored = localStorage.getItem(VOLUME_STORAGE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed;
    }
  } catch {}
  return 1;
}

export function VideoPlayer({ src, title, onProgress, initialTime = 0 }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(getStoredVolume);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideControlsTimer = useRef<NodeJS.Timeout>();
  const lastProgressReport = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
      if (onProgress && video.duration > 0) {
        const percent = (video.currentTime / video.duration) * 100;
        // Report progress every 5% to avoid too many updates
        if (Math.abs(percent - lastProgressReport.current) >= 5 || percent >= 95) {
          lastProgressReport.current = percent;
          onProgress(percent, video.currentTime);
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.volume = volume;
      if (initialTime > 0) {
        video.currentTime = initialTime;
      }
    };

    const handleEnded = () => {
      setPlaying(false);
      // Report 100% completion when video ends
      if (onProgress) {
        onProgress(100, video.duration);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onProgress, initialTime, volume]);

  // Track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (playing) {
      video.pause();
    } else {
      video.play();
    }
    setPlaying(!playing);
  }, [playing]);

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = useCallback((value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = value[0];
    video.volume = vol;
    setVolume(vol);
    setMuted(vol === 0);
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, vol.toString());
    } catch {}
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !muted;
    setMuted(!muted);
  }, [muted]);

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const skip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, video.duration || duration));
  }, [duration]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen();
    }
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimer.current) {
      clearTimeout(hideControlsTimer.current);
    }
    hideControlsTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const mins = Math.floor((time % 3600) / 60);
    const secs = Math.floor(time % 60);
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skip(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skip(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          handleVolumeChange([Math.min(1, volume + 0.1)]);
          break;
        case 'ArrowDown':
          e.preventDefault();
          handleVolumeChange([Math.max(0, volume - 0.1)]);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, skip, toggleFullscreen, toggleMute, handleVolumeChange, volume]);

  // Content protection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden glass-card content-protection"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Center play button */}
      {!playing && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/90 flex items-center justify-center glow-effect">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 text-primary-foreground ml-1" />
          </div>
        </motion.button>
      )}

      {/* Controls overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-t from-black/80 to-transparent"
      >
        {/* Progress bar */}
        <div className="relative mb-2 sm:mb-4 group cursor-pointer">
          <div className="absolute h-1 sm:h-1.5 w-full rounded-full bg-white/20">
            <div 
              className="h-full rounded-full bg-white/30"
              style={{ width: `${(buffered / duration) * 100}%` }}
            />
          </div>
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="absolute w-full [&>span:first-child]:h-1 sm:[&>span:first-child]:h-1.5 [&>span:first-child>span]:bg-primary [&>span:last-child]:w-3 [&>span:last-child]:h-3 sm:[&>span:last-child]:w-4 sm:[&>span:last-child]:h-4 [&>span:last-child]:opacity-0 group-hover:[&>span:last-child]:opacity-100"
          />
        </div>

        {/* Control buttons - Mobile responsive */}
        <div className="flex items-center justify-between gap-1 sm:gap-2">
          {/* Left controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button onClick={togglePlay} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors">
              {playing ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            
            <button onClick={() => skip(-10)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:flex">
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button onClick={() => skip(10)} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors hidden sm:flex">
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Volume - hide on mobile */}
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={toggleMute} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <Slider
                value={[muted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={handleVolumeChange}
                className="w-20 [&>span:first-child]:h-1 [&>span:first-child>span]:bg-white [&>span:last-child]:w-3 [&>span:last-child]:h-3"
              />
            </div>

            <span className="text-xs sm:text-sm text-white/80 ml-1 sm:ml-4 whitespace-nowrap">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Speed control */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                  {playbackRate}x
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-card border-white/10 min-w-[80px]">
                {PLAYBACK_SPEEDS.map((speed) => (
                  <DropdownMenuItem
                    key={speed}
                    onClick={() => changePlaybackRate(speed)}
                    className="flex items-center justify-between cursor-pointer text-sm"
                  >
                    {speed}x
                    {speed === playbackRate && <Check className="w-4 h-4 ml-2" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile volume toggle */}
            <button onClick={toggleMute} className="p-1.5 sm:hidden hover:bg-white/10 rounded-lg transition-colors">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button onClick={toggleFullscreen} className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors">
              {isFullscreen ? <Minimize className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Title overlay */}
      <motion.div
        initial={false}
        animate={{ opacity: showControls ? 1 : 0 }}
        className="absolute top-0 left-0 right-0 p-2 sm:p-4 bg-gradient-to-b from-black/60 to-transparent"
      >
        <h2 className="font-display font-semibold text-sm sm:text-lg line-clamp-1">{title}</h2>
      </motion.div>
    </div>
  );
}
