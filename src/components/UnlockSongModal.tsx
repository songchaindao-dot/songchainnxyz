import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Unlock, Loader2, ExternalLink, Music, Wallet, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Song } from '@/data/musicData';
import { formatEthPrice } from '@/lib/songRegistry';
import { connectWallet, hasWalletProvider } from '@/lib/baseWallet';
import { toast } from 'sonner';

interface UnlockSongModalProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (ethAmount: string) => Promise<{ success: boolean; error?: string }>;
  walletAddress?: string;
  onWalletConnected?: (address: string) => void;
}

// Default price in Wei (0.001 ETH for testing)
const DEFAULT_PRICE_WEI = "1000000000000000";

export function UnlockSongModal({
  song,
  isOpen,
  onClose,
  onUnlock,
  walletAddress,
  onWalletConnected
}: UnlockSongModalProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState(walletAddress);

  const priceEth = formatEthPrice(DEFAULT_PRICE_WEI);
  const hasWallet = hasWalletProvider();
  const isConnected = !!connectedAddress;

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await connectWallet();
      if (result.success && result.address) {
        setConnectedAddress(result.address);
        onWalletConnected?.(result.address);
        toast.success('Wallet connected!');
      } else {
        setError(result.error || 'Failed to connect wallet');
      }
    } catch (err: any) {
      setError(err?.message || 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleUnlock = async () => {
    if (!isConnected) {
      await handleConnectWallet();
      return;
    }

    setIsUnlocking(true);
    setError(null);

    try {
      const result = await onUnlock(priceEth);
      if (result.success) {
        setSuccess(true);
        toast.success('Song unlocked! You now have full access.');
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 2000);
      } else {
        setError(result.error || 'Failed to unlock song');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
    } finally {
      setIsUnlocking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-card border border-border rounded-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative">
            <div className="absolute inset-0 gradient-primary opacity-20" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-background/50 hover:bg-background/80 transition-colors z-10"
            >
              <X size={20} />
            </button>
            
            <div className="p-6 pt-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden shadow-glow">
                {song.coverImage ? (
                  <img
                    src={song.coverImage}
                    alt={song.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Music size={32} className="text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold mb-1">{song.title}</h2>
              <p className="text-muted-foreground">{song.artist}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-0">
            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-8"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Unlock size={32} className="text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-green-500">Song Unlocked!</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  You now have unlimited streaming access
                </p>
              </motion.div>
            ) : (
              <>
                {/* Token Info */}
                <div className="bg-muted/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Token Contract</span>
                    <a
                      href={`https://basescan.org/address/${song.tokenAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      View on BaseScan
                      <ExternalLink size={12} />
                    </a>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Song ID</span>
                      <span className="font-mono">{song.onChainId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Artist Wallet</span>
                      <span className="font-mono text-xs">
                        {song.artistWallet?.slice(0, 6)}...{song.artistWallet?.slice(-4)}
                      </span>
                    </div>
                    {isConnected && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Your Wallet</span>
                        <span className="font-mono text-xs text-primary">
                          {connectedAddress?.slice(0, 6)}...{connectedAddress?.slice(-4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* What you get */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-sm font-medium">What you get:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Unlimited streaming access
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      1,000 offline plays
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Support the artist directly (95% goes to them)
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Own the song token on Base
                    </li>
                  </ul>
                </div>

                {/* No wallet warning */}
                {!hasWallet && (
                  <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">No wallet detected</p>
                      <p className="text-xs mt-1 text-amber-500/80">
                        Install MetaMask, Coinbase Wallet, or another Web3 wallet to continue.
                      </p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Actions */}
                {!isConnected ? (
                  <Button
                    onClick={handleConnectWallet}
                    disabled={isConnecting || !hasWallet}
                    className="w-full gradient-primary text-primary-foreground"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Wallet size={18} className="mr-2" />
                        Connect Wallet
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleUnlock}
                    disabled={isUnlocking}
                    className="w-full gradient-primary text-primary-foreground"
                  >
                    {isUnlocking ? (
                      <>
                        <Loader2 size={18} className="mr-2 animate-spin" />
                        Confirming in Wallet...
                      </>
                    ) : (
                      <>
                        <Lock size={18} className="mr-2" />
                        Unlock for {priceEth} ETH
                      </>
                    )}
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground mt-3">
                  Payment processed on Base blockchain
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
