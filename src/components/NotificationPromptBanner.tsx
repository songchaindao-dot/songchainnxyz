import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const DISMISSED_KEY = 'notification_prompt_dismissed';

export function NotificationPromptBanner() {
  const { isSupported, isSubscribed, permission, subscribe } = usePushNotifications();
  const [isDismissed, setIsDismissed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    
    // Show banner if not dismissed or dismissed more than a week ago
    if (!dismissed || dismissedTime < oneWeekAgo) {
      setIsDismissed(false);
    }
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    await subscribe();
    setIsLoading(false);
    handleDismiss();
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISSED_KEY, Date.now().toString());
  };

  // Don't show if not supported, already subscribed, permission denied, or dismissed
  if (!isSupported || isSubscribed || permission === 'denied' || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="relative glass-card rounded-2xl p-4 mb-6 border border-primary/20 overflow-hidden"
      >
        {/* Gradient accent */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5 pointer-events-none" />
        
        <div className="relative flex items-center gap-4">
          <div className="flex-shrink-0 p-3 rounded-xl bg-primary/20">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-foreground text-sm sm:text-base">
              Stay updated with $ongChainn
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Get notified about new music, likes, and comments
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={isLoading}
              className="text-xs sm:text-sm"
            >
              {isLoading ? 'Enabling...' : 'Enable'}
            </Button>
            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
