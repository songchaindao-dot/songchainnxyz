-- Drop restrictive SELECT policies and create public read policies for aggregation
DROP POLICY IF EXISTS "Users can view their own song analytics" ON public.song_analytics;
DROP POLICY IF EXISTS "Users can view their own liked songs" ON public.liked_songs;

-- Allow all authenticated users to read song analytics for universal stats
CREATE POLICY "Authenticated users can view all song analytics" 
ON public.song_analytics 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow all authenticated users to read liked songs for universal stats
CREATE POLICY "Authenticated users can view all liked songs" 
ON public.liked_songs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);