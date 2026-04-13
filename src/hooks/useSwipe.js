import { useEffect, useRef } from "react";

/**
 * Detect horizontal swipe on a ref element.
 * onSwipe("left" | "right") is called when swipe distance > threshold.
 */
export function useSwipe(ref, onSwipe, threshold = 60) {
  const startX = useRef(null);
  const startY = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onTouchStart = (e) => {
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e) => {
      if (startX.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      // only trigger if horizontal movement dominates
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
        onSwipe(dx < 0 ? "left" : "right");
      }
      startX.current = null;
      startY.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [ref, onSwipe, threshold]);
}
