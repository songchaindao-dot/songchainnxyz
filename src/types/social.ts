import { Tables } from '@/integrations/supabase/types';

export type AudienceProfile = Tables<'audience_profiles'>;

export interface SocialPost {
  id: string;
  user_id: string;
  content: string | null;
  song_id: string | null;
  playlist_id: string | null;
  post_type: 'text' | 'song_share' | 'playlist_share' | 'listening';
  created_at: string;
  updated_at: string;
}

export interface SocialPostWithProfile extends SocialPost {
  profile?: AudienceProfile;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
}

export interface UserFollow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface PostLike {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  user_id: string;
  post_id: string;
  content: string;
  created_at: string;
  profile?: AudienceProfile;
  likes_count?: number;
  is_liked?: boolean;
}

export interface CommentLike {
  id: string;
  comment_id: string;
  user_id: string;
  created_at: string;
}

export interface PlaylistCollaborator {
  id: string;
  playlist_id: string;
  user_id: string;
  can_edit: boolean;
  created_at: string;
  profile?: AudienceProfile;
}

// Re-export types that were in database.ts
export type LikedSong = Tables<'liked_songs'>;
export type LikedArtist = Tables<'liked_artists'>;
export type Playlist = Tables<'playlists'>;
export type PlaylistSong = Tables<'playlist_songs'>;
export type SongComment = Tables<'song_comments'>;
export type UserRole = Tables<'user_roles'>;
export type AppRole = 'admin' | 'audience';
