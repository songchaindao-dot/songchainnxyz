import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SONGS, Song } from '@/data/musicData';

interface SongPopularity {
  song_id: string;
  play_count: number;
  share_count: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  popularity_score: number;
}

interface ProfilePopularity {
  profile_id: string;
  user_id: string;
  profile_name: string;
  profile_picture_url: string | null;
  bio: string | null;
  view_count: number;
  follower_count: number;
  post_count: number;
  total_post_likes: number;
  popularity_score: number;
}

// Hook to get trending songs ranked by popularity
export function useTrendingSongs(limit = 10) {
  return useQuery({
    queryKey: ['trending-songs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('song_popularity')
        .select('*')
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching song popularity:', error);
        // Fallback to local songs sorted by plays
        return SONGS.sort((a, b) => b.plays - a.plays).slice(0, limit);
      }

      // Map popularity data to songs
      const popularityMap = new Map(
        (data as SongPopularity[]).map(p => [p.song_id, p])
      );

      // Sort songs by database popularity, then by local plays for songs not in DB
      const rankedSongs = [...SONGS].sort((a, b) => {
        const popA = popularityMap.get(a.id);
        const popB = popularityMap.get(b.id);
        
        if (popA && popB) {
          return popB.popularity_score - popA.popularity_score;
        }
        if (popA) return -1;
        if (popB) return 1;
        return b.plays - a.plays;
      });

      return rankedSongs.slice(0, limit).map(song => ({
        ...song,
        analytics: popularityMap.get(song.id) || null
      }));
    },
    staleTime: 60000, // Refresh every minute
  });
}

// Hook to get popular profiles
export function usePopularProfiles(limit = 10) {
  return useQuery({
    queryKey: ['popular-profiles', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profile_popularity')
        .select('*')
        .order('popularity_score', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching profile popularity:', error);
        return [];
      }

      return data as ProfilePopularity[];
    },
    staleTime: 60000,
  });
}

// Hook to get song analytics for a specific song
export function useSongAnalytics(songId: string) {
  return useQuery({
    queryKey: ['song-analytics', songId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('song_popularity')
        .select('*')
        .eq('song_id', songId)
        .single();

      if (error) {
        return {
          play_count: 0,
          share_count: 0,
          view_count: 0,
          like_count: 0,
          comment_count: 0,
          popularity_score: 0
        };
      }

      return data as SongPopularity;
    },
    staleTime: 30000,
  });
}

// Hook to track song events (plays, shares, views)
export function useTrackSongEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ songId, eventType }: { songId: string; eventType: 'play' | 'share' | 'view' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('song_analytics')
        .insert({
          song_id: songId,
          user_id: user?.id || null,
          event_type: eventType
        });

      if (error) {
        console.error('Error tracking song event:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trending-songs'] });
      queryClient.invalidateQueries({ queryKey: ['song-analytics'] });
    },
  });
}

// Hook to track profile views
export function useTrackProfileView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('profile_views')
        .insert({
          profile_id: profileId,
          viewer_id: user?.id || null
        });

      if (error) {
        console.error('Error tracking profile view:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popular-profiles'] });
    },
  });
}

