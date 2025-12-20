-- Enable realtime for tables that affect popularity scores
ALTER PUBLICATION supabase_realtime ADD TABLE public.song_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.liked_songs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_views;