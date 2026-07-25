import { diffInCalendarDays, formatShortDate, fromISODate } from "@/lib/date-utils";

/**
 * Builds the short display label for a task's due date/time (used by
 * `dueLabel`), given real ISO date/time values and the app's "today".
 */
export function formatTaskDueLabel(date: string | undefined, time: string | undefined, today: Date): string {
  if (!date) return time ?? "—";

  const diff = diffInCalendarDays(fromISODate(date), today);
  const relative = diff === 0 ? "Сегодня" : diff === 1 ? "Завтра" : diff === -1 ? "Вчера" : formatShortDate(fromISODate(date));

  if (diff === 0) return time ?? relative;
  return time ? `${relative} ${time}` : relative;
}
