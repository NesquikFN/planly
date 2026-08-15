import type { CalendarEvent } from "@/types/calendar";
import { addDays, fromISODate, getLocalDateKey, startOfLocalDay } from "@/lib/date-utils";
import { localWeekdayIndex } from "@/lib/task-recurrence";

/**
 * Expands a recurring event series into the ISO date keys it occurs on
 * within [rangeStart, rangeEnd] (inclusive, both start-of-day). Nothing is
 * persisted — this is called fresh every render from whatever range is
 * currently being displayed (see useCalendarStore's visibleEntries). Returns
 * [] for a non-recurring event (rule "none" or absent).
 *
 * `event.date` is the series' anchor (first occurrence); dates before it, or
 * after `recurrence.until`, or in `skippedDates`, are excluded.
 */
export function expandSeriesDates(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): string[] {
  const recurrence = event.recurrence;
  if (!recurrence || recurrence.rule === "none" || recurrence.weekdays.length === 0) return [];

  const skip = new Set(event.skippedDates ?? []);
  const seriesStart = startOfLocalDay(fromISODate(event.date));
  const until = recurrence.until ? startOfLocalDay(fromISODate(recurrence.until)) : null;

  const windowStart = startOfLocalDay(rangeStart);
  const windowEnd = startOfLocalDay(rangeEnd);
  let cursor = seriesStart.getTime() > windowStart.getTime() ? seriesStart : windowStart;

  const dates: string[] = [];
  while (cursor.getTime() <= windowEnd.getTime()) {
    if (cursor.getTime() >= seriesStart.getTime() && (!until || cursor.getTime() <= until.getTime())) {
      if (recurrence.weekdays.includes(localWeekdayIndex(cursor))) {
        const key = getLocalDateKey(cursor);
        if (!skip.has(key)) dates.push(key);
      }
    }
    cursor = addDays(cursor, 1);
  }
  return dates;
}
