-- Add new post types: 'welcome' and 'song_like'
-- The post_type column already exists as text, so we can use any value

-- Create a function that creates a welcome post when a new profile is created
CREATE OR REPLACE FUNCTION public.create_welcome_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.social_posts (user_id, content, post_type)
  VALUES (
    NEW.user_id,
    NEW.profile_name || ' just joined $ongChainn!',
    'welcome'
  );
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create welcome post on profile creation
DROP TRIGGER IF EXISTS on_profile_created ON public.audience_profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.audience_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_welcome_post();

-- Create a function that creates a song reaction post when a song is liked
CREATE OR REPLACE FUNCTION public.create_song_like_post()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_name TEXT;
BEGIN
  -- Get the user's profile name
  SELECT profile_name INTO v_profile_name
  FROM public.audience_profiles
  WHERE user_id = NEW.user_id;
  
  -- Create a post about liking the song
  INSERT INTO public.social_posts (user_id, content, post_type, song_id)
  VALUES (
    NEW.user_id,
    COALESCE(v_profile_name, 'Someone') || ' liked a song',
    'song_like',
    NEW.song_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create song like post
DROP TRIGGER IF EXISTS on_song_liked ON public.liked_songs;
CREATE TRIGGER on_song_liked
  AFTER INSERT ON public.liked_songs
  FOR EACH ROW
  EXECUTE FUNCTION public.create_song_like_post();

-- Enable realtime for social_posts to get live feed updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_posts;