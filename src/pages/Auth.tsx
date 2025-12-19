import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ExternalLink, Loader2, Shield, Music, Users, CheckCircle2, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/songchainn-logo.png';

type ConnectionState = 'idle' | 'connecting' | 'signing' | 'verifying' | 'success';
type AuthMode = 'signin' | 'signup';

/**
 * Build a mobile deep link that opens the current page inside the Base App browser.
 * Uses the cbwallet:// protocol which is handled natively by the Base App.
 */
function getBaseAppDeepLink(targetUrl: string) {
  return `cbwallet://dapp?url=${encodeURIComponent(targetUrl)}`;
}

export default function Auth() {
  const { signInWithBase, isBaseAppDetected, walletAddress } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  
  // Email/Phone auth state
  const [authMethod, setAuthMethod] = useState<'wallet' | 'email' | 'phone'>('wallet');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  const hasInjectedWallet =
    typeof window !== 'undefined' && !!(window as any).ethereum?.request;

  const openInBaseApp = () => {
    const target = window.location.href;
    const deepLink = getBaseAppDeepLink(target);
    window.location.href = deepLink;
    setTimeout(() => {
      setShowInstallPrompt(true);
    }, 2500);
  };

  const handleBaseSignIn = async () => {
    setError(null);
    if (!hasInjectedWallet && !isBaseAppDetected) {
      openInBaseApp();
      return;
    }

    setConnectionState('connecting');

    try {
      await new Promise((resolve) => setTimeout(resolve, 150));
      setConnectionState('signing');

      const result = await signInWithBase();

      if (result.error) {
        setError(result.error.message);
        setConnectionState('idle');
      } else {
        setConnectionState('verifying');
        await new Promise((resolve) => setTimeout(resolve, 400));
        setConnectionState('success');
      }
    } catch (err) {
      setError('Base App connection failed. Please try again.');
      setConnectionState('idle');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEmailLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;
        toast.success('Account created! You can now sign in.');
        setAuthMode('signin');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setConnectionState('success');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsEmailLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });
      if (error) throw error;
      toast.success('OTP sent to your phone!');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Auto-trigger wallet sign-in when opened inside Base App
  React.useEffect(() => {
    if ((isBaseAppDetected || hasInjectedWallet) && connectionState === 'idle' && !error && authMethod === 'wallet') {
      const timer = setTimeout(() => {
        handleBaseSignIn();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isBaseAppDetected, hasInjectedWallet, authMethod]);

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
      default: {
        const readyToSign = isBaseAppDetected || hasInjectedWallet;
        return (
          <>
            <Wallet className="w-5 h-5 mr-2" />
            {readyToSign ? 'Continue to Sign' : 'Open Base App to Connect'}
          </>
        );
      }
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
                  {authMethod === 'wallet' ? 'Wallet Connected!' : 'Signed In!'}
                </h3>
                {(connectedAddress || walletAddress) && authMethod === 'wallet' && (
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
                {/* Auth Method Tabs */}
                <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as any)} className="mb-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="wallet" className="text-xs">
                      <Wallet className="w-4 h-4 mr-1" />
                      Wallet
                    </TabsTrigger>
                    <TabsTrigger value="email" className="text-xs">
                      <Mail className="w-4 h-4 mr-1" />
                      Email
                    </TabsTrigger>
                    <TabsTrigger value="phone" className="text-xs">
                      <Phone className="w-4 h-4 mr-1" />
                      Phone
                    </TabsTrigger>
                  </TabsList>

                  {/* Wallet Tab */}
                  <TabsContent value="wallet" className="mt-4">
                    {(isBaseAppDetected || hasInjectedWallet) && (
                      <div className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          Wallet detected — tap Continue to Sign
                        </span>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground text-center mb-4 leading-relaxed">
                      Connect with Base App wallet for the best experience.
                    </p>

                    {error && authMethod === 'wallet' && (
                      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
                        <p className="text-sm text-destructive text-center">{error}</p>
                      </div>
                    )}

                    <Button
                      onClick={handleBaseSignIn}
                      disabled={isLoading}
                      className="w-full gradient-primary text-primary-foreground font-semibold h-12 shadow-glow hover:scale-[1.02] transition-transform"
                    >
                      {getButtonContent()}
                    </Button>

                    <div className="text-center text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1.5">
                      <Shield className="w-3 h-3" />
                      <span>Wallet signature verification enabled</span>
                    </div>

                    {(!isBaseAppDetected || showInstallPrompt) && (
                      <div className="text-center pt-4 mt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground mb-3">
                          {showInstallPrompt 
                            ? "Base App not found. Install it to continue:" 
                            : "Don't have Base App yet?"}
                        </p>
                        <a
                          href="https://base.app/invite/imanafrikah/WTL0V0H3"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors font-medium text-sm"
                        >
                          Download Base App
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    )}
                  </TabsContent>

                  {/* Email Tab */}
                  <TabsContent value="email" className="mt-4">
                    <form onSubmit={handleEmailAuth} className="space-y-4">
                      <div>
                        <Input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-12"
                        />
                      </div>
                      <div>
                        <Input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="h-12"
                        />
                      </div>

                      {error && authMethod === 'email' && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                          <p className="text-sm text-destructive text-center">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isEmailLoading}
                        className="w-full gradient-primary text-primary-foreground font-semibold h-12"
                      >
                        {isEmailLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : authMode === 'signup' ? (
                          'Create Account'
                        ) : (
                          'Sign In'
                        )}
                      </Button>

                      <p className="text-center text-sm text-muted-foreground">
                        {authMode === 'signin' ? (
                          <>
                            Don't have an account?{' '}
                            <button
                              type="button"
                              onClick={() => setAuthMode('signup')}
                              className="text-primary hover:underline font-medium"
                            >
                              Sign up
                            </button>
                          </>
                        ) : (
                          <>
                            Already have an account?{' '}
                            <button
                              type="button"
                              onClick={() => setAuthMode('signin')}
                              className="text-primary hover:underline font-medium"
                            >
                              Sign in
                            </button>
                          </>
                        )}
                      </p>
                    </form>
                  </TabsContent>

                  {/* Phone Tab */}
                  <TabsContent value="phone" className="mt-4">
                    <form onSubmit={handlePhoneAuth} className="space-y-4">
                      <div>
                        <Input
                          type="tel"
                          placeholder="+1 234 567 8900"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          required
                          className="h-12"
                        />
                      </div>

                      {error && authMethod === 'phone' && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                          <p className="text-sm text-destructive text-center">{error}</p>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isEmailLoading}
                        className="w-full gradient-primary text-primary-foreground font-semibold h-12"
                      >
                        {isEmailLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          'Send OTP Code'
                        )}
                      </Button>

                      <p className="text-center text-xs text-muted-foreground">
                        We'll send a one-time code to verify your number
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Features */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                  <div className="py-3 px-2 rounded-xl bg-secondary/50 text-center">
                    <Music className="w-5 h-5 mx-auto text-primary mb-1.5" />
                    <p className="text-xs text-muted-foreground leading-tight">Stream Music</p>
                  </div>
                  <div className="py-3 px-2 rounded-xl bg-secondary/50 text-center">
                    <Users className="w-5 h-5 mx-auto text-primary mb-1.5" />
                    <p className="text-xs text-muted-foreground leading-tight">Join Audience</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Phase One Positioning */}
        <div className="mt-6 text-center space-y-3">
          <div className="bg-secondary/30 rounded-xl p-4 border border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2">Audience Edition</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sign in with wallet, email, or phone to join SongChainn.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span>Secure Auth</span>
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
