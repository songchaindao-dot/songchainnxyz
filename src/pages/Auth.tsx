import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ExternalLink, Loader2, Shield, Music, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import logo from '@/assets/songchainn-logo.png';

type ConnectionState = 'idle' | 'connecting' | 'signing' | 'verifying' | 'success';

export default function Auth() {
  const { signInWithBase, isBaseAppDetected, walletAddress } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  const handleBaseSignIn = async () => {
    setError(null);
    setConnectionState('connecting');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      setConnectionState('signing');
      
      const result = await signInWithBase();
      
      if (result.error) {
        setError(result.error.message);
        setConnectionState('idle');
      } else {
        setConnectionState('verifying');
        await new Promise(resolve => setTimeout(resolve, 500));
        setConnectionState('success');
      }
    } catch (err) {
      setError('Base App connection failed. Please try again.');
      setConnectionState('idle');
    }
  };

  React.useEffect(() => {
    if (walletAddress && connectionState === 'success') {
      setConnectedAddress(walletAddress);
    }
  }, [walletAddress, connectionState]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getButtonContent = () => {
    switch (connectionState) {
      case 'connecting':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Connecting to Wallet...
          </>
        );
      case 'signing':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Sign the message in your wallet...
          </>
        );
      case 'verifying':
        return (
          <>
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Verifying signature...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle2 className="w-5 h-5 mr-2" />
            Connected!
          </>
        );
      default:
        return (
          <>
            <Wallet className="w-5 h-5 mr-2" />
            {isBaseAppDetected ? 'Connect Base Wallet' : 'Connect with Base App'}
          </>
        );
    }
  };

  const isLoading = connectionState !== 'idle' && connectionState !== 'success';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.img
            src={logo}
            alt="SongChainn"
            className="h-24 mx-auto mb-6"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
            Welcome to SongChainn
          </h1>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            The Audience experience awaits
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-lg">
          <AnimatePresence mode="wait">
            {connectionState === 'success' ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </motion.div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  Wallet Connected!
                </h3>
                {(connectedAddress || walletAddress) && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 border border-border mb-4">
                    <Wallet className="w-4 h-4 text-primary" />
                    <code className="text-sm font-mono text-foreground">
                      {formatAddress(connectedAddress || walletAddress || '')}
                    </code>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Redirecting to SongChainn...
                </p>
                <div className="mt-4">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" />
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Base Requirement */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="font-heading font-semibold text-foreground">
                    Base App Required
                  </h2>
                </div>

                {/* Base App Detection Status */}
                {isBaseAppDetected && (
                  <div className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Base App detected
                    </span>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground text-center mb-6 leading-relaxed">
                  Connect with Base App to access SongChainn and join the Audience experience.
                </p>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="py-3 px-2 rounded-xl bg-secondary/50 text-center">
                    <Music className="w-5 h-5 mx-auto text-primary mb-1.5" />
                    <p className="text-xs text-muted-foreground leading-tight">Stream Music</p>
                  </div>
                  <div className="py-3 px-2 rounded-xl bg-secondary/50 text-center">
                    <Users className="w-5 h-5 mx-auto text-primary mb-1.5" />
                    <p className="text-xs text-muted-foreground leading-tight">Join Audience</p>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                    <p className="text-sm text-destructive text-center">{error}</p>
                  </div>
                )}

                {/* Base App Sign In Button */}
                <Button
                  onClick={handleBaseSignIn}
                  disabled={isLoading}
                  className="w-full gradient-primary text-primary-foreground font-semibold h-12 shadow-glow hover:scale-[1.02] transition-transform mb-4"
                >
                  {getButtonContent()}
                </Button>

                {/* Wallet Verification Info */}
                <div className="text-center text-xs text-muted-foreground mb-4 flex items-center justify-center gap-1.5">
                  <Shield className="w-3 h-3" />
                  <span>Wallet signature verification enabled</span>
                </div>

                {/* Download Base App CTA */}
                {!isBaseAppDetected && (
                  <div className="text-center pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-3 mt-4">
                      Don't have Base App yet?
                    </p>
                    <a
                      href="https://base.app/invite/imanafrikah/WTL0V0H3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
                    >
                      Download Base App to Enter SongChainn
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <p className="text-xs text-muted-foreground mt-2">Free to download • Earn by Being Social</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phase One Positioning */}
        <div className="mt-6 text-center space-y-3">
          <div className="bg-secondary/30 rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Audience Edition</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Base App access is required now. On-chain verification deepens in later phases 
              as the platform evolves toward full ownership capabilities.
            </p>
          </div>
          
          {/* Verification Status */}
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>SIWE Enabled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Base Mainnet</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}