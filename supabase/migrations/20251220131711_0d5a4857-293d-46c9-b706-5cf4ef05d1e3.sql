-- Song Analytics Table - tracks plays, shares, and views per song
CREATE TABLE public.song_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id text NOT NULL,
  user_id uuid,
  event_type text NOT NULL CHECK (event_type IN ('play', 'share', 'view')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_song_analytics_song_id ON public.song_analytics(song_id);
CREATE INDEX idx_song_analytics_event_type ON public.song_analytics(event_type);
CREATE INDEX idx_song_analytics_created_at ON public.song_analytics(created_at);

-- Enable RLS
ALTER TABLE public.song_analytics ENABLE ROW LEVEL SECURITY;

-- Anyone can view analytics (for displaying counts)
CREATE POLICY "Song analytics are viewable by authenticated users"
ON public.song_analytics FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Authenticated users can log events
CREATE POLICY "Authenticated users can log song events"
ON public.song_analytics FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Profile Views Table - tracks profile visits
CREATE TABLE public.profile_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.audience_profiles(id) ON DELETE CASCADE,
  viewer_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_profile_views_profile_id ON public.profile_views(profile_id);
CREATE INDEX idx_profile_views_created_at ON public.profile_views(created_at);

-- Enable RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Anyone can view profile view counts
CREATE POLICY "Profile views are viewable by authenticated users"
ON public.profile_views FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Authenticated users can log profile views
CREATE POLICY "Authenticated users can log profile views"
ON public.profile_views FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Song Popularity View - aggregates all metrics for ranking
CREATE OR REPLACE VIEW public.song_popularity AS
SELECT 
  song_id,
  COALESCE(plays, 0) as play_count,
  COALESCE(shares, 0) as share_count,
  COALESCE(views, 0) as view_count,
  COALESCE(likes, 0) as like_count,
  COALESCE(comments, 0) as comment_count,
  -- Weighted popularity score: plays(3x) + likes(5x) + comments(4x) + shares(6x) + views(1x)
  (COALESCE(plays, 0) * 3 + 
   COALESCE(likes, 0) * 5 + 
   COALESCE(comments, 0) * 4 + 
   COALESCE(shares, 0) * 6 + 
   COALESCE(views, 0) * 1) as popularity_score
FROM (
  SELECT DISTINCT song_id FROM public.song_analytics
  UNION
  SELECT DISTINCT song_id FROM public.liked_songs
  UNION
  SELECT DISTINCT song_id FROM public.song_comments
) all_songs
LEFT JOIN (
  SELECT song_id, COUNT(*) as plays 
  FROM public.song_analytics 
  WHERE event_type = 'play' 
  GROUP BY song_id
) p USING (song_id)
LEFT JOIN (
  SELECT song_id, COUNT(*) as shares 
  FROM public.song_analytics 
  WHERE event_type = 'share' 
  GROUP BY song_id
) s USING (song_id)
LEFT JOIN (
  SELECT song_id, COUNT(*) as views 
  FROM public.song_analytics 
  WHERE event_type = 'view' 
  GROUP BY song_id
) v USING (song_id)
LEFT JOIN (
  SELECT song_id, COUNT(*) as likes 
  FROM public.liked_songs 
  GROUP BY song_id
) l USING (song_id)
LEFT JOIN (
  SELECT song_id, COUNT(*) as comments 
  FROM public.song_comments 
  GROUP BY song_id
) c USING (song_id)
ORDER BY popularity_score DESC;

-- Profile Popularity View - aggregates all metrics for ranking
CREATE OR REPLACE VIEW public.profile_popularity AS
SELECT 
  ap.id as profile_id,
  ap.user_id,
  ap.profile_name,
  ap.profile_picture_url,
  ap.bio,
  COALESCE(views, 0) as view_count,
  COALESCE(followers, 0) as follower_count,
  COALESCE(posts, 0) as post_count,
  COALESCE(post_likes, 0) as total_post_likes,
  -- Weighted popularity score: followers(5x) + views(1x) + posts(2x) + post_likes(3x)
  (COALESCE(followers, 0) * 5 + 
   COALESCE(views, 0) * 1 + 
   COALESCE(posts, 0) * 2 + 
   COALESCE(post_likes, 0) * 3) as popularity_score
FROM public.audience_profiles ap
LEFT JOIN (
  SELECT profile_id, COUNT(*) as views 
  FROM public.profile_views 
  GROUP BY profile_id
) pv ON pv.profile_id = ap.id
LEFT JOIN (
  SELECT following_id, COUNT(*) as followers 
  FROM public.user_follows 
  GROUP BY following_id
) uf ON uf.following_id = ap.user_id
LEFT JOIN (
  SELECT user_id, COUNT(*) as posts 
  FROM public.social_posts 
  GROUP BY user_id
) sp ON sp.user_id = ap.user_id
LEFT JOIN (
  SELECT sp.user_id, COUNT(pl.id) as post_likes
  FROM public.social_posts sp
  JOIN public.post_likes pl ON pl.post_id = sp.id
  GROUP BY sp.user_id
) pl ON pl.user_id = ap.user_id
WHERE ap.onboarding_completed = true
ORDER BY popularity_score DESC;