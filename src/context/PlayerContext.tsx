import React, { createContext, useContext, useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Song, SONGS } from '@/data/musicData';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  queue: Song[];
  playSong: (song: Song) => void;
  togglePlay: () => void;
  pause: () => void;
  play: () => void;
  seekTo: (time: number) => void;
  setVolume: (volume: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (song: Song) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [queue, setQueue] = useState<Song[]>(SONGS);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Store playNext in a ref to avoid stale closure issues
  const playNextRef = useRef<() => void>(() => {});

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      // Use ref to get the latest playNext function
      playNextRef.current();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  const playSong = useCallback((song: Song) => {
    if (audioRef.current) {
      audioRef.current.src = song.audioUrl;
      audioRef.current.play();
      setCurrentSong(song);
      setIsPlaying(true);
    }
  }, []);

  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

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

  const playNext = useCallback(() => {
    if (currentSong && queue.length > 0) {
      const currentIndex = queue.findIndex(s => s.id === currentSong.id);
      const nextIndex = (currentIndex + 1) % queue.length;
      playSong(queue[nextIndex]);
    }
  }, [currentSong, queue, playSong]);

  // Keep the ref updated with the latest playNext function
  useEffect(() => {
    playNextRef.current = playNext;
  }, [playNext]);

  const playPrevious = useCallback(() => {
    if (currentSong && queue.length > 0) {
      const currentIndex = queue.findIndex(s => s.id === currentSong.id);
      const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
      playSong(queue[prevIndex]);
    }
  }, [currentSong, queue, playSong]);

  const addToQueue = useCallback((song: Song) => {
    setQueue(prev => [...prev, song]);
  }, []);

  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      currentTime,
      duration,
      volume,
      queue,
      playSong,
      togglePlay,
      pause,
      play,
      seekTo,
      setVolume,
      playNext,
      playPrevious,
      addToQueue,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
