import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { LikedSong, LikedArtist, Playlist, PlaylistSong, SongComment } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export function useAudienceInteractions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [likedSongs, setLikedSongs] = useState<string[]>([]);
  const [likedArtists, setLikedArtists] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    if (!user) {
      setLikedSongs([]);
      setLikedArtists([]);
      setPlaylists([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      
      const [songsRes, artistsRes, playlistsRes] = await Promise.all([
        supabase.from('liked_songs').select('song_id').eq('user_id', user.id),
        supabase.from('liked_artists').select('artist_id').eq('user_id', user.id),
        supabase.from('playlists').select('*').eq('user_id', user.id)
      ]);

      if (songsRes.data) {
        setLikedSongs(songsRes.data.map(s => s.song_id));
      }
      if (artistsRes.data) {
        setLikedArtists(artistsRes.data.map(a => a.artist_id));
      }
      if (playlistsRes.data) {
        setPlaylists(playlistsRes.data as Playlist[]);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [user]);

  // Like/Unlike Song
  const toggleLikeSong = useCallback(async (songId: string) => {
    if (!user) return;

    const isLiked = likedSongs.includes(songId);

    if (isLiked) {
      const { error } = await supabase
        .from('liked_songs')
        .delete()
        .eq('user_id', user.id)
        .eq('song_id', songId);
      
      if (!error) {
        setLikedSongs(prev => prev.filter(id => id !== songId));
        toast({ title: 'Song removed from likes' });
      }
    } else {
      const { error } = await supabase
        .from('liked_songs')
        .insert({ user_id: user.id, song_id: songId });
      
      if (!error) {
        setLikedSongs(prev => [...prev, songId]);
        toast({ title: 'Song liked!' });
      }
    }
  }, [user, likedSongs, toast]);

  // Like/Unlike Artist
  const toggleLikeArtist = useCallback(async (artistId: string) => {
    if (!user) return;

    const isLiked = likedArtists.includes(artistId);

    if (isLiked) {
      const { error } = await supabase
        .from('liked_artists')
        .delete()
        .eq('user_id', user.id)
        .eq('artist_id', artistId);
      
      if (!error) {
        setLikedArtists(prev => prev.filter(id => id !== artistId));
        toast({ title: 'Artist unfollowed' });
      }
    } else {
      const { error } = await supabase
        .from('liked_artists')
        .insert({ user_id: user.id, artist_id: artistId });
      
      if (!error) {
        setLikedArtists(prev => [...prev, artistId]);
        toast({ title: 'Artist followed!' });
      }
    }
  }, [user, likedArtists, toast]);

  // Create Playlist
  const createPlaylist = useCallback(async (name: string, description?: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('playlists')
      .insert({ user_id: user.id, name, description })
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error creating playlist', variant: 'destructive' });
      return null;
    }
    
    const playlist = data as Playlist;
    setPlaylists(prev => [...prev, playlist]);
    toast({ title: 'Playlist created!' });
    return playlist;
  }, [user, toast]);

  // Delete Playlist
  const deletePlaylist = useCallback(async (playlistId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', user.id);
    
    if (!error) {
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
      toast({ title: 'Playlist deleted' });
    }
  }, [user, toast]);

  // Add Song to Playlist
  const addSongToPlaylist = useCallback(async (playlistId: string, songId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('playlist_songs')
      .insert({ playlist_id: playlistId, song_id: songId });
    
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Song already in playlist' });
      } else {
        toast({ title: 'Error adding song', variant: 'destructive' });
      }
    } else {
      toast({ title: 'Song added to playlist!' });
    }
  }, [user, toast]);

  // Remove Song from Playlist
  const removeSongFromPlaylist = useCallback(async (playlistId: string, songId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('playlist_songs')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('song_id', songId);
    
    if (!error) {
      toast({ title: 'Song removed from playlist' });
    }
  }, [user, toast]);

  // Get Playlist Songs
  const getPlaylistSongs = useCallback(async (playlistId: string): Promise<string[]> => {
    const { data } = await supabase
      .from('playlist_songs')
      .select('song_id')
      .eq('playlist_id', playlistId)
      .order('position');
    
    return data?.map(s => s.song_id) || [];
  }, []);

  // Check if song is liked
  const isSongLiked = useCallback((songId: string) => likedSongs.includes(songId), [likedSongs]);
  
  // Check if artist is liked
  const isArtistLiked = useCallback((artistId: string) => likedArtists.includes(artistId), [likedArtists]);

  return {
    likedSongs,
    likedArtists,
    playlists,
    isLoading,
    toggleLikeSong,
    toggleLikeArtist,
    isSongLiked,
    isArtistLiked,
    createPlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    getPlaylistSongs,
  };
}
