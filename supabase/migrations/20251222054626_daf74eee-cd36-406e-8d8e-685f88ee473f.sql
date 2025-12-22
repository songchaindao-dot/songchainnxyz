-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view allowed profiles" ON public.audience_profiles;

-- Create new policy that requires authentication for all access
CREATE POLICY "Users can view allowed profiles" 
ON public.audience_profiles 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id 
    OR is_public = true 
    OR EXISTS (
      SELECT 1 FROM user_follows 
      WHERE user_follows.follower_id = auth.uid() 
      AND user_follows.following_id = audience_profiles.user_id
    )
  )
);