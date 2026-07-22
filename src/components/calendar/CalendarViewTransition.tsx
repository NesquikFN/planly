"use client";

import type { ReactNode } from "react";
import { useCalendarStore } from "@/hooks/useCalendarStore";

interface CalendarViewTransitionProps {
  children: ReactNode;
}

/**
 * Replays a slide-in animation whenever the arrows/swipe move the calendar
 * to a new period. Switching view mode alone (Day/Week/Month/Agenda) does
 * not bump navCounter, so it stays an instant swap.
 */
export function CalendarViewTransition({ children }: CalendarViewTransitionProps) {
  const { navCounter, direction } = useCalendarStore();

  return (
    <div key={navCounter} className={direction === "forward" ? "calendar-slide-forward" : "calendar-slide-backward"}>
      {children}
    </div>
  );
}
