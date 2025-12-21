import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi, CloudOff, Loader2 } from 'lucide-react';
import { useOfflineQueueContext } from '@/hooks/useOfflineQueue';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const { pendingCount, isSyncing } = useOfflineQueueContext();

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

  const showIndicator = !isOnline || showReconnected || (isSyncing && pendingCount > 0);

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
            isSyncing
              ? 'bg-primary/90 text-primary-foreground'
              : isOnline 
                ? 'bg-green-500/90 text-white' 
                : 'bg-destructive/90 text-destructive-foreground'
          }`}>
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing {pendingCount} action{pendingCount !== 1 ? 's' : ''}...</span>
              </>
            ) : isOnline ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Back online{pendingCount > 0 ? ` - Syncing ${pendingCount} queued action${pendingCount !== 1 ? 's' : ''}` : ''}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 animate-pulse" />
                <span>
                  Offline mode
                  {pendingCount > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1">
                      <CloudOff className="w-3.5 h-3.5" />
                      {pendingCount} pending
                    </span>
                  )}
                </span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
