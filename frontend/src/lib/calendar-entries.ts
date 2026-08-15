import type { CalendarColor, CalendarEvent } from "@/types/calendar";
import type { Task } from "@/types/task";
import { MIN_DURATION_MINUTES } from "@/lib/calendar-constants";
import { minutesToTime, timeToMinutes } from "@/lib/calendar-time";

export type CalendarEntryKind = "event" | "task";

/**
 * Normalized shape both real calendar events and date-bearing tasks are
 * rendered as, so the grid/month/agenda views don't need to special-case
 * their source. `id` is a stable, prefixed key (`event:<id>` / `task:<id>`)
 * — never regenerated, safe to use as a React key or a drag identity.
 */
export interface CalendarEntry {
  id: string;
  kind: CalendarEntryKind;
  sourceId: string;
  title: string;
  /** ISO date */
  date: string;
  /** 24h "HH:MM", null = all-day */
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  color: CalendarColor;
  important: boolean;
  /** Only meaningful for kind === "task" */
  completed?: boolean;
  /** True for any occurrence of a recurring event series — display-only (which entries get a repeat icon), not part of the recurrence data model itself. */
  isRecurring: boolean;
}

// Fixed accent for task-derived entries — visually distinct from the
// calendar palette so they never get mistaken for a "calendar" color.
export const TASK_ENTRY_COLOR: CalendarColor = "indigo";

/**
 * `occurrenceDate`, when given, renders one virtual occurrence of a
 * recurring series on that date — `sourceId` still points at the series'
 * real row (so complete/delete/edit act on the series, not a fake id), only
 * `id`/`date` are occurrence-specific. Nothing here is ever persisted; the
 * occurrence dates themselves come from lib/calendar-recurrence.ts.
 */
export function eventToEntry(event: CalendarEvent, color: CalendarColor, occurrenceDate?: string): CalendarEntry {
  const date = occurrenceDate ?? event.date;
  return {
    id: occurrenceDate ? `event:${event.id}:${occurrenceDate}` : `event:${event.id}`,
    kind: "event",
    sourceId: event.id,
    title: event.title,
    date,
    startTime: event.startTime,
    endTime: event.endTime,
    allDay: false,
    color,
    important: event.important,
    isRecurring: Boolean(event.recurrence && event.recurrence.rule !== "none"),
  };
}

export function taskToEntry(task: Task): CalendarEntry | null {
  if (!task.date) return null;
  const allDay = !task.time;
  const endTime = task.time ? minutesToTime(timeToMinutes(task.time) + MIN_DURATION_MINUTES) : null;

  return {
    id: `task:${task.id}`,
    kind: "task",
    sourceId: task.id,
    title: task.title,
    date: task.date,
    startTime: task.time ?? null,
    endTime,
    allDay,
    color: TASK_ENTRY_COLOR,
    important: task.important,
    completed: task.completed,
    isRecurring: false,
  };
}
