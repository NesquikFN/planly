import { diffInCalendarDays, formatShortDate, fromISODate } from "@/lib/date-utils";
import type { TaskPriority } from "@/types/task";

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

/**
 * Recomputes a task's priority bucket from its date, matching the scheme
 * used everywhere else (stats, filters): no date -> "none", a past day ->
 * "overdue", today -> "important" (the bucket the "Сегодня" filter reads),
 * a future day -> "upcoming". Time-of-day is ignored — day granularity only.
 */
export function computeTaskPriority(date: string | undefined, today: Date): TaskPriority {
  if (!date) return "none";
  const diff = diffInCalendarDays(fromISODate(date), today);
  if (diff < 0) return "overdue";
  if (diff === 0) return "important";
  return "upcoming";
}
