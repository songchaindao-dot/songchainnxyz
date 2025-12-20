import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Song } from '@/data/musicData';

const OFFLINE_SONGS_KEY = 'songchainn_offline_songs';

interface OfflineSong {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  cachedAt: number;
}

export function useOfflineMusic() {
  const [offlineSongs, setOfflineSongs] = useState<OfflineSong[]>([]);
  const [cachingProgress, setCachingProgress] = useState<Record<string, boolean>>({});
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  // Load offline songs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(OFFLINE_SONGS_KEY);
    if (saved) {
      try {
        setOfflineSongs(JSON.parse(saved));
      } catch {
        setOfflineSongs([]);
      }
    }
  }, []);

  // Check if service worker is ready
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsServiceWorkerReady(true);
      });

      // Listen for messages from service worker
      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data || {};

        if (type === 'AUDIO_CACHED') {
          setCachingProgress((prev) => {
            const next = { ...prev };
            delete next[payload.songId];
            return next;
          });
          
          if (payload.success) {
            toast({
              title: 'Downloaded',
              description: 'Song saved for offline playback'
            });
          }
        }

        if (type === 'AUDIO_CACHE_ERROR') {
          setCachingProgress((prev) => {
            const next = { ...prev };
            delete next[payload.songId];
            return next;
          });
          
          // Remove from offline songs on error
          setOfflineSongs((prev) => {
            const updated = prev.filter((s) => s.id !== payload.songId);
            localStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(updated));
            return updated;
          });
          
          toast({
            title: 'Download Failed',
            description: payload.error || 'Could not save song for offline playback',
            variant: 'destructive'
          });
        }

        if (type === 'AUDIO_REMOVED') {
          toast({
            title: 'Removed',
            description: 'Song removed from offline storage'
          });
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  const isOffline = useCallback((songId: string): boolean => {
    return offlineSongs.some((s) => s.id === songId);
  }, [offlineSongs]);

  const isCaching = useCallback((songId: string): boolean => {
    return !!cachingProgress[songId];
  }, [cachingProgress]);

  const saveForOffline = useCallback(async (song: Song): Promise<boolean> => {
    if (!isServiceWorkerReady) {
      toast({
        title: 'Not Available',
        description: 'Offline mode is not available yet. Please try again.',
        variant: 'destructive'
      });
      return false;
    }

    if (isOffline(song.id)) {
      toast({
        title: 'Already Saved',
        description: 'This song is already saved for offline playback'
      });
      return false;
    }

    // Mark as caching
    setCachingProgress((prev) => ({ ...prev, [song.id]: true }));

    // Add to offline songs list
    const offlineSong: OfflineSong = {
      id: song.id,
      title: song.title,
      artist: song.artist,
      audioUrl: song.audioUrl,
      cachedAt: Date.now()
    };

    setOfflineSongs((prev) => {
      const updated = [...prev, offlineSong];
      localStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(updated));
      return updated;
    });

    // Tell service worker to cache the audio
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'CACHE_AUDIO',
      payload: {
        url: song.audioUrl,
        songId: song.id
      }
    });

    return true;
  }, [isServiceWorkerReady, isOffline]);

  const removeFromOffline = useCallback(async (song: Song): Promise<boolean> => {
    if (!isServiceWorkerReady) return false;

    // Remove from offline songs list
    setOfflineSongs((prev) => {
      const updated = prev.filter((s) => s.id !== song.id);
      localStorage.setItem(OFFLINE_SONGS_KEY, JSON.stringify(updated));
      return updated;
    });

    // Tell service worker to remove cached audio
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: 'REMOVE_CACHED_AUDIO',
      payload: {
        url: song.audioUrl,
        songId: song.id
      }
    });

    return true;
  }, [isServiceWorkerReady]);

  const toggleOffline = useCallback(async (song: Song): Promise<void> => {
    if (isOffline(song.id)) {
      await removeFromOffline(song);
    } else {
      await saveForOffline(song);
    }
  }, [isOffline, saveForOffline, removeFromOffline]);

  const getOfflineStorageSize = useCallback(async (): Promise<string> => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(1);
      return `${usedMB} MB`;
    }
    return 'Unknown';
  }, []);

  return {
    offlineSongs,
    isOffline,
    isCaching,
    saveForOffline,
    removeFromOffline,
    toggleOffline,
    getOfflineStorageSize,
    isServiceWorkerReady
  };
}