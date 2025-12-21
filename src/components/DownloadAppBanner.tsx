import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const BANNER_DISMISSED_KEY = 'download-app-banner-dismissed';

// Store the deferred prompt globally and capture it immediately
let deferredInstallPrompt: any = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    console.log('PWA install prompt captured');
  });

  // Listen for successful install
  window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    deferredInstallPrompt = null;
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
  });
}

export function DownloadAppBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  useEffect(() => {
    // Check if app is already installed (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if banner was already dismissed
    const wasDismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    
    // Only show on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile && !wasDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = useCallback(async () => {
    setIsInstalling(true);

    try {
      // Check if we have a deferred prompt (Chrome/Android/Edge)
      if (deferredInstallPrompt) {
        console.log('Triggering PWA install prompt');
        deferredInstallPrompt.prompt();
        
        const { outcome } = await deferredInstallPrompt.userChoice;
        console.log('User choice:', outcome);
        
        if (outcome === 'accepted') {
          toast.success('Installing $ongChainn...', {
            description: 'The app will appear on your home screen shortly!'
          });
          setIsVisible(false);
          localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
        }
        
        // Clear the prompt - it can only be used once
        deferredInstallPrompt = null;
      } else if (isIOS) {
        // For iOS, show the instructions overlay
        setShowIOSInstructions(true);
      } else {
        // For browsers that don't support beforeinstallprompt
        toast.info('Add to Home Screen', {
          description: 'Use your browser menu to "Add to Home Screen" or "Install App"',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Install error:', error);
      toast.error('Installation failed', {
        description: 'Please try using your browser menu to install the app'
      });
    } finally {
      setIsInstalling(false);
    }
  }, [isIOS]);

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (isInstalled) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-24 left-4 right-4 z-50 mx-auto max-w-md"
          >
            <div className="glass-card rounded-2xl p-4 border border-border shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
                  <Smartphone className="w-6 h-6 text-primary-foreground" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-semibold text-foreground text-sm mb-1">
                    Get the $ongChainn App
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Install for faster access, offline music, and push notifications.
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleInstall}
                      disabled={isInstalling}
                      className="gradient-primary text-xs h-8 gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {isInstalling ? 'Installing...' : 'Install App'}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={handleDismiss}
                      className="text-xs h-8 text-muted-foreground"
                    >
                      Not Now
                    </Button>
                  </div>
                </div>
                
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Installation Instructions Overlay */}
      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"
            onClick={() => setShowIOSInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-sm w-full text-center space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto shadow-glow">
                <Smartphone className="w-8 h-8 text-primary-foreground" />
              </div>
              
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-2">
                  Install $ongChainn
                </h2>
                <p className="text-muted-foreground text-sm">
                  Follow these steps to add the app to your home screen:
                </p>
              </div>

              <div className="space-y-4 text-left">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Tap the Share button</p>
                    <p className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                      <Share className="w-3.5 h-3.5" /> at the bottom of {isSafari ? 'Safari' : 'your browser'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Scroll and tap "Add to Home Screen"</p>
                    <p className="text-muted-foreground text-xs mt-1">Look for the + icon in the share menu</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-foreground text-sm font-medium">Tap "Add" to confirm</p>
                    <p className="text-muted-foreground text-xs mt-1">The app will appear on your home screen!</p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setShowIOSInstructions(false)}
                className="w-full gradient-primary"
              >
                Got it!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
