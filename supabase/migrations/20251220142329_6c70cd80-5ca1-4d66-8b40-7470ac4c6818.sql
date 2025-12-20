-- Drop the overly permissive policy that exposes user IDs
DROP POLICY IF EXISTS "Anyone can view referral codes for signup" ON public.referrals;

-- Create a more restrictive policy that only allows looking up if a referral_code exists
-- This uses a function to validate codes without exposing user data
CREATE OR REPLACE FUNCTION public.validate_referral_code(code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.referrals
    WHERE referral_code = code
      AND status = 'pending'
  )
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;