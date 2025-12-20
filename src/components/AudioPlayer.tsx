import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, ChevronUp } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useEngagement } from '@/context/EngagementContext';
import { Slider } from '@/components/ui/slider';
import { useEffect, useRef, useState } from 'react';
import { FullScreenPlayer } from './FullScreenPlayer';

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer() {
  const {
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
  } = usePlayer();

  const { addPlay } = useEngagement();
  const hasCountedPlay = useRef(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (currentSong && !hasCountedPlay.current) {
      addPlay(currentSong.id);
      hasCountedPlay.current = true;
    }
  }, [currentSong?.id]);

  useEffect(() => {
    hasCountedPlay.current = false;
  }, [currentSong?.id]);

  // Media Session API for background playback
  useEffect(() => {
    if ('mediaSession' in navigator && currentSong) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentSong.title,
        artist: currentSong.artist,
        album: currentSong.townSquare,
        artwork: currentSong.coverImage
          ? [{ src: currentSong.coverImage, sizes: '512x512', type: 'image/jpeg' }]
          : [],
      });

      navigator.mediaSession.setActionHandler('play', togglePlay);
      navigator.mediaSession.setActionHandler('pause', togglePlay);
      navigator.mediaSession.setActionHandler('previoustrack', playPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', playNext);
    }
  }, [currentSong, togglePlay, playPrevious, playNext]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 z-50"
      >
        {/* Glass background */}
        <div className="glass-surface border-t border-border/50">
          {/* Progress bar - clickable */}
          <div
            className="absolute top-0 left-0 right-0 h-1 bg-muted/30 cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const percent = (e.clientX - rect.left) / rect.width;
              seekTo(percent * duration);
            }}
          >
            <motion.div
              className="h-full gradient-primary relative"
              style={{ width: `${progress}%` }}
              layoutId="progress"
            >
              {/* Glow effect on progress */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-glow opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </div>

          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              {/* Song info - clickable to expand */}
              <button
                onClick={() => setIsFullScreen(true)}
                className="flex items-center gap-3 min-w-0 flex-1 text-left group"
              >
                <div className="relative w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden shadow-soft shine-overlay">
                  {currentSong.coverImage ? (
                    <img
                      src={currentSong.coverImage}
                      alt={currentSong.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full gradient-primary animate-pulse-glow" />
                  )}
                  {/* Playing indicator */}
                  {isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40">
                      <div className="flex items-end gap-0.5 h-4">
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            className="w-0.5 bg-primary rounded-full"
                            animate={{ height: ['30%', '100%', '30%'] }}
                            transition={{
                              duration: 0.6,
                              repeat: Infinity,
                              delay: i * 0.15,
                              ease: 'easeInOut',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {currentSong.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
                </div>
                <ChevronUp className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              </button>

              {/* Controls */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={playPrevious}
                  className="p-2 hover:bg-secondary/80 rounded-full transition-colors press-effect hidden sm:flex"
                >
                  <SkipBack className="w-5 h-5 text-foreground" />
                </button>

                <motion.button
                  onClick={togglePlay}
                  className="p-3 gradient-primary rounded-full shadow-glow press-effect"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
                  )}
                </motion.button>

                <button
                  onClick={playNext}
                  className="p-2 hover:bg-secondary/80 rounded-full transition-colors press-effect"
                >
                  <SkipForward className="w-5 h-5 text-foreground" />
                </button>
              </div>

              {/* Time & Volume */}
              <div className="hidden sm:flex items-center gap-4 flex-1 justify-end">
                <span className="text-xs text-muted-foreground w-20 text-right tabular-nums">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                <div className="flex items-center gap-2 w-28">
                  <button
                    onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                    className="p-1 hover:bg-secondary/80 rounded transition-colors"
                  >
                    {volume === 0 ? (
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <Slider
                    value={[volume * 100]}
                    onValueChange={([v]) => setVolume(v / 100)}
                    max={100}
                    step={1}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Full Screen Player */}
      <FullScreenPlayer isOpen={isFullScreen} onClose={() => setIsFullScreen(false)} />
    </>
  );
}