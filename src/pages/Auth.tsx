import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ExternalLink, Loader2, Shield, Music, Users, CheckCircle2, Mail, Phone, ChevronDown, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import logo from '@/assets/songchainn-logo.png';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { CountryCodeSelector } from '@/components/CountryCodeSelector';
import { COUNTRY_CODES, CountryCode } from '@/data/countryCodes';
import { cn } from '@/lib/utils';

type ConnectionState = 'idle' | 'connecting' | 'signing' | 'verifying' | 'success';
type AuthMode = 'signin' | 'signup';
type AuthView = 'main' | 'email' | 'phone' | 'verify-otp' | 'connect-wallet';

function getBaseAppDeepLink(targetUrl: string) {
  return `cbwallet://dapp?url=${encodeURIComponent(targetUrl)}`;
}

// Default to Zambia
const DEFAULT_COUNTRY = COUNTRY_CODES.find(c => c.code === 'ZM') || COUNTRY_CODES[0];

export default function Auth() {
  const { signInWithBase, isBaseAppDetected, walletAddress, user } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  
  // Auth state
  const [authView, setAuthView] = useState<AuthView>('main');
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);

  // Track if user signed in via email/phone but needs wallet
  const [pendingWalletConnection, setPendingWalletConnection] = useState(false);

  // Only detect Base App wallet, not MetaMask or other wallets
  const hasBaseWallet = typeof window !== 'undefined' && (() => {
    const ethereum = (window as any).ethereum;
    if (!ethereum?.request) return false;
    // Check for Base App or Coinbase Wallet specifically
    if (ethereum.isBaseApp || ethereum.isCoinbaseWallet) return true;
    // Check multi-provider array
    if (Array.isArray(ethereum.providers)) {
      return ethereum.providers.some((p: any) => p?.isBaseApp || p?.isCoinbaseWallet);
    }
    return false;
  })();

  const fullPhoneNumber = `${selectedCountry.dialCode}${phoneNumber.replace(/\D/g, '')}`;

  const openInBaseApp = () => {
    const target = window.location.href;
    const deepLink = getBaseAppDeepLink(target);
    window.location.href = deepLink;
    setTimeout(() => setShowInstallPrompt(true), 2500);
  };

  const handleBaseSignIn = async () => {
    setError(null);
    // Only proceed if Base Wallet is available
    if (!hasBaseWallet && !isBaseAppDetected) {
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
        setPendingWalletConnection(false);
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
      setConnectionState('idle');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success('Account created! Now connect your Base Wallet.');
        setPendingWalletConnection(true);
        setAuthView('connect-wallet');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Signed in! Now connect your Base Wallet.');
        setPendingWalletConnection(true);
        setAuthView('connect-wallet');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: fullPhoneNumber });
      if (error) throw error;
      toast.success('OTP sent to your phone!');
      setAuthView('verify-otp');
      startResendTimer();
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpCode.join('');
    if (code.length !== 6) return;

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: fullPhoneNumber,
        token: code,
        type: 'sms',
      });
      if (error) throw error;
      toast.success('Verified! Now connect your Base Wallet.');
      setPendingWalletConnection(true);
      setAuthView('connect-wallet');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  // Auto-trigger wallet sign-in when opened inside Base App (only on main view)
  React.useEffect(() => {
    if ((isBaseAppDetected || hasBaseWallet) && connectionState === 'idle' && !error && authView === 'main') {
      const timer = setTimeout(() => handleBaseSignIn(), 500);
      return () => clearTimeout(timer);
    }
  }, [isBaseAppDetected, hasBaseWallet, authView]);

  React.useEffect(() => {
    if (walletAddress && connectionState === 'success') {
      setConnectedAddress(walletAddress);
    }
  }, [walletAddress, connectionState]);

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  const getButtonContent = () => {
    switch (connectionState) {
      case 'connecting':
        return (<><Loader2 className="w-5 h-5 animate-spin mr-2" />Connecting to Wallet...</>);
      case 'signing':
        return (<><Loader2 className="w-5 h-5 animate-spin mr-2" />Sign the message...</>);
      case 'verifying':
        return (<><Loader2 className="w-5 h-5 animate-spin mr-2" />Verifying...</>);
      case 'success':
        return (<><CheckCircle2 className="w-5 h-5 mr-2" />Connected!</>);
      default:
        return (<><Wallet className="w-5 h-5 mr-2" />{hasBaseWallet || isBaseAppDetected ? 'Connect Base Wallet' : 'Open in Base App'}</>);
    }
  };

  const isWalletLoading = connectionState !== 'idle' && connectionState !== 'success';

  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '' };
    if (password.length < 6) return { level: 1, label: 'Weak' };
    if (password.length < 10) return { level: 2, label: 'Fair' };
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return { level: 3, label: 'Strong' };
    return { level: 2, label: 'Fair' };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground variant="subtle" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.img
            src={logo}
            alt="SongChainn"
            className="h-20 mx-auto mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          />
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-heading text-3xl font-bold text-foreground mb-2"
          >
            Welcome to SongChainn
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-muted-foreground"
          >
            The Audience experience awaits
          </motion.p>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="glass-card rounded-3xl p-6 shine-overlay"
        >
          <AnimatePresence mode="wait">
            {connectionState === 'success' && !pendingWalletConnection ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </motion.div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">Wallet Connected!</h3>
                {connectedAddress && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass mb-4">
                    <Wallet className="w-4 h-4 text-primary" />
                    <code className="text-sm font-mono text-foreground">{formatAddress(connectedAddress)}</code>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">Entering SongChainn...</p>
                <div className="mt-4"><Loader2 className="w-5 h-5 animate-spin mx-auto text-primary" /></div>
              </motion.div>
            ) : authView === 'connect-wallet' ? (
              <motion.div key="connect-wallet" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                    <Wallet className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                    Connect Your Base Wallet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Base Wallet is required to access and listen to music on SongChainn.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20 mb-6">
                  <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your Base Wallet supports culture, identity, and future ownership on SongChainn. 
                    Music streaming requires wallet verification.
                  </p>
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4">
                    <p className="text-sm text-destructive text-center">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleBaseSignIn}
                  disabled={isWalletLoading}
                  className="w-full gradient-primary text-primary-foreground font-semibold h-14 rounded-2xl shadow-glow hover-scale press-effect text-base"
                >
                  {getButtonContent()}
                </Button>

                {(!isBaseAppDetected || showInstallPrompt) && (
                  <div className="text-center pt-4 mt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-3">
                      {showInstallPrompt ? "Base App not found:" : "Don't have Base App?"}
                    </p>
                    <a
                      href="https://base.app/invite/imanafrikah/WTL0V0H3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl glass text-primary hover:bg-secondary/50 transition-colors font-medium text-sm press-effect"
                    >
                      Download Base App
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </motion.div>
            ) : authView === 'main' ? (
              <motion.div key="main" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Base Wallet Primary CTA */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-primary mb-4">
                    <Shield className="w-3.5 h-3.5" />
                    Base Wallet Required
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Connect with Base Wallet to enter SongChainn. This supports culture, identity, and future ownership.
                  </p>
                </div>

                {(isBaseAppDetected || hasBaseWallet) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-2 mb-4 py-2 px-3 rounded-xl bg-green-500/10 border border-green-500/20"
                  >
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-400 font-medium">Base Wallet detected</span>
                  </motion.div>
                )}

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4">
                    <p className="text-sm text-destructive text-center">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleBaseSignIn}
                  disabled={isWalletLoading}
                  className="w-full gradient-primary text-primary-foreground font-semibold h-14 rounded-2xl shadow-glow hover-scale press-effect text-base"
                >
                  {getButtonContent()}
                </Button>

                {(!isBaseAppDetected || showInstallPrompt) && (
                  <div className="text-center pt-4 mt-4 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-3">
                      {showInstallPrompt ? "Base App not found. Install it to continue:" : "Don't have Base App yet?"}
                    </p>
                    <a
                      href="https://base.app/invite/imanafrikah/WTL0V0H3"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl glass text-primary hover:bg-secondary/50 transition-colors font-medium text-sm press-effect"
                    >
                      Download Base App
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}

                {/* Other Sign-in Options Toggle */}
                <div className="mt-6">
                  <button
                    onClick={() => setShowOtherOptions(!showOtherOptions)}
                    className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    <span>Other sign-in options (optional)</span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", showOtherOptions && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {showOtherOptions && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-3">
                          <p className="text-xs text-center text-muted-foreground mb-3">
                            Email or phone can be used alongside Base Wallet. You'll still need to connect your wallet to access music.
                          </p>
                          <button
                            onClick={() => setAuthView('email')}
                            className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:bg-secondary/50 transition-colors press-effect"
                          >
                            <Mail className="w-5 h-5 text-muted-foreground" />
                            <span className="text-foreground font-medium">Continue with Email</span>
                          </button>
                          <button
                            onClick={() => setAuthView('phone')}
                            className="w-full flex items-center gap-3 p-3 rounded-xl glass hover:bg-secondary/50 transition-colors press-effect"
                          >
                            <Phone className="w-5 h-5 text-muted-foreground" />
                            <span className="text-foreground font-medium">Continue with Phone</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : authView === 'email' ? (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button
                  onClick={() => { setAuthView('main'); setError(null); }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Back</span>
                </button>

                <h3 className="font-heading text-xl font-semibold text-foreground mb-1">
                  {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  You'll still need to connect Base Wallet after signing in.
                </p>

                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl glass border-border/50"
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="h-12 rounded-xl glass border-border/50 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {authMode === 'signup' && password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={cn(
                              "h-1 flex-1 rounded-full transition-colors",
                              passwordStrength.level >= level
                                ? level === 1 ? "bg-red-500" : level === 2 ? "bg-yellow-500" : "bg-green-500"
                                : "bg-muted"
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
                    </div>
                  )}

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                      <p className="text-sm text-destructive text-center">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full gradient-primary text-primary-foreground font-semibold h-12 rounded-xl"
                  >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : authMode === 'signup' ? 'Create Account' : 'Sign In'}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground">
                    {authMode === 'signin' ? (
                      <>Don't have an account? <button type="button" onClick={() => setAuthMode('signup')} className="text-primary hover:underline font-medium">Sign up</button></>
                    ) : (
                      <>Already have an account? <button type="button" onClick={() => setAuthMode('signin')} className="text-primary hover:underline font-medium">Sign in</button></>
                    )}
                  </p>
                </form>
              </motion.div>
            ) : authView === 'phone' ? (
              <motion.div key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button
                  onClick={() => { setAuthView('main'); setError(null); }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Back</span>
                </button>

                <h3 className="font-heading text-xl font-semibold text-foreground mb-1">Phone Login</h3>
                <p className="text-sm text-muted-foreground mb-6">We'll send a verification code to your number.</p>

                <form onSubmit={handlePhoneAuth} className="space-y-4">
                  <div className="flex gap-2">
                    <CountryCodeSelector
                      selectedCountry={selectedCountry}
                      onSelect={setSelectedCountry}
                    />
                    <Input
                      type="tel"
                      placeholder="Phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="h-12 rounded-xl glass border-border/50 flex-1"
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Full number: <span className="font-mono text-foreground">{fullPhoneNumber || `${selectedCountry.dialCode}...`}</span>
                  </p>

                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                      <p className="text-sm text-destructive text-center">{error}</p>
                    </div>
                  )}

                  <Button type="submit" disabled={isLoading || !phoneNumber} className="w-full gradient-primary text-primary-foreground font-semibold h-12 rounded-xl">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification Code'}
                  </Button>
                </form>
              </motion.div>
            ) : authView === 'verify-otp' ? (
              <motion.div key="verify-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <button
                  onClick={() => { setAuthView('phone'); setOtpCode(['', '', '', '', '', '']); setError(null); }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Change number</span>
                </button>

                <h3 className="font-heading text-xl font-semibold text-foreground mb-1">Enter Code</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  We sent a 6-digit code to <span className="font-mono text-foreground">{fullPhoneNumber}</span>
                </p>

                <div className="flex gap-2 justify-center mb-6">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-12 h-14 text-center text-xl font-semibold rounded-xl glass border-border/50 bg-transparent focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  ))}
                </div>

                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 mb-4">
                    <p className="text-sm text-destructive text-center">{error}</p>
                  </div>
                )}

                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otpCode.join('').length !== 6}
                  className="w-full gradient-primary text-primary-foreground font-semibold h-12 rounded-xl"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                </Button>

                <div className="text-center mt-4">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-muted-foreground">Resend code in <span className="font-mono text-foreground">{resendTimer}s</span></p>
                  ) : (
                    <button onClick={handlePhoneAuth} disabled={isLoading} className="text-sm text-primary hover:underline font-medium">
                      Resend code
                    </button>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3 mt-6"
        >
          <div className="py-4 px-3 rounded-2xl glass-card text-center shine-overlay">
            <Music className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Stream Music</p>
            <p className="text-xs text-muted-foreground">Curated tracks</p>
          </div>
          <div className="py-4 px-3 rounded-2xl glass-card text-center shine-overlay">
            <Users className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium text-foreground">Join Community</p>
            <p className="text-xs text-muted-foreground">Town Squares</p>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Audience Edition • Building culture before ownership
        </motion.p>
      </motion.div>
    </div>
  );
}