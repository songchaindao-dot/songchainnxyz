import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

interface ShareOptions {
  title: string;
  text: string;
  url: string;
}

export function useShare() {
  const [copied, setCopied] = useState(false);

  const getShareUrl = useCallback((type: 'song' | 'post' | 'artist' | 'profile', id: string) => {
    const baseUrl = window.location.origin;
    switch (type) {
      case 'song':
        return `${baseUrl}/song/${id}`;
      case 'post':
        return `${baseUrl}/post/${id}`;
      case 'artist':
        return `${baseUrl}/artist/${id}`;
      case 'profile':
        return `${baseUrl}/audience/${id}`;
      default:
        return baseUrl;
    }
  }, []);

  const getSongShareUrl = useCallback((song: { id: string; title?: string; artist?: string; coverImage?: string }) => {
    const url = new URL(getShareUrl('song', song.id));
    if (song.title) url.searchParams.set('title', song.title);
    if (song.artist) url.searchParams.set('artist', song.artist);
    if (song.coverImage) url.searchParams.set('img', song.coverImage);
    return url.toString();
  }, [getShareUrl]);

  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: 'Link copied to clipboard!' });
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
      return false;
    }
  }, []);

  const nativeShare = useCallback(async (options: ShareOptions) => {
    if (navigator.share) {
      try {
        await navigator.share(options);
        return true;
      } catch {
        // User cancelled or error - fallback to copy
        return copyToClipboard(options.url);
      }
    } else {
      return copyToClipboard(options.url);
    }
  }, [copyToClipboard]);

  const shareToX = useCallback((text: string, url: string) => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'width=600,height=400');
  }, []);

  const sharePost = useCallback(async (postId: string, content?: string) => {
    const url = getShareUrl('post', postId);
    return nativeShare({
      title: 'Check out this post on $ongChainn!',
      text: content || 'Check out this post on $ongChainn!',
      url,
    });
  }, [getShareUrl, nativeShare]);

  const shareSong = useCallback(async (songTitle: string, artistName: string, songId: string, coverImage?: string) => {
    const url = getSongShareUrl({ id: songId, title: songTitle, artist: artistName, coverImage });
    return nativeShare({
      title: `${songTitle} - ${artistName}`,
      text: `Check out "${songTitle}" by ${artistName} on $ongChainn!`,
      url,
    });
  }, [getSongShareUrl, nativeShare]);

  const shareProfile = useCallback(async (profileName: string, userId: string) => {
    const url = getShareUrl('profile', userId);
    return nativeShare({
      title: `${profileName} on $ongChainn`,
      text: `Check out ${profileName}'s profile on $ongChainn!`,
      url,
    });
  }, [getShareUrl, nativeShare]);

  return {
    copied,
    getShareUrl,
    getSongShareUrl,
    copyToClipboard,
    nativeShare,
    shareToX,
    sharePost,
    shareSong,
    shareProfile,
  };
}
