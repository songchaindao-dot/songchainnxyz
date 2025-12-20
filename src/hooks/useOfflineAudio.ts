import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface CachedSong {
  songId: string;
  cachedAt: number;
}

const CACHED_SONGS_KEY = 'offline-cached-songs';

export function useOfflineAudio() {
  const [cachedSongs, setCachedSongs] = useState<CachedSong[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cachingInProgress, setCachingInProgress] = useState<string | null>(null);

  useEffect(() => {
    // Load cached songs list from localStorage
    const stored = localStorage.getItem(CACHED_SONGS_KEY);
    if (stored) {
      try {
        setCachedSongs(JSON.parse(stored));
      } catch {
        setCachedSongs([]);
      }
    }

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      toast({ 
        title: 'You\'re offline', 
        description: 'Only cached songs are available.' 
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for messages from service worker
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data.type === 'AUDIO_CACHED') {
        const { songId } = event.data;
        const newCachedSong: CachedSong = { songId, cachedAt: Date.now() };
        setCachedSongs(prev => {
          const updated = [...prev.filter(s => s.songId !== songId), newCachedSong];
          localStorage.setItem(CACHED_SONGS_KEY, JSON.stringify(updated));
          return updated;
        });
        setCachingInProgress(null);
        toast({ title: 'Song saved for offline listening!' });
      }
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const cacheSong = useCallback(async (songId: string, audioUrl: string) => {
    if (!('serviceWorker' in navigator)) {
      toast({ 
        title: 'Offline mode not supported', 
        variant: 'destructive' 
      });
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) {
      toast({ 
        title: 'Service worker not ready', 
        variant: 'destructive' 
      });
      return false;
    }

    setCachingInProgress(songId);
    
    registration.active.postMessage({
      type: 'CACHE_AUDIO',
      songId,
      url: audioUrl
    });

    return true;
  }, []);

  const removeCachedSong = useCallback(async (songId: string) => {
    // For now, just remove from the list
    // In a full implementation, we'd also remove from the cache
    setCachedSongs(prev => {
      const updated = prev.filter(s => s.songId !== songId);
      localStorage.setItem(CACHED_SONGS_KEY, JSON.stringify(updated));
      return updated;
    });
    toast({ title: 'Song removed from offline library' });
  }, []);

  const isSongCached = useCallback((songId: string) => {
    return cachedSongs.some(s => s.songId === songId);
  }, [cachedSongs]);

  const getCachedAudioUrl = useCallback(async (songId: string): Promise<string | null> => {
    if (!('serviceWorker' in navigator)) return null;
    
    return new Promise((resolve) => {
      const registration = navigator.serviceWorker.ready.then(reg => {
        if (!reg.active) {
          resolve(null);
          return;
        }

        const handler = (event: MessageEvent) => {
          if (event.data.type === 'CACHED_AUDIO_URL' && event.data.songId === songId) {
            navigator.serviceWorker.removeEventListener('message', handler);
            resolve(event.data.url);
          }
        };

        navigator.serviceWorker.addEventListener('message', handler);
        
        reg.active.postMessage({
          type: 'GET_CACHED_AUDIO',
          songId
        });

        // Timeout after 2 seconds
        setTimeout(() => {
          navigator.serviceWorker.removeEventListener('message', handler);
          resolve(null);
        }, 2000);
      });
    });
  }, []);

  return {
    cachedSongs,
    isOnline,
    cachingInProgress,
    cacheSong,
    removeCachedSong,
    isSongCached,
    getCachedAudioUrl
  };
}
