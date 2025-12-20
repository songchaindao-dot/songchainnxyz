import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GeneratedArtwork {
  imageUrl: string;
  isLoading: boolean;
  error: string | null;
}

// Cache for generated artwork to avoid regenerating
const artworkCache = new Map<string, string>();

export function useGenerateArtwork(songTitle: string, artistName: string) {
  const [artwork, setArtwork] = useState<GeneratedArtwork>({
    imageUrl: '',
    isLoading: false,
    error: null,
  });

  const generateArtwork = async () => {
    const cacheKey = `${songTitle}-${artistName}`;
    
    // Check cache first
    if (artworkCache.has(cacheKey)) {
      setArtwork({
        imageUrl: artworkCache.get(cacheKey)!,
        isLoading: false,
        error: null,
      });
      return;
    }

    setArtwork(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke('generate-artwork', {
        body: { songTitle, artistName },
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate artwork');
      }

      if (data?.imageUrl) {
        artworkCache.set(cacheKey, data.imageUrl);
        setArtwork({
          imageUrl: data.imageUrl,
          isLoading: false,
          error: null,
        });
      } else if (data?.error) {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Artwork generation error:', err);
      setArtwork({
        imageUrl: '',
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to generate artwork',
      });
    }
  };

  return {
    ...artwork,
    generateArtwork,
  };
}

