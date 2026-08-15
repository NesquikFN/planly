"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getLocalDateKey, startOfLocalDay } from "@/lib/date-utils";

interface ClockContextValue {
  /** Live-ish current timestamp — ticks every minute, plus on tab focus. */
  now: Date;
  /** Midnight of the current local day. Stable reference until the day
   * actually rolls over, so it's cheap to use as a dependency everywhere. */
  today: Date;
  todayKey: string;
}

const ClockContext = createContext<ClockContextValue | null>(null);

/**
 * Single source of truth for "what time/day is it" — every store reads from
 * here instead of calling `new Date()` on its own, so Header/tasks/calendar
 * can never disagree, and the whole app notices a midnight rollover without
 * a manual reload.
 */
export function ClockProvider({ children }: { children: ReactNode }) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    const interval = setInterval(tick, 60_000);

    function handleVisibility() {
      if (document.visibilityState === "visible") tick();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", tick);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", tick);
    };
  }, []);

  const todayKey = getLocalDateKey(now);
  // Only mint a new Date object when the calendar day actually changes, so
  // downstream useMemo/useCallback deps keyed on `today` don't churn every
  // minute.
  const today = useMemo(() => startOfLocalDay(now), [todayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const value: ClockContextValue = { now, today, todayKey };

  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
}

export function useClock(): ClockContextValue {
  const ctx = useContext(ClockContext);
  if (!ctx) throw new Error("useClock must be used within a ClockProvider");
  return ctx;
}
