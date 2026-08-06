import type { TaskRecurrenceRule } from "@/types/task";

export type CalendarColor =
  | "blue"
  | "green"
  | "purple"
  | "orange"
  | "pink"
  | "red"
  | "teal"
  | "indigo";

export interface CalendarDefinition {
  id: string;
  name: string;
  color: CalendarColor;
  visible: boolean;
}

/**
 * A recurring series' rule. Reuses `TaskRecurrenceRule`'s vocabulary (same
 * daily/weekdays/weekly/custom scheme, resolved to explicit weekdays) rather
 * than defining a parallel one — recurrence is the same concept wherever it
 * appears. `until` is inclusive; absent means the series has no end date
 * (rendering is still bounded by whatever window the caller expands into,
 * see lib/calendar-recurrence.ts).
 */
export interface EventRecurrence {
  rule: TaskRecurrenceRule;
  weekdays: number[];
  until?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO date, e.g. "2024-07-22" — for a recurring series, this is the anchor/first occurrence. */
  date: string;
  /** 24h "HH:MM" */
  startTime: string;
  /** 24h "HH:MM" */
  endTime: string;
  calendarId: string;
  important: boolean;
  description?: string;
  project?: string;
  projectId?: string;
  task?: string;
  /**
   * Present only on a series' own row. Occurrences are never persisted as
   * separate rows — they're computed on the fly (expandSeriesDates) from
   * this rule for whatever date range is being rendered.
   */
  recurrence?: EventRecurrence;
  /**
   * ISO date keys excluded from this series' generated occurrences — covers
   * both "skip this one" and "delete this one occurrence" (the data model
   * doesn't need to distinguish them: either way, that date no longer
   * renders). Only meaningful when `recurrence` is set.
   */
  skippedDates?: string[];
  /**
   * Present only on an override row: id of the parent recurring series this
   * row stands in for on one specific date (its own `date` field). Used to
   * represent "change just this occurrence" without forking a whole new
   * series or generating one row per future week.
   */
  seriesId?: string;
}

export type CalendarEventDraft = Omit<CalendarEvent, "id">;

export type CalendarViewMode = "day" | "week" | "month" | "agenda";

export type NavigationDirection = "forward" | "backward";

export interface EventFilters {
  colors: CalendarColor[];
  onlyPersonal: boolean;
  onlyWork: boolean;
  onlyTasks: boolean;
  onlyEvents: boolean;
  onlyImportant: boolean;
  onlyWithDescription: boolean;
  dateFrom: string | null;
  dateTo: string | null;
}

export type CalendarDeleteMode = "withEvents" | "moveEvents";
