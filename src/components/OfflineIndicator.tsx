import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      // Hide the "back online" message after 3 seconds
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const showIndicator = !isOnline || showReconnected;

  return (
    <AnimatePresence>
      {showIndicator && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-[70]"
        >
          <div className={`py-2 px-4 flex items-center justify-center gap-2 text-sm font-medium ${
            isOnline 
              ? 'bg-green-500/90 text-white' 
              : 'bg-destructive/90 text-destructive-foreground'
          }`}>
            {isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Back online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 animate-pulse" />
                <span>No internet connection - Some features may be unavailable</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
