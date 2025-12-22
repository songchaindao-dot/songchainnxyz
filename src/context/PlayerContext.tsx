import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { Song, SONGS } from '@/data/musicData';
import { isOnChainSong, hasUsedPreview, markPreviewUsed, addPreviewTime, getPreviewThreshold } from '@/lib/songRegistry';
import { toast } from 'sonner';

// Split context for better performance - components only re-render for what they need
interface PlayerStateContext {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  isPreviewMode: boolean;
  blockedSongId: string | null;
}

interface PlayerTimeContext {
  currentTime: number;
  duration: number;
}

interface PlayerActionsContext {
  playSong: (song: Song, options?: { userAddress?: string; hasOwnership?: boolean }) => void;
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (song: Song) => void;
  clearBlockedSong: () => void;
  volume: number;
}

const PlayerStateCtx = createContext<PlayerStateContext | undefined>(undefined);
const PlayerTimeCtx = createContext<PlayerTimeContext | undefined>(undefined);
const PlayerActionsCtx = createContext<PlayerActionsContext | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [queue, setQueue] = useState<Song[]>(SONGS);
  const [isCrossfading, setIsCrossfading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [blockedSongId, setBlockedSongId] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const playNextRef = useRef<() => void>(() => {});
  const crossfadeTriggeredRef = useRef(false);
  const previewUserRef = useRef<string | undefined>(undefined);
  const previewTimeTrackingRef = useRef<{ lastTime: number; accumulated: number }>({ lastTime: 0, accumulated: 0 });
  const crossfadeDuration = 2000; // 2 second crossfade
  const crossfadeThreshold = 2; // Start crossfade 2 seconds before song ends

  // Initialize audio elements - runs once on mount
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    nextAudioRef.current = new Audio();
    nextAudioRef.current.volume = 0;

    const audio = audioRef.current;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // Reset crossfade trigger when new song loads
      crossfadeTriggeredRef.current = false;
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.pause();
      nextAudioRef.current?.pause();
    };
  }, []);

  // Handle time updates with preview tracking - updates when state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      
      // Track preview playback time - mark as used after 5 seconds but don't interrupt
      if (isPreviewMode && currentSong) {
        const elapsed = audio.currentTime - previewTimeTrackingRef.current.lastTime;
        if (elapsed > 0 && elapsed < 2) { // Sanity check for reasonable time increment
          // Check if 5-second threshold reached - just mark as used, don't stop
          const thresholdReached = addPreviewTime(currentSong.id, elapsed, previewUserRef.current);
          if (thresholdReached) {
            // Preview is now used up - will be blocked on next play attempt
            // But allow current playback to continue
            toast.info('Preview counted - song will require unlock after this play', {
              duration: 3000,
            });
          }
        }
        previewTimeTrackingRef.current.lastTime = audio.currentTime;
      }
      
      // Trigger crossfade when approaching end of song
      const timeRemaining = audio.duration - audio.currentTime;
      if (
        !crossfadeTriggeredRef.current && 
        audio.duration > 0 && 
        timeRemaining <= crossfadeThreshold && 
        timeRemaining > 0
      ) {
        crossfadeTriggeredRef.current = true;
        playNextRef.current();
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [isPreviewMode, currentSong]);

  // Handle song ended - lock preview songs after they finish
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      // If this was a preview song, ensure it's locked for future plays
      if (isPreviewMode && currentSong) {
        markPreviewUsed(currentSong.id, previewUserRef.current);
        setBlockedSongId(currentSong.id);
        setIsPreviewMode(false);
        setIsPlaying(false);
        toast.info('Preview finished - unlock to listen again', {
          duration: 4000,
        });
        return;
      }
      
      // Only trigger next song if crossfade wasn't already started
      if (!crossfadeTriggeredRef.current) {
        playNextRef.current();
      }
      crossfadeTriggeredRef.current = false;
    };

    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [isPreviewMode, currentSong]);

  // Crossfade transition function
  const crossfadeToSong = useCallback((song: Song) => {
    if (!audioRef.current || !nextAudioRef.current || isCrossfading) return;
    
    setIsCrossfading(true);
    const currentAudio = audioRef.current;
    const nextAudio = nextAudioRef.current;
    
    // Set up next track
    nextAudio.src = song.audioUrl;
    nextAudio.volume = 0;
    nextAudio.play();
    
    // Update state immediately for UI
    setCurrentSong(song);
    
    const steps = 20;
    const stepDuration = crossfadeDuration / steps;
    let step = 0;
    
    const fadeInterval = setInterval(() => {
      step++;
      const progress = step / steps;
      
      // Fade out current, fade in next
      currentAudio.volume = Math.max(0, volume * (1 - progress));
      nextAudio.volume = Math.min(volume, volume * progress);
      
      if (step >= steps) {
        clearInterval(fadeInterval);
        
        // Swap audio elements
        currentAudio.pause();
        currentAudio.src = '';
        
        // Swap refs - the next audio becomes current
        const temp = audioRef.current;
        audioRef.current = nextAudioRef.current;
        nextAudioRef.current = temp;
        
        setIsCrossfading(false);
        setIsPlaying(true);
      }
    }, stepDuration);
  }, [volume, isCrossfading, crossfadeDuration]);

  const playSong = useCallback((song: Song, options?: { userAddress?: string; hasOwnership?: boolean }) => {
    const { userAddress, hasOwnership } = options || {};
    
    // Reset preview time tracking
    previewTimeTrackingRef.current = { lastTime: 0, accumulated: 0 };
    
    // Check if song is token-gated
    if (song.isTokenGated && isOnChainSong(song.id)) {
      // If user has ownership, play normally
      if (hasOwnership) {
        setIsPreviewMode(false);
        setBlockedSongId(null);
      } else {
        // Check if preview was already used (threshold exceeded)
        if (hasUsedPreview(song.id, userAddress)) {
          // Block playback - preview already exhausted
          setBlockedSongId(song.id);
          toast.error('Free preview used - unlock to listen again', {
            duration: 4000,
          });
          return; // Don't play at all
        }
        
        // Allow full preview play - will be marked as used after 5 seconds
        setIsPreviewMode(true);
        previewUserRef.current = userAddress;
        toast.info('Playing free preview - one full listen allowed', {
          duration: 4000,
        });
      }
    } else {
      setIsPreviewMode(false);
    }
    
    if (audioRef.current) {
      if (isPlaying && currentSong && !song.isTokenGated) {
        crossfadeToSong(song);
      } else {
        audioRef.current.src = song.audioUrl;
        audioRef.current.volume = volume;
        audioRef.current.play();
        setCurrentSong(song);
        setIsPlaying(true);
      }
    }
  }, [crossfadeToSong, isPlaying, currentSong, volume]);

  const togglePlay = useCallback(() => {
    // Don't allow play if current song is blocked
    if (currentSong && blockedSongId === currentSong.id) {
      toast.error('Unlock this song to continue listening');
      return;
    }
    
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [currentSong, blockedSongId]);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const play = useCallback(() => {
    // Don't allow play if current song is blocked
    if (currentSong && blockedSongId === currentSong.id) {
      toast.error('Unlock this song to continue listening');
      return;
    }
    
    if (audioRef.current && currentSong) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentSong, blockedSongId]);

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolumeState(newVolume);
    }
  }, []);

  const clearBlockedSong = useCallback(() => {
    setBlockedSongId(null);
  }, []);

  // Crossfade to next song for DJ-style transitions
  const playNext = useCallback(() => {
    if (currentSong && queue.length > 0) {
      const currentIndex = queue.findIndex(s => s.id === currentSong.id);
      const nextIndex = (currentIndex + 1) % queue.length;
      const nextSong = queue[nextIndex];
      
      // Skip token-gated songs in auto-play if not owned
      if (nextSong.isTokenGated) {
        // For now, skip to the next non-gated song
        let skipIndex = nextIndex;
        let attempts = 0;
        while (queue[skipIndex]?.isTokenGated && attempts < queue.length) {
          skipIndex = (skipIndex + 1) % queue.length;
          attempts++;
        }
        if (attempts < queue.length) {
          playSong(queue[skipIndex], { hasOwnership: false });
        }
        return;
      }
      
      // Use crossfade for automatic transitions
      if (isPlaying) {
        crossfadeToSong(nextSong);
      } else {
        playSong(nextSong, { hasOwnership: false });
      }
    }
  }, [currentSong, queue, isPlaying, crossfadeToSong, playSong]);

  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  // Crossfade to previous song
  const playPrevious = useCallback(() => {
    if (currentSong && queue.length > 0) {
      const currentIndex = queue.findIndex(s => s.id === currentSong.id);
      const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
      const prevSong = queue[prevIndex];
      
      if (isPlaying) {
        crossfadeToSong(prevSong);
      } else {
        playSong(prevSong, { hasOwnership: false });
      }
    }
  }, [currentSong, queue, isPlaying, crossfadeToSong, playSong]);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => [...prev, song]);
  }, []);

  // Memoize context values to prevent unnecessary re-renders
  const stateValue = useMemo(() => ({
    currentSong,
    isPlaying,
    queue,
    isPreviewMode,
    blockedSongId,
  }), [currentSong, isPlaying, queue, isPreviewMode, blockedSongId]);

  const timeValue = useMemo(() => ({
    currentTime,
    duration,
  }), [currentTime, duration]);

  const actionsValue = useMemo(() => ({
    playSong,
    togglePlay,
    pause,
    play,
    seekTo,
    setVolume,
    playNext,
    playPrevious,
    addToQueue,
    clearBlockedSong,
    volume,
  }), [playSong, togglePlay, pause, play, seekTo, setVolume, playNext, playPrevious, addToQueue, clearBlockedSong, volume]);

  return (
    <PlayerStateCtx.Provider value={stateValue}>
      <PlayerTimeCtx.Provider value={timeValue}>
        <PlayerActionsCtx.Provider value={actionsValue}>
          {children}
        </PlayerActionsCtx.Provider>
      </PlayerTimeCtx.Provider>
    </PlayerStateCtx.Provider>
  );
}

// Hook for components that need player state (song, playing status)
export function usePlayerState() {
  const context = useContext(PlayerStateCtx);
  if (context === undefined) {
    throw new Error('usePlayerState must be used within a PlayerProvider');
  }
  return context;
}

// Hook for components that need time updates (progress bar, time display)
export function usePlayerTime() {
  const context = useContext(PlayerTimeCtx);
  if (context === undefined) {
    throw new Error('usePlayerTime must be used within a PlayerProvider');
  }
  return context;
}

// Hook for components that need player actions
export function usePlayerActions() {
  const context = useContext(PlayerActionsCtx);
  if (context === undefined) {
    throw new Error('usePlayerActions must be used within a PlayerProvider');
  }
  return context;
}

// Combined hook for backwards compatibility
export function usePlayer() {
  const state = usePlayerState();
  const time = usePlayerTime();
  const actions = usePlayerActions();
  
  return {
    ...state,
    ...time,
    ...actions,
  };
}
