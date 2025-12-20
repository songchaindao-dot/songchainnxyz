-- Fix security definer views by recreating them with SECURITY INVOKER
DROP VIEW IF EXISTS public.song_popularity;
DROP VIEW IF EXISTS public.profile_popularity;

-- Song Popularity View with SECURITY INVOKER
CREATE VIEW public.song_popularity 
WITH (security_invoker = true)
AS
SELECT 
  song_id,
  COALESCE(plays, 0)::bigint as play_count,
  COALESCE(shares, 0)::bigint as share_count,
  COALESCE(views, 0)::bigint as view_count,
  COALESCE(likes, 0)::bigint as like_count,
  COALESCE(comments, 0)::bigint as comment_count,
  (COALESCE(plays, 0) * 3 + 
   COALESCE(likes, 0) * 5 + 
   COALESCE(comments, 0) * 4 + 
   COALESCE(shares, 0) * 6 + 
   COALESCE(views, 0) * 1)::bigint as popularity_score
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
) c USING (song_id);

-- Profile Popularity View with SECURITY INVOKER
CREATE VIEW public.profile_popularity
WITH (security_invoker = true)
AS
SELECT 
  ap.id as profile_id,
  ap.user_id,
  ap.profile_name,
  ap.profile_picture_url,
  ap.bio,
  COALESCE(views, 0)::bigint as view_count,
  COALESCE(followers, 0)::bigint as follower_count,
  COALESCE(posts, 0)::bigint as post_count,
  COALESCE(post_likes, 0)::bigint as total_post_likes,
  (COALESCE(followers, 0) * 5 + 
   COALESCE(views, 0) * 1 + 
   COALESCE(posts, 0) * 2 + 
   COALESCE(post_likes, 0) * 3)::bigint as popularity_score
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
WHERE ap.onboarding_completed = true;