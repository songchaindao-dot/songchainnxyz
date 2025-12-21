-- Add location column to audience_profiles
ALTER TABLE public.audience_profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add a comment for clarity
COMMENT ON COLUMN public.audience_profiles.location IS 'User listening location (city, country)';