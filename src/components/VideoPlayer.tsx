import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Check, Loader2
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
  onProgress?: (percent: number, currentTime: number, duration: number) => void;
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
  const hlsRef = useRef<Hls | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(getStoredVolume);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hideControlsTimer = useRef<NodeJS.Timeout>();
  const lastProgressReport = useRef(0);

  // Check if URL is an HLS stream
  const isHlsStream = src?.includes('.m3u8');

  // Track the last known position to restore after buffering
  const lastKnownTimeRef = useRef<number>(initialTime);
  const playbackRateRef = useRef<number>(1);
  const wasPlayingBeforeBufferRef = useRef<boolean>(false);
  const isRecoveringRef = useRef<boolean>(false);

  // Keep playbackRateRef in sync with state
  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);

  // Initialize HLS or native video - NOTE: playbackRate removed from deps to prevent restart
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setIsLoading(true);

    // Cleanup previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHlsStream) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
          maxBufferSize: 60 * 1000 * 1000, // 60MB
          maxBufferHole: 0.5,
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.volume = volume;
          video.playbackRate = playbackRateRef.current;
          if (initialTime > 0) {
            video.currentTime = initialTime;
            lastKnownTimeRef.current = initialTime;
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          // Store current position before any recovery
          const currentPos = video.currentTime;
          const currentRate = video.playbackRate;
          
          if (data.fatal) {
            isRecoveringRef.current = true;
            lastKnownTimeRef.current = currentPos > 0 ? currentPos : lastKnownTimeRef.current;
            playbackRateRef.current = currentRate > 0 ? currentRate : playbackRateRef.current;
            
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });

        // Handle buffer stall recovery
        hls.on(Hls.Events.BUFFER_APPENDED, () => {
          if (isRecoveringRef.current && video) {
            const targetTime = lastKnownTimeRef.current;
            const targetRate = playbackRateRef.current;
            
            setTimeout(() => {
              if (video && targetTime > 0) {
                video.currentTime = targetTime;
                video.playbackRate = targetRate;
              }
              isRecoveringRef.current = false;
            }, 50);
          }
        });

        // Handle fragment loading to preserve position
        hls.on(Hls.Events.FRAG_LOADING, () => {
          if (video.currentTime > 0 && !isRecoveringRef.current) {
            lastKnownTimeRef.current = video.currentTime;
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = src;
      }
    } else {
      // Regular video file
      video.src = src;
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, isHlsStream, initialTime, volume]); // Removed playbackRate from deps

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Always track the last known time for buffering recovery
      if (video.currentTime > 0) {
        lastKnownTimeRef.current = video.currentTime;
      }
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
      if (onProgress && video.duration > 0) {
        const percent = (video.currentTime / video.duration) * 100;
        // Report progress every 5% to avoid too many updates
        if (Math.abs(percent - lastProgressReport.current) >= 5 || percent >= 95) {
          lastProgressReport.current = percent;
          onProgress(percent, video.currentTime, video.duration);
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      video.volume = volume;
      video.playbackRate = playbackRate;
      if (initialTime > 0 && !isHlsStream) {
        video.currentTime = initialTime;
        lastKnownTimeRef.current = initialTime;
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      // Restore playback rate after buffering
      if (video.playbackRate !== playbackRateRef.current) {
        video.playbackRate = playbackRateRef.current;
      }
      // Auto-resume if we were playing before buffering
      if (wasPlayingBeforeBufferRef.current && video.paused) {
        video.play().catch(() => {});
        wasPlayingBeforeBufferRef.current = false;
      }
    };

    const handleWaiting = () => {
      // Save position and state before buffering
      if (video.currentTime > 0) {
        lastKnownTimeRef.current = video.currentTime;
      }
      wasPlayingBeforeBufferRef.current = !video.paused;
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
      setPlaying(true);
      // Ensure playback rate is preserved after buffering
      if (video.playbackRate !== playbackRateRef.current) {
        video.playbackRate = playbackRateRef.current;
      }
    };

    const handleEnded = () => {
      setPlaying(false);
      wasPlayingBeforeBufferRef.current = false;
      // Report 100% completion when video ends
      if (onProgress) {
        onProgress(100, video.duration, video.duration);
      }
    };

    // Handle stalled event (buffering)
    const handleStalled = () => {
      if (video.currentTime > 0) {
        lastKnownTimeRef.current = video.currentTime;
      }
      wasPlayingBeforeBufferRef.current = !video.paused;
    };

    // Handle seeking to restore after buffer
    const handleSeeked = () => {
      // Preserve playback rate after seeking
      if (video.playbackRate !== playbackRateRef.current) {
        video.playbackRate = playbackRateRef.current;
      }
    };

    // Handle pause to track if user paused manually
    const handlePause = () => {
      setPlaying(false);
      // Only mark as not-was-playing if this is a user pause (not buffering)
      if (!isLoading) {
        wasPlayingBeforeBufferRef.current = false;
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('pause', handlePause);
    };
  }, [onProgress, initialTime, volume, isHlsStream, isLoading]);

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

  const changePlaybackRate = useCallback((rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    // Store current position before changing rate
    const currentPos = video.currentTime;
    video.playbackRate = rate;
    playbackRateRef.current = rate;
    setPlaybackRate(rate);
    // Ensure position is maintained
    if (Math.abs(video.currentTime - currentPos) > 0.5) {
      video.currentTime = currentPos;
    }
  }, []);

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
        className="w-full h-full object-contain"
        onClick={togglePlay}
        playsInline
      />

      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <span className="text-sm text-muted-foreground">Loading video...</span>
          </div>
        </div>
      )}

      {/* Center play button */}
      {!playing && !isLoading && (
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
