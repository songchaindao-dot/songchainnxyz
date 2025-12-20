
-- Create social posts table for timeline
CREATE TABLE public.social_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT,
  song_id TEXT,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
  post_type TEXT NOT NULL DEFAULT 'text' CHECK (post_type IN ('text', 'song_share', 'playlist_share', 'listening')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user follows table
CREATE TABLE public.user_follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Create post likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Create post comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collaborative playlist members table
CREATE TABLE public.playlist_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  can_edit BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_collaborators ENABLE ROW LEVEL SECURITY;

-- Social posts policies
CREATE POLICY "Posts are readable by authenticated users" 
ON public.social_posts FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create their own posts" 
ON public.social_posts FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.social_posts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.social_posts FOR DELETE 
USING (auth.uid() = user_id);

-- User follows policies
CREATE POLICY "Follows are readable by authenticated users" 
ON public.user_follows FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can follow others" 
ON public.user_follows FOR INSERT 
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow" 
ON public.user_follows FOR DELETE 
USING (auth.uid() = follower_id);

-- Post likes policies
CREATE POLICY "Likes are readable by authenticated users" 
ON public.post_likes FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can like posts" 
ON public.post_likes FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" 
ON public.post_likes FOR DELETE 
USING (auth.uid() = user_id);

-- Post comments policies
CREATE POLICY "Comments are readable by authenticated users" 
ON public.post_comments FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create comments" 
ON public.post_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments FOR DELETE 
USING (auth.uid() = user_id);

-- Playlist collaborators policies
CREATE POLICY "Collaborators are viewable by authenticated users" 
ON public.playlist_collaborators FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Playlist owners can add collaborators" 
ON public.playlist_collaborators FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM playlists 
  WHERE playlists.id = playlist_collaborators.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Playlist owners can remove collaborators" 
ON public.playlist_collaborators FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM playlists 
  WHERE playlists.id = playlist_collaborators.playlist_id 
  AND playlists.user_id = auth.uid()
) OR auth.uid() = user_id);

-- Add is_collaborative column to playlists
ALTER TABLE public.playlists ADD COLUMN is_collaborative BOOLEAN NOT NULL DEFAULT false;

-- Update playlist_songs policy to allow collaborators
DROP POLICY IF EXISTS "Users can add songs to their playlists" ON public.playlist_songs;
CREATE POLICY "Users can add songs to their playlists" 
ON public.playlist_songs FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM playlists 
    WHERE playlists.id = playlist_songs.playlist_id 
    AND (playlists.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM playlist_collaborators 
      WHERE playlist_collaborators.playlist_id = playlists.id 
      AND playlist_collaborators.user_id = auth.uid()
    ))
  )
);

-- Trigger for updated_at on social_posts
CREATE TRIGGER update_social_posts_updated_at
BEFORE UPDATE ON public.social_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
