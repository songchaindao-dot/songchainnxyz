import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { usePlayer } from '@/context/PlayerContext';
import { useEngagement } from '@/context/EngagementContext';
import { Slider } from '@/components/ui/slider';
import { useEffect, useRef } from 'react';

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

  useEffect(() => {
    if (currentSong && !hasCountedPlay.current) {
      addPlay(currentSong.id);
      hasCountedPlay.current = true;
    }
  }, [currentSong?.id]);

  useEffect(() => {
    hasCountedPlay.current = false;
  }, [currentSong?.id]);

  if (!currentSong) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-xl border-t border-border z-50"
    >
      {/* Progress bar */}
      <div 
        className="absolute top-0 left-0 h-1 bg-primary transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
      
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Song info */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
              {currentSong.coverImage ? (
                <img src={currentSong.coverImage} alt={currentSong.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full gradient-primary animate-pulse-glow" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">{currentSong.title}</p>
              <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={playPrevious}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <SkipBack className="w-5 h-5 text-foreground" />
            </button>
            
            <button 
              onClick={togglePlay}
              className="p-3 gradient-primary rounded-full shadow-glow hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-primary-foreground" />
              ) : (
                <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
              )}
            </button>
            
            <button 
              onClick={playNext}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <SkipForward className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Time & Volume */}
          <div className="hidden sm:flex items-center gap-4 flex-1 justify-end">
            <span className="text-xs text-muted-foreground w-20 text-right">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            
            <div className="flex items-center gap-2 w-28">
              <button 
                onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
                className="p-1 hover:bg-secondary rounded transition-colors"
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
    </motion.div>
  );
}
