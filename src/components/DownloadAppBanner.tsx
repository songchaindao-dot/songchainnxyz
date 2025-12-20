import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BANNER_DISMISSED_KEY = 'download-app-banner-dismissed';

export function DownloadAppBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

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

  const handleInstall = async () => {
    // Check for beforeinstallprompt event (Chrome/Android)
    const deferredPrompt = (window as any).deferredPrompt;
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsVisible(false);
        localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
      }
    } else {
      // For iOS, show instructions
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      if (isIOS) {
        alert('To install $ongChainn:\n\n1. Tap the Share button at the bottom of your browser\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm');
      } else {
        // For other browsers, open the PWA install page
        window.open('/?install=true', '_blank');
      }
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  if (isInstalled) return null;

  return (
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
                    className="gradient-primary text-xs h-8 gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Install App
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
  );
}

// Listen for beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    (window as any).deferredPrompt = e;
  });
}
