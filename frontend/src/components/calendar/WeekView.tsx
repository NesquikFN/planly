"use client";

import { useCalendarStore } from "@/hooks/useCalendarStore";
import { TimeGridView } from "@/components/calendar/TimeGridView";

export function WeekView() {
  const { weekDays } = useCalendarStore();
  return <TimeGridView days={weekDays} />;
}
