import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefresh({ children, onRefresh, className = '' }: PullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const controls = useAnimation();

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const container = containerRef.current;
    if (!container || isRefreshing) return;

    const isAtTop = container.scrollTop <= 0 && (typeof window === 'undefined' || window.scrollY <= 0);

    // Only start pull if at very top
    if (isAtTop) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const container = containerRef.current;
    const isAtTop = !!container && container.scrollTop <= 0 && (typeof window === 'undefined' || window.scrollY <= 0);

    // If user isn't at the top anymore, stop pulling and let normal scrolling happen
    if (!isAtTop) {
      setIsPulling(false);
      setPullDistance(0);
      return;
    }

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      // Apply resistance curve for more natural feel
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(distance);

      // Prevent default scroll when actively pulling down
      if (distance > 10) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= PULL_THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD / 2);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      }
      
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
  }, [isPulling, pullDistance, onRefresh]);

  const pullProgress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const shouldTrigger = pullDistance >= PULL_THRESHOLD;

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      {/* Pull indicator */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-20"
        style={{
          top: -60,
        }}
        animate={{
          y: pullDistance + (isRefreshing ? 80 : 0),
          opacity: pullProgress > 0.1 || isRefreshing ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <motion.div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${
            shouldTrigger || isRefreshing 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}
          style={{
            boxShadow: shouldTrigger || isRefreshing 
              ? '0 0 20px hsl(217 91% 60% / 0.4)' 
              : 'none',
          }}
          animate={{
            scale: shouldTrigger ? 1.1 : 1,
            rotate: isRefreshing ? 360 : pullProgress * 180,
          }}
          transition={isRefreshing ? {
            rotate: { duration: 1, repeat: Infinity, ease: 'linear' }
          } : {
            type: 'spring', stiffness: 300, damping: 20
          }}
        >
          <RefreshCw className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Content wrapper with pull transform */}
      <motion.div
        animate={{
          y: isRefreshing ? 60 : pullDistance * 0.5,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>

      {/* Pull hint text */}
      <motion.div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none z-10"
        style={{ top: -30 }}
        animate={{
          y: pullDistance + (isRefreshing ? 80 : 0),
          opacity: pullProgress > 0.3 || isRefreshing ? 0.8 : 0,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <span className="text-xs text-muted-foreground font-medium">
          {isRefreshing 
            ? 'Refreshing...' 
            : shouldTrigger 
              ? 'Release to refresh' 
              : 'Pull to refresh'}
        </span>
      </motion.div>
    </div>
  );
}
