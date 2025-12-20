-- Add is_public column to audience_profiles (default true for backward compatibility)
ALTER TABLE public.audience_profiles 
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- Drop the existing permissive SELECT policy
DROP POLICY IF EXISTS "Audience profiles are readable by authenticated users" ON public.audience_profiles;

-- Create a new policy that restricts profile visibility:
-- 1. Users can always view their own profile
-- 2. Users can view public profiles
-- 3. Users can view profiles of users they follow
CREATE POLICY "Users can view allowed profiles"
ON public.audience_profiles
FOR SELECT
USING (
  auth.uid() = user_id  -- Own profile
  OR is_public = true   -- Public profiles
  OR EXISTS (           -- Profiles of users they follow
    SELECT 1 FROM public.user_follows
    WHERE follower_id = auth.uid()
    AND following_id = audience_profiles.user_id
  )
);