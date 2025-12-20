import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipeNavigation(threshold = 100, velocityThreshold = 0.3) {
  const navigate = useNavigate();
  const swipeState = useRef<SwipeState | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!swipeState.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeState.current.startX;
    const deltaY = touch.clientY - swipeState.current.startY;
    const deltaTime = Date.now() - swipeState.current.startTime;
    const velocity = Math.abs(deltaX) / deltaTime;

    // Only trigger if horizontal swipe is more significant than vertical
    // and meets threshold requirements
    if (
      Math.abs(deltaX) > Math.abs(deltaY) * 1.5 &&
      (Math.abs(deltaX) > threshold || velocity > velocityThreshold)
    ) {
      if (deltaX > 0) {
        // Swipe right = go back
        navigate(-1);
      } else {
        // Swipe left = go forward
        navigate(1);
      }
    }

    swipeState.current = null;
  }, [navigate, threshold, velocityThreshold]);

  useEffect(() => {
    // Only enable on touch devices
    if (!('ontouchstart' in window)) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);
}
