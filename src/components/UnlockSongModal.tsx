import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Unlock, Loader2, ExternalLink, Music, Wallet, AlertCircle, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Song } from '@/data/musicData';
import { formatEthPrice } from '@/lib/songRegistry';
import { connectWallet, hasWalletProvider, getWalletProvider } from '@/lib/baseWallet';
import { useWalletBalance } from '@/hooks/useWalletBalance';
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

type Step = 'connect' | 'confirm' | 'signing' | 'processing' | 'success' | 'error';

export function UnlockSongModal({
  song,
  isOpen,
  onClose,
  onUnlock,
  walletAddress,
  onWalletConnected
}: UnlockSongModalProps) {
  const [step, setStep] = useState<Step>('connect');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState(walletAddress);
  const { balance, isLoading: isBalanceLoading } = useWalletBalance(connectedAddress || null);

  const priceEth = formatEthPrice(DEFAULT_PRICE_WEI);
  const hasWallet = hasWalletProvider();
  const isConnected = !!connectedAddress;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(isConnected ? 'confirm' : 'connect');
      setError(null);
    }
  }, [isOpen, isConnected]);

  // Update connected address when wallet prop changes
  useEffect(() => {
    if (walletAddress) {
      setConnectedAddress(walletAddress);
      setStep('confirm');
    }
  }, [walletAddress]);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const result = await connectWallet();
      if (result.success && result.address) {
        setConnectedAddress(result.address);
        onWalletConnected?.(result.address);
        setStep('confirm');
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

    setStep('signing');
    setError(null);

    try {
      // Show signing step briefly
      await new Promise(resolve => setTimeout(resolve, 500));
      setStep('processing');
      
      const result = await onUnlock(priceEth);
      
      if (result.success) {
        setStep('success');
        toast.success('Song unlocked! You now have full access.');
        setTimeout(() => {
          onClose();
          setStep('confirm');
        }, 2500);
      } else {
        setError(result.error || 'Failed to unlock song');
        setStep('error');
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
      setStep('error');
    }
  };

  const handleRetry = () => {
    setStep('confirm');
    setError(null);
  };

  if (!isOpen) return null;

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Check if user has enough balance
  const hasEnoughBalance = balance && parseFloat(balance) >= parseFloat(priceEth);

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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
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
              <motion.div 
                className="w-20 h-20 mx-auto mb-4 rounded-xl overflow-hidden shadow-glow"
                animate={{ 
                  boxShadow: step === 'success' 
                    ? '0 0 40px rgba(34, 197, 94, 0.4)' 
                    : '0 0 20px rgba(var(--primary), 0.3)'
                }}
              >
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
              </motion.div>
              
              <h2 className="text-xl font-bold mb-1">{song.title}</h2>
              <p className="text-muted-foreground">{song.artist}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 pt-0">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {['connect', 'confirm', 'success'].map((s, i) => {
                const stepOrder = ['connect', 'confirm', 'success'];
                const currentIndex = stepOrder.indexOf(step === 'signing' || step === 'processing' ? 'confirm' : step === 'error' ? 'confirm' : step);
                const stepIndex = i;
                const isCompleted = stepIndex < currentIndex || step === 'success';
                const isCurrent = stepIndex === currentIndex;
                
                return (
                  <div key={s} className="flex items-center">
                    <motion.div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                        isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isCurrent 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted text-muted-foreground'
                      }`}
                      animate={{ scale: isCurrent ? 1.1 : 1 }}
                    >
                      {isCompleted ? <Check size={14} /> : stepIndex + 1}
                    </motion.div>
                    {i < 2 && (
                      <div className={`w-8 h-0.5 mx-1 ${isCompleted ? 'bg-green-500' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Success State */}
            {step === 'success' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-6"
              >
                <motion.div 
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                >
                  <Unlock size={32} className="text-green-500" />
                </motion.div>
                <h3 className="text-lg font-semibold text-green-500">Song Unlocked!</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  You now have unlimited streaming access
                </p>
              </motion.div>
            )}

            {/* Signing State */}
            {step === 'signing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Wallet size={32} className="text-primary animate-pulse" />
                </div>
                <h3 className="text-lg font-semibold">Check Your Wallet</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Please confirm the transaction in your wallet
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" />
                  Waiting for confirmation...
                </div>
              </motion.div>
            )}

            {/* Processing State */}
            {step === 'processing' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                  <Loader2 size={32} className="text-primary animate-spin" />
                </div>
                <h3 className="text-lg font-semibold">Processing Transaction</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Your transaction is being processed on Base
                </p>
              </motion.div>
            )}

            {/* Error State */}
            {step === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                  <AlertCircle size={32} className="text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-destructive">Transaction Failed</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  {error || 'Something went wrong. Please try again.'}
                </p>
                <Button onClick={handleRetry} className="mt-4" variant="outline">
                  Try Again
                </Button>
              </motion.div>
            )}

            {/* Connect / Confirm States */}
            {(step === 'connect' || step === 'confirm') && (
              <>
                {/* Wallet Info */}
                {isConnected && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/30 rounded-xl p-4 mb-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <Wallet size={16} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{truncateAddress(connectedAddress!)}</p>
                          <p className="text-xs text-muted-foreground">Connected Wallet</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary">
                          {isBalanceLoading ? '...' : balance ? `${balance} ETH` : '0 ETH'}
                        </p>
                        <p className="text-xs text-muted-foreground">Balance</p>
                      </div>
                    </div>

                    {/* Insufficient balance warning */}
                    {!isBalanceLoading && balance && !hasEnoughBalance && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 text-amber-500 text-xs">
                        <AlertCircle size={14} />
                        <span>Insufficient balance. You need at least {priceEth} ETH.</span>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Token Info */}
                <div className="bg-muted/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Price</span>
                    <span className="text-lg font-bold text-primary">{priceEth} ETH</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network</span>
                      <span className="font-medium">Base</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Artist Share</span>
                      <span className="font-medium text-green-500">95%</span>
                    </div>
                  </div>
                </div>

                {/* What you get */}
                <div className="space-y-2 mb-6">
                  <h4 className="text-sm font-medium">What you get:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1.5">
                    {[
                      'Unlimited streaming access',
                      '1,000 offline plays',
                      'Support the artist directly',
                      'Own the song token on Base'
                    ].map((item, i) => (
                      <motion.li 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* No wallet warning */}
                {!hasWallet && step === 'connect' && (
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

                {/* Actions */}
                {!isConnected ? (
                  <Button
                    onClick={handleConnectWallet}
                    disabled={isConnecting || !hasWallet}
                    className="w-full gradient-primary text-primary-foreground h-12"
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
                        <ArrowRight size={16} className="ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleUnlock}
                    disabled={!hasEnoughBalance && !isBalanceLoading}
                    className="w-full gradient-primary text-primary-foreground h-12"
                  >
                    <Lock size={18} className="mr-2" />
                    Unlock for {priceEth} ETH
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground mt-3">
                  Payment processed on Base blockchain • Gas fees apply
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
