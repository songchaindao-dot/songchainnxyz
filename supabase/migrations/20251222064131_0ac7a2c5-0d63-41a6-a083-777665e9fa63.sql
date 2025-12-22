-- Fix critical security issues

-- 1. Deny anonymous/unauthenticated SELECT on audience_profiles
CREATE POLICY "Block anonymous access to audience_profiles" 
ON public.audience_profiles 
FOR SELECT 
TO anon
USING (false);

-- 2. Restrict song_analytics so users can only view their own data
DROP POLICY IF EXISTS "Users can view all analytics" ON public.song_analytics;
DROP POLICY IF EXISTS "Anyone can view song analytics" ON public.song_analytics;

CREATE POLICY "Users can only view own analytics" 
ON public.song_analytics 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

-- 3. Restrict profile_views so users can only see views of their own profile
DROP POLICY IF EXISTS "Anyone can view profile views" ON public.profile_views;
DROP POLICY IF EXISTS "Users can view profile views" ON public.profile_views;

CREATE POLICY "Users can only view own profile views" 
ON public.profile_views 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM audience_profiles 
    WHERE audience_profiles.id = profile_views.profile_id 
    AND audience_profiles.user_id = auth.uid()
  )
);

-- 4. Restrict used_nonces to service role only (deny all user access)
DROP POLICY IF EXISTS "Allow nonce operations" ON public.used_nonces;

CREATE POLICY "Deny all user access to nonces" 
ON public.used_nonces 
FOR ALL 
USING (false);

-- 5. Restrict liked_songs to own user or public profiles
DROP POLICY IF EXISTS "Users can view all liked songs" ON public.liked_songs;

CREATE POLICY "Users can view own or public profile liked songs" 
ON public.liked_songs 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR EXISTS (
    SELECT 1 FROM audience_profiles 
    WHERE audience_profiles.user_id = liked_songs.user_id 
    AND audience_profiles.is_public = true
  )
);