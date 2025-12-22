-- Fix security definer view issue by setting to invoker security
ALTER VIEW public.song_popularity SET (security_invoker = on);