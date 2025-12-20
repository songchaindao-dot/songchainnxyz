-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Song analytics are viewable by authenticated users" ON public.song_analytics;

-- Create a new policy that only allows users to view their own analytics
CREATE POLICY "Users can view their own song analytics"
ON public.song_analytics
FOR SELECT
USING (auth.uid() = user_id);