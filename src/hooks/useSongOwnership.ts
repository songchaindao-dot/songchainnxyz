import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  isOnChainSong,
  getOnChainSongData,
  checkSongBalance,
  getOfflinePlays,
  setOfflinePlays,
  decrementOfflinePlays,
  hasUsedPreview,
  markPreviewUsed,
  buySong,
  parseEthToWei,
  getPreviewTime,
  getPreviewThreshold,
  clearPreviewData
} from '@/lib/songRegistry';

export type OwnershipStatus = 'free' | 'preview' | 'preview_used' | 'owned' | 'offline_ready';

interface SongOwnership {
  status: OwnershipStatus;
  balance: bigint;
  offlinePlaysRemaining: number;
  previewSecondsRemaining: number;
  isLoading: boolean;
  canPlay: boolean;
  isPreviewOnly: boolean;
  isLocked: boolean;
  checkOwnership: () => Promise<void>;
  unlockSong: (ethAmount: string, walletAddressOverride?: string, onStatusUpdate?: (status: string) => void) => Promise<{ success: boolean; error?: string }>;
  recordPreviewPlay: () => void;
  recordOfflinePlay: () => number;
}

/**
 * Hook to manage song ownership state and playback permissions
 * Checks on-chain balance and enforces streaming rules
 */
export function useSongOwnership(songId: string): SongOwnership {
  const { user } = useAuth();
  const [balance, setBalance] = useState<bigint>(BigInt(0));
  const [offlinePlaysRemaining, setOfflinePlaysRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUsed, setPreviewUsed] = useState(false);
  const [previewTimeUsed, setPreviewTimeUsed] = useState(0);
  
  // Get user's wallet address (stored in audience_profiles or from session)
  const userAddress = user?.user_metadata?.wallet_address;
  
  // Check if this song requires on-chain ownership
  const isTokenGated = isOnChainSong(songId);
  
  // Calculate remaining preview seconds
  const previewThreshold = getPreviewThreshold();
  const previewSecondsRemaining = Math.max(0, previewThreshold - previewTimeUsed);
  
  // Determine ownership status
  const getStatus = useCallback((): OwnershipStatus => {
    if (!isTokenGated) return 'free';
    
    if (balance > BigInt(0)) {
      const offlinePlays = getOfflinePlays(songId);
      if (offlinePlays > 0) return 'offline_ready';
      return 'owned';
    }
    
    if (previewUsed || hasUsedPreview(songId, userAddress)) {
      return 'preview_used';
    }
    
    return 'preview';
  }, [isTokenGated, balance, previewUsed, songId, userAddress]);
  
  const status = getStatus();
  
  // Strict locking: if preview is used, block all playback
  const isLocked = status === 'preview_used';
  
  // Determine if user can play - NO if preview is exhausted
  const canPlay = status === 'free' || status === 'owned' || status === 'offline_ready' || status === 'preview';
  const isPreviewOnly = status === 'preview';
  
  // Check on-chain ownership
  const checkOwnership = useCallback(async () => {
    if (!isTokenGated || !userAddress) {
      setBalance(BigInt(0));
      return;
    }
    
    setIsLoading(true);
    try {
      const onChainBalance = await checkSongBalance(userAddress, songId);
      setBalance(onChainBalance);
      
      // If user owns tokens worth $1+, grant offline plays
      // For now, assume any balance > 0 qualifies
      if (onChainBalance > BigInt(0)) {
        const currentOffline = getOfflinePlays(songId);
        if (currentOffline === 0) {
          // Grant 1000 offline plays
          setOfflinePlays(songId, 1000);
          setOfflinePlaysRemaining(1000);
        } else {
          setOfflinePlaysRemaining(currentOffline);
        }
      }
    } catch (error) {
      console.error('Error checking song ownership:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isTokenGated, userAddress, songId]);
  
  // Check preview status on mount and sync state
  useEffect(() => {
    if (isTokenGated) {
      setPreviewUsed(hasUsedPreview(songId, userAddress));
      setOfflinePlaysRemaining(getOfflinePlays(songId));
      setPreviewTimeUsed(getPreviewTime(songId, userAddress));
    }
  }, [isTokenGated, songId, userAddress]);
  
  // Check ownership on mount and when wallet changes
  useEffect(() => {
    if (userAddress && isTokenGated) {
      checkOwnership();
    }
  }, [userAddress, isTokenGated, checkOwnership]);
  
  // Purchase/unlock song - accepts optional wallet address and status callback
  const unlockSong = useCallback(async (
    ethAmount: string, 
    walletAddressOverride?: string,
    onStatusUpdate?: (status: string) => void
  ): Promise<{ success: boolean; error?: string }> => {
    if (!isTokenGated) {
      return { success: false, error: 'Song is not token-gated' };
    }
    
    // Use override address if provided (for freshly connected wallets), otherwise use context address
    const addressToUse = walletAddressOverride || userAddress;
    
    if (!addressToUse) {
      return { success: false, error: 'Please connect your wallet first' };
    }
    
    const priceWei = parseEthToWei(ethAmount);
    
    // Pass status callback to buySong for real-time updates
    const result = await buySong(songId, 1, priceWei, onStatusUpdate);
    
    if (result.success) {
      onStatusUpdate?.('Finalizing...');
      // Clear preview data since user now owns the song
      clearPreviewData(songId, addressToUse);
      setPreviewUsed(false);
      setPreviewTimeUsed(0);
      // Refresh balance
      await checkOwnership();
    }
    
    return result;
  }, [isTokenGated, userAddress, songId, checkOwnership]);
  
  // Record that preview was used
  const recordPreviewPlay = useCallback(() => {
    if (isTokenGated && status === 'preview') {
      markPreviewUsed(songId, userAddress);
      setPreviewUsed(true);
    }
  }, [isTokenGated, status, songId, userAddress]);
  
  // Record offline play and decrement counter
  const recordOfflinePlay = useCallback((): number => {
    if (!isTokenGated || status !== 'offline_ready') return 0;
    
    const remaining = decrementOfflinePlays(songId);
    setOfflinePlaysRemaining(remaining);
    return remaining;
  }, [isTokenGated, status, songId]);
  
  return {
    status,
    balance,
    offlinePlaysRemaining,
    previewSecondsRemaining,
    isLoading,
    canPlay,
    isPreviewOnly,
    isLocked,
    checkOwnership,
    unlockSong,
    recordPreviewPlay,
    recordOfflinePlay
  };
}

/**
 * Get display text for ownership status
 */
export function getOwnershipLabel(status: OwnershipStatus, offlinePlays?: number): string {
  switch (status) {
    case 'free':
      return '';
    case 'preview':
      return 'Preview';
    case 'preview_used':
      return 'Unlock to Play';
    case 'owned':
      return 'Owned';
    case 'offline_ready':
      return `Offline Ready (${offlinePlays} plays)`;
    default:
      return '';
  }
}
