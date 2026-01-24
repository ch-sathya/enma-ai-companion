import { useEffect, useRef } from "react";

interface UseSwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export const useSwipeGesture = (
  options: UseSwipeGestureOptions
) => {
  const { onSwipeLeft, onSwipeRight, threshold = 50 } = options;
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchEndX.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || touchEndX.current === null) return;

      const deltaX = touchEndX.current - touchStartX.current;

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          // Swiped right - only trigger if started from left edge
          if (touchStartX.current < 50) {
            onSwipeRight();
          }
        } else if (deltaX < 0 && onSwipeLeft) {
          // Swiped left
          onSwipeLeft();
        }
      }

      touchStartX.current = null;
      touchEndX.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight, threshold]);
};
