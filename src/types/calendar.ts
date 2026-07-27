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

export interface CalendarEvent {
  id: string;
  title: string;
  /** ISO date, e.g. "2024-07-22" */
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
