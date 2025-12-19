import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { SongComment, AudienceProfile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface CommentWithProfile extends SongComment {
  profile?: AudienceProfile;
}

export function useComments(songId: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<CommentWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    
    const { data: commentsData } = await supabase
      .from('song_comments')
      .select('*')
      .eq('song_id', songId)
      .order('created_at', { ascending: false });
    
    if (commentsData && commentsData.length > 0) {
      // Fetch profiles for commenters
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from('audience_profiles')
        .select('*')
        .in('user_id', userIds);
      
      const profilesMap = new Map(
        profilesData?.map(p => [p.user_id, p as AudienceProfile]) || []
      );
      
      const commentsWithProfiles: CommentWithProfile[] = commentsData.map(c => ({
        ...c as SongComment,
        profile: profilesMap.get(c.user_id)
      }));
      
      setComments(commentsWithProfiles);
    } else {
      setComments([]);
    }
    
    setIsLoading(false);
  }, [songId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(async (content: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('song_comments')
      .insert({ user_id: user.id, song_id: songId, content })
      .select()
      .single();
    
    if (error) {
      toast({ title: 'Error posting comment', variant: 'destructive' });
      return;
    }
    
    // Refetch to get profile info
    await fetchComments();
    toast({ title: 'Comment posted!' });
  }, [user, songId, toast, fetchComments]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('song_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);
    
    if (!error) {
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({ title: 'Comment deleted' });
    }
  }, [user, toast]);

  return {
    comments,
    isLoading,
    addComment,
    deleteComment,
    refetch: fetchComments
  };
}
