import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { AudienceProfile } from '@/types/database';
import { toast } from '@/hooks/use-toast';

export interface SongComment {
  id: string;
  song_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: AudienceProfile;
}

export function useSongComments(songId: string) {
  const { user } = useAuth();
  const [comments, setComments] = useState<SongComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!songId) return;
    
    setIsLoading(true);
    
    const { data: commentsData, error } = await supabase
      .from('song_comments')
      .select('*')
      .eq('song_id', songId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching comments:', error);
      setIsLoading(false);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    // Fetch user profiles
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profilesData } = await supabase
      .from('audience_profiles')
      .select('*')
      .in('user_id', userIds);

    const profilesMap = new Map(
      profilesData?.map(p => [p.user_id, p as AudienceProfile]) || []
    );

    const enrichedComments: SongComment[] = commentsData.map(c => ({
      ...c,
      profile: profilesMap.get(c.user_id),
    }));

    setComments(enrichedComments);
    setIsLoading(false);
  }, [songId]);

  const addComment = useCallback(async (content: string) => {
    if (!user || !songId || !content.trim()) return false;

    const { data, error } = await supabase
      .from('song_comments')
      .insert({ 
        song_id: songId, 
        user_id: user.id, 
        content: content.trim() 
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error adding comment', variant: 'destructive' });
      return false;
    }

    // Fetch user's profile for the new comment
    const { data: profileData } = await supabase
      .from('audience_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const newComment: SongComment = {
      ...data,
      profile: profileData as AudienceProfile,
    };

    setComments(prev => [newComment, ...prev]);
    toast({ title: 'Comment added!' });
    return true;
  }, [user, songId]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('song_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Error deleting comment', variant: 'destructive' });
      return false;
    }

    setComments(prev => prev.filter(c => c.id !== commentId));
    toast({ title: 'Comment deleted' });
    return true;
  }, [user]);

  return {
    comments,
    isLoading,
    fetchComments,
    addComment,
    deleteComment,
  };
}