CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'audience'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  -- Create audience role for new user
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'audience');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: audience_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audience_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    profile_name text NOT NULL,
    bio text,
    profile_picture_url text,
    cover_photo_url text,
    x_profile_link text,
    base_profile_link text,
    onboarding_completed boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: liked_artists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.liked_artists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    artist_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: liked_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.liked_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    song_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: playlist_songs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlist_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    playlist_id uuid NOT NULL,
    song_id text NOT NULL,
    "position" integer DEFAULT 0 NOT NULL,
    added_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: playlists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.playlists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    is_public boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: song_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.song_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    song_id text NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: used_nonces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.used_nonces (
    nonce text NOT NULL,
    used_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:10:00'::interval) NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'audience'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audience_profiles audience_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audience_profiles
    ADD CONSTRAINT audience_profiles_pkey PRIMARY KEY (id);


--
-- Name: audience_profiles audience_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audience_profiles
    ADD CONSTRAINT audience_profiles_user_id_key UNIQUE (user_id);


--
-- Name: liked_artists liked_artists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liked_artists
    ADD CONSTRAINT liked_artists_pkey PRIMARY KEY (id);


--
-- Name: liked_artists liked_artists_user_id_artist_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liked_artists
    ADD CONSTRAINT liked_artists_user_id_artist_id_key UNIQUE (user_id, artist_id);


--
-- Name: liked_songs liked_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liked_songs
    ADD CONSTRAINT liked_songs_pkey PRIMARY KEY (id);


--
-- Name: liked_songs liked_songs_user_id_song_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liked_songs
    ADD CONSTRAINT liked_songs_user_id_song_id_key UNIQUE (user_id, song_id);


--
-- Name: playlist_songs playlist_songs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_pkey PRIMARY KEY (id);


--
-- Name: playlist_songs playlist_songs_playlist_id_song_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_playlist_id_song_id_key UNIQUE (playlist_id, song_id);


--
-- Name: playlists playlists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_pkey PRIMARY KEY (id);


--
-- Name: song_comments song_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_comments
    ADD CONSTRAINT song_comments_pkey PRIMARY KEY (id);


--
-- Name: used_nonces used_nonces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.used_nonces
    ADD CONSTRAINT used_nonces_pkey PRIMARY KEY (nonce);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_used_nonces_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_used_nonces_expires_at ON public.used_nonces USING btree (expires_at);


--
-- Name: audience_profiles update_audience_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_audience_profiles_updated_at BEFORE UPDATE ON public.audience_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: playlists update_playlists_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: song_comments update_song_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_song_comments_updated_at BEFORE UPDATE ON public.song_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: audience_profiles audience_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audience_profiles
    ADD CONSTRAINT audience_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: liked_artists liked_artists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liked_artists
    ADD CONSTRAINT liked_artists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: liked_songs liked_songs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.liked_songs
    ADD CONSTRAINT liked_songs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: playlist_songs playlist_songs_playlist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlist_songs
    ADD CONSTRAINT playlist_songs_playlist_id_fkey FOREIGN KEY (playlist_id) REFERENCES public.playlists(id) ON DELETE CASCADE;


--
-- Name: playlists playlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.playlists
    ADD CONSTRAINT playlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: song_comments song_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.song_comments
    ADD CONSTRAINT song_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles Admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage all roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: audience_profiles Audience profiles are readable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Audience profiles are readable by authenticated users" ON public.audience_profiles FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: song_comments Comments are readable by authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Comments are readable by authenticated users" ON public.song_comments FOR SELECT USING ((auth.uid() IS NOT NULL));


--
-- Name: playlist_songs Users can add songs to their playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can add songs to their playlists" ON public.playlist_songs FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.playlists
  WHERE ((playlists.id = playlist_songs.playlist_id) AND (playlists.user_id = auth.uid())))));


--
-- Name: song_comments Users can create comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create comments" ON public.song_comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: playlists Users can create playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create playlists" ON public.playlists FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: audience_profiles Users can create their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create their own profile" ON public.audience_profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: song_comments Users can delete their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own comments" ON public.song_comments FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: playlists Users can delete their own playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete their own playlists" ON public.playlists FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: liked_artists Users can like artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can like artists" ON public.liked_artists FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: liked_songs Users can like songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can like songs" ON public.liked_songs FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: playlist_songs Users can remove songs from their playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can remove songs from their playlists" ON public.playlist_songs FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.playlists
  WHERE ((playlists.id = playlist_songs.playlist_id) AND (playlists.user_id = auth.uid())))));


--
-- Name: liked_artists Users can unlike artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike artists" ON public.liked_artists FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: liked_songs Users can unlike songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can unlike songs" ON public.liked_songs FOR DELETE USING ((auth.uid() = user_id));


--
-- Name: playlist_songs Users can update songs in their playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update songs in their playlists" ON public.playlist_songs FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.playlists
  WHERE ((playlists.id = playlist_songs.playlist_id) AND (playlists.user_id = auth.uid())))));


--
-- Name: song_comments Users can update their own comments; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own comments" ON public.song_comments FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: playlists Users can update their own playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own playlists" ON public.playlists FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: audience_profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.audience_profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: playlist_songs Users can view playlist songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view playlist songs" ON public.playlist_songs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.playlists
  WHERE ((playlists.id = playlist_songs.playlist_id) AND ((playlists.user_id = auth.uid()) OR (playlists.is_public = true))))));


--
-- Name: liked_artists Users can view their own liked artists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own liked artists" ON public.liked_artists FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: liked_songs Users can view their own liked songs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own liked songs" ON public.liked_songs FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: playlists Users can view their own playlists; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own playlists" ON public.playlists FOR SELECT USING (((auth.uid() = user_id) OR (is_public = true)));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: audience_profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audience_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: liked_artists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.liked_artists ENABLE ROW LEVEL SECURITY;

--
-- Name: liked_songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.liked_songs ENABLE ROW LEVEL SECURITY;

--
-- Name: playlist_songs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.playlist_songs ENABLE ROW LEVEL SECURITY;

--
-- Name: playlists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

--
-- Name: song_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.song_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: used_nonces; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.used_nonces ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;