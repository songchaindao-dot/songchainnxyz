-- Enable RLS on the song_popularity view
ALTER VIEW public.song_popularity SET (security_invoker = on);

-- For additional protection, we'll create a secure function to access song popularity
-- This ensures only authenticated users can query the data

CREATE OR REPLACE FUNCTION public.get_song_popularity()
RETURNS TABLE (
  song_id text,
  play_count bigint,
  like_count bigint,
  comment_count bigint,
  share_count bigint,
  view_count bigint,
  popularity_score bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    song_id,
    play_count,
    like_count,
    comment_count,
    share_count,
    view_count,
    popularity_score
  FROM public.song_popularity
  WHERE auth.uid() IS NOT NULL
$$;

-- Grant execute permission to authenticated users only
REVOKE ALL ON FUNCTION public.get_song_popularity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_song_popularity() TO authenticated;