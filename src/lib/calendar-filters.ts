import type { CalendarDefinition, CalendarEvent, EventFilters } from "@/types/calendar";

export function createDefaultFilters(): EventFilters {
  return {
    colors: [],
    onlyPersonal: false,
    onlyWork: false,
    onlyTasks: false,
    onlyEvents: false,
    onlyImportant: false,
    onlyWithDescription: false,
    dateFrom: null,
    dateTo: null,
  };
}

export function countActiveFilters(filters: EventFilters): number {
  let count = filters.colors.length > 0 ? 1 : 0;
  if (filters.onlyPersonal) count += 1;
  if (filters.onlyWork) count += 1;
  if (filters.onlyTasks) count += 1;
  if (filters.onlyEvents) count += 1;
  if (filters.onlyImportant) count += 1;
  if (filters.onlyWithDescription) count += 1;
  if (filters.dateFrom || filters.dateTo) count += 1;
  return count;
}

export function matchesEventFilters(
  event: CalendarEvent,
  calendar: CalendarDefinition | undefined,
  filters: EventFilters,
): boolean {
  if (filters.colors.length > 0 && (!calendar || !filters.colors.includes(calendar.color))) return false;
  if (filters.onlyPersonal && event.calendarId !== "personal") return false;
  if (filters.onlyWork && event.calendarId !== "work") return false;
  if (filters.onlyTasks && !event.task) return false;
  if (filters.onlyEvents && event.task) return false;
  if (filters.onlyImportant && !event.important) return false;
  if (filters.onlyWithDescription && !event.description) return false;
  if (filters.dateFrom && event.date < filters.dateFrom) return false;
  if (filters.dateTo && event.date > filters.dateTo) return false;
  return true;
}
