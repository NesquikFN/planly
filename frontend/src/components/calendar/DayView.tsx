"use client";

import { useCalendarStore } from "@/hooks/useCalendarStore";
import { TimeGridView } from "@/components/calendar/TimeGridView";

export function DayView() {
  const { anchorDate } = useCalendarStore();
  return <TimeGridView days={[anchorDate]} showWeekdayLabel={false} />;
}
