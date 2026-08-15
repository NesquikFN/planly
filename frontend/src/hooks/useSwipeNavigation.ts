"use client";

import { useEffect, useRef } from "react";
import { SWIPE_THRESHOLD_PX } from "@/lib/calendar-constants";

/**
 * Horizontal-swipe detection that leaves vertical scrolling untouched.
 * Uses a native (non-passive) touchmove listener so preventDefault only
 * kicks in once the gesture is confirmed horizontal.
 */
export function useSwipeNavigation<T extends HTMLElement>(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const ref = useRef<T | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const axis = useRef<"horizontal" | "vertical" | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    function handleTouchStart(event: TouchEvent) {
      const touch = event.touches[0];
      start.current = { x: touch.clientX, y: touch.clientY };
      axis.current = null;
    }

    function handleTouchMove(event: TouchEvent) {
      if (!start.current) return;
      const touch = event.touches[0];
      const dx = touch.clientX - start.current.x;
      const dy = touch.clientY - start.current.y;

      if (!axis.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        axis.current = Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
      }

      if (axis.current === "horizontal" && event.cancelable) {
        event.preventDefault();
      }
    }

    function handleTouchEnd(event: TouchEvent) {
      if (start.current && axis.current === "horizontal") {
        const touch = event.changedTouches[0];
        const dx = touch.clientX - start.current.x;
        if (dx <= -SWIPE_THRESHOLD_PX) onSwipeLeft();
        else if (dx >= SWIPE_THRESHOLD_PX) onSwipeRight();
      }
      start.current = null;
      axis.current = null;
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);

  return ref;
}
