-- Revoke public access to song_popularity view
REVOKE ALL ON public.song_popularity FROM anon;
REVOKE ALL ON public.song_popularity FROM public;

-- Grant access only to authenticated users
GRANT SELECT ON public.song_popularity TO authenticated;