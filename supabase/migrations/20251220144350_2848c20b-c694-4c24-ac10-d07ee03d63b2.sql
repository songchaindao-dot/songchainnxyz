-- For views, we use security_invoker to ensure the view respects RLS of underlying tables
-- However, since the view aggregates from audience_profiles which requires auth, 
-- we need to create a security barrier view that checks authentication

-- Drop the existing view
DROP VIEW IF EXISTS public.profile_popularity;

-- Recreate the view with security_invoker = true
-- This ensures the view runs with the permissions of the calling user, not the view owner
CREATE VIEW public.profile_popularity
WITH (security_invoker = true)
AS
SELECT 
  ap.id AS profile_id,
  ap.user_id,
  ap.profile_name,
  ap.profile_picture_url,
  ap.bio,
  (SELECT COUNT(*) FROM public.profile_views pv WHERE pv.profile_id = ap.id) AS view_count,
  (SELECT COUNT(*) FROM public.user_follows uf WHERE uf.following_id = ap.user_id) AS follower_count,
  (SELECT COUNT(*) FROM public.social_posts sp WHERE sp.user_id = ap.user_id) AS post_count,
  (SELECT COALESCE(SUM(like_count), 0) FROM (
    SELECT COUNT(*) AS like_count 
    FROM public.post_likes pl 
    JOIN public.social_posts sp ON pl.post_id = sp.id 
    WHERE sp.user_id = ap.user_id
    GROUP BY sp.id
  ) likes) AS total_post_likes,
  (
    (SELECT COUNT(*) FROM public.profile_views pv WHERE pv.profile_id = ap.id) +
    (SELECT COUNT(*) FROM public.user_follows uf WHERE uf.following_id = ap.user_id) * 3 +
    (SELECT COUNT(*) FROM public.social_posts sp WHERE sp.user_id = ap.user_id) * 2 +
    (SELECT COALESCE(SUM(like_count), 0) FROM (
      SELECT COUNT(*) AS like_count 
      FROM public.post_likes pl 
      JOIN public.social_posts sp ON pl.post_id = sp.id 
      WHERE sp.user_id = ap.user_id
      GROUP BY sp.id
    ) likes)
  ) AS popularity_score
FROM public.audience_profiles ap;