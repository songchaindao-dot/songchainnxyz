import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode, useMemo } from 'react';
import { Song, SONGS } from '@/data/musicData';
import { supabase } from '@/integrations/supabase/client';

// Split context for better performance - components only re-render for what they need
interface PlayerStateContext {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
}

interface PlayerTimeContext {
  currentTime: number;
  duration: number;
}

interface PlayerActionsContext {
  playSong: (song: Song) => void;
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (song: Song) => void;
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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const nextAudioRef = useRef<HTMLAudioElement | null>(null);
  const playNextRef = useRef<() => void>(() => {});
  const crossfadeTriggeredRef = useRef(false);
  const crossfadeDuration = 2000; // 2 second crossfade
  const crossfadeThreshold = 2; // Start crossfade 2 seconds before song ends

  // Remote audio must be CORS-enabled for WebAudio processing; use backend proxy when needed.
  const toPlayableUrl = useCallback((url: string) => {
    const proxyBase = import.meta.env.VITE_SUPABASE_URL;
    if (!proxyBase) return url;

    if (url.startsWith('https://pub-dabb7edd1f1a4dbf82bbc290554e465b.r2.dev/')) {
      return `${proxyBase}/functions/v1/audio-proxy?url=${encodeURIComponent(url)}`;
    }

    return url;
  }, []);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    nextAudioRef.current = new Audio();
    nextAudioRef.current.volume = 0;

    const audio = audioRef.current;

    // Check for crossfade trigger point (2 seconds before end)
    const handleTimeUpdate = () => {
      const now = Date.now();
      setCurrentTime(audio.currentTime);
      
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

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      // Reset crossfade trigger when new song loads
      crossfadeTriggeredRef.current = false;
    };

    const handleEnded = () => {
      // Only trigger if crossfade wasn't already started
      if (!crossfadeTriggeredRef.current) {
        playNextRef.current();
      }
      crossfadeTriggeredRef.current = false;
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
      nextAudioRef.current?.pause();
    };
  }, []);

  // Crossfade transition function
  const crossfadeToSong = useCallback((song: Song) => {
    if (!audioRef.current || !nextAudioRef.current || isCrossfading) return;
    
    setIsCrossfading(true);
    const currentAudio = audioRef.current;
    const nextAudio = nextAudioRef.current;
    
    // Set up next track
    nextAudio.src = toPlayableUrl(song.audioUrl);
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

  const playSong = useCallback((song: Song, useCrossfade = false) => {
    if (audioRef.current) {
      // Track play event for popularity ranking
      supabase.auth.getUser().then(({ data: { user } }) => {
        supabase.from('song_analytics').insert({
          song_id: song.id,
          user_id: user?.id || null,
          event_type: 'play'
        }).then(() => {});
      });

      if (useCrossfade && isPlaying && currentSong) {
        crossfadeToSong(song);
      } else {
        audioRef.current.src = toPlayableUrl(song.audioUrl);
        audioRef.current.volume = volume;
        audioRef.current.play();
        setCurrentSong(song);
        setIsPlaying(true);
      }
    }
  }, [crossfadeToSong, isPlaying, currentSong, volume, toPlayableUrl]);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
        setIsPlaying(true);
      } else {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const play = useCallback(() => {
    if (audioRef.current && currentSong) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentSong]);

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

  // Crossfade to next song for DJ-style transitions
  const playNext = useCallback(() => {
    if (currentSong && queue.length > 0) {
      const currentIndex = queue.findIndex(s => s.id === currentSong.id);
      const nextIndex = (currentIndex + 1) % queue.length;
      const nextSong = queue[nextIndex];
      
      // Use crossfade for automatic transitions
      if (isPlaying) {
        crossfadeToSong(nextSong);
      } else {
        playSong(nextSong, false);
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
        playSong(prevSong, false);
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
  }), [currentSong, isPlaying, queue]);

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
    volume,
  }), [playSong, togglePlay, pause, play, seekTo, setVolume, playNext, playPrevious, addToQueue, volume]);

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
