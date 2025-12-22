-- Drop the old check constraint and create a new one that includes all post types
ALTER TABLE public.social_posts DROP CONSTRAINT IF EXISTS social_posts_post_type_check;

ALTER TABLE public.social_posts ADD CONSTRAINT social_posts_post_type_check 
CHECK (post_type IN ('text', 'song_share', 'playlist_share', 'listening', 'welcome', 'song_like'));