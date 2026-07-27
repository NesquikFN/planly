"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  CalendarColor,
  CalendarDefinition,
  CalendarDeleteMode,
  CalendarEvent,
  CalendarEventDraft,
  CalendarViewMode,
  EventFilters,
  NavigationDirection,
} from "@/types/calendar";
import { mockCalendars, createMockEvents } from "@/lib/calendar-mock-data";
import { readStorage, writeStorage } from "@/lib/storage";
import { createDefaultFilters, matchesEventFilters } from "@/lib/calendar-filters";
import { UPCOMING_PREVIEW_COUNT } from "@/lib/calendar-constants";
import { type CalendarEntry, eventToEntry, taskToEntry } from "@/lib/calendar-entries";
import { useTasksStore } from "@/hooks/useTasksStore";
import { useClock } from "@/hooks/useClock";
import { useArchiveStore } from "@/hooks/useArchiveStore";
import {
  addDays,
  addMonths,
  fromISODate,
  formatFullDateLabel,
  formatMonthYear,
  getMonthGrid,
  getWeekDays,
  startOfMonth,
  startOfWeek,
  toISODate,
} from "@/lib/date-utils";
import { timeToMinutes } from "@/lib/calendar-time";

const CALENDARS_STORAGE_KEY = "planly:calendars";
const EVENTS_STORAGE_KEY = "planly:events";

export type CalendarModalState =
  | { mode: "create"; defaults: Partial<CalendarEventDraft> }
  | { mode: "edit"; eventId: string }
  | null;

export type CalendarFormState = { mode: "create" } | { mode: "edit"; calendarId: string } | null;

export interface CalendarDeleteRequest {
  calendarId: string;
}

interface UpcomingEntry {
  event: CalendarEvent;
  dateLabel: string;
}

function generateId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function stepAnchor(viewMode: CalendarViewMode, anchor: Date, direction: 1 | -1): Date {
  switch (viewMode) {
    case "day":
      return addDays(anchor, direction);
    case "month":
      return addMonths(anchor, direction);
    case "week":
    case "agenda":
    default:
      return addDays(anchor, direction * 7);
  }
}

interface CalendarStoreValue {
  today: Date;
  nowMinutes: number;
  hydrated: boolean;

  calendars: CalendarDefinition[];
  calendarById: Map<string, CalendarDefinition>;
  toggleCalendarVisibility: (id: string) => void;

  events: CalendarEvent[];
  visibleEvents: CalendarEvent[];
  visibleEntries: CalendarEntry[];
  entriesByDate: Map<string, CalendarEntry[]>;

  viewMode: CalendarViewMode;
  setViewMode: (mode: CalendarViewMode) => void;

  anchorDate: Date;
  weekStart: Date;
  weekDays: Date[];
  monthStart: Date;
  monthGrid: Date[];
  periodLabel: string;

  direction: NavigationDirection;
  navCounter: number;
  goToToday: () => void;
  goToPrevious: () => void;
  goToNext: () => void;
  goToDate: (date: Date) => void;
  goToDayView: (date: Date) => void;
  openTodayInDayView: () => void;

  miniMonth: Date;
  goToPreviousMiniMonth: () => void;
  goToNextMiniMonth: () => void;

  filters: EventFilters;
  applyFilters: (next: EventFilters) => void;
  resetFilters: () => void;

  upcomingEvents: UpcomingEntry[];
  upcomingTotalCount: number;
  upcomingExpanded: boolean;
  toggleUpcomingExpanded: () => void;

  selectedEntryId: string | null;
  selectEntry: (id: string | null) => void;

  modalState: CalendarModalState;
  openCreateModal: (defaults?: Partial<CalendarEventDraft>) => void;
  openEditModal: (id: string) => void;
  closeModal: () => void;
  openEntryEditor: (entry: CalendarEntry) => void;
  deleteEntry: (entry: CalendarEntry) => void;
  toggleEntryComplete: (entry: CalendarEntry) => void;
  rescheduleEntry: (
    entry: CalendarEntry,
    changes: { date: string; startTime: string | null; endTime: string | null },
  ) => void;

  createEvent: (draft: CalendarEventDraft) => CalendarEvent;
  updateEvent: (id: string, changes: Partial<CalendarEventDraft>) => void;
  deleteEvent: (id: string) => void;
  restoreDeletedEvent: (event: CalendarEvent) => void;

  calendarFormState: CalendarFormState;
  openCreateCalendarForm: () => void;
  openEditCalendarForm: (id: string) => void;
  closeCalendarForm: () => void;
  createCalendar: (name: string, color: CalendarColor) => void;
  renameCalendar: (id: string, name: string) => void;
  recolorCalendar: (id: string, color: CalendarColor) => void;

  calendarDeleteRequest: CalendarDeleteRequest | null;
  requestDeleteCalendar: (id: string) => void;
  cancelDeleteCalendar: () => void;
  confirmDeleteCalendar: (mode: CalendarDeleteMode, targetCalendarId?: string) => void;
}

const CalendarContext = createContext<CalendarStoreValue | null>(null);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const tasksStore = useTasksStore();
  const archiveStore = useArchiveStore();
  const { now, today } = useClock();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const [calendars, setCalendars] = useState<CalendarDefinition[]>(mockCalendars);
  const [events, setEvents] = useState<CalendarEvent[]>(() => createMockEvents(today));
  const [hydrated, setHydrated] = useState(false);

  const [anchorDate, setAnchorDate] = useState<Date>(today);
  const [miniMonth, setMiniMonth] = useState<Date>(() => startOfMonth(today));
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week");
  const [direction, setDirection] = useState<NavigationDirection>("forward");
  const [navCounter, setNavCounter] = useState(0);

  const [filters, setFilters] = useState<EventFilters>(() => createDefaultFilters());
  const [upcomingExpanded, setUpcomingExpanded] = useState(false);

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<CalendarModalState>(null);

  const [calendarFormState, setCalendarFormState] = useState<CalendarFormState>(null);
  const [calendarDeleteRequest, setCalendarDeleteRequest] = useState<CalendarDeleteRequest | null>(null);

  useEffect(() => {
    const storedCalendars = readStorage<CalendarDefinition[] | null>(CALENDARS_STORAGE_KEY, null);
    if (storedCalendars && storedCalendars.length > 0) setCalendars(storedCalendars);

    const storedEvents = readStorage<CalendarEvent[] | null>(EVENTS_STORAGE_KEY, null);
    if (storedEvents) setEvents(storedEvents);

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(CALENDARS_STORAGE_KEY, calendars);
  }, [calendars, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(EVENTS_STORAGE_KEY, events);
  }, [events, hydrated]);

  const calendarById = useMemo(() => new Map(calendars.map((cal) => [cal.id, cal])), [calendars]);

  const toggleCalendarVisibility = useCallback((id: string) => {
    setCalendars((prev) => prev.map((cal) => (cal.id === id ? { ...cal, visible: !cal.visible } : cal)));
  }, []);

  const weekStart = useMemo(() => startOfWeek(anchorDate), [anchorDate]);
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const monthStart = useMemo(() => startOfMonth(anchorDate), [anchorDate]);
  const monthGrid = useMemo(() => getMonthGrid(monthStart), [monthStart]);

  const periodLabel = useMemo(() => {
    if (viewMode === "day") return formatFullDateLabel(anchorDate);
    if (viewMode === "month") return formatMonthYear(monthStart);
    if (viewMode === "agenda") return formatMonthYear(anchorDate);
    // week — label by whichever month the week's Thursday falls in
    return formatMonthYear(addDays(weekStart, 3));
  }, [viewMode, anchorDate, monthStart, weekStart]);

  const goToToday = useCallback(() => {
    setAnchorDate(today);
    setMiniMonth(startOfMonth(today));
  }, [today]);

  const goToPrevious = useCallback(() => {
    setDirection("backward");
    setNavCounter((n) => n + 1);
    setAnchorDate((prev) => {
      const next = stepAnchor(viewMode, prev, -1);
      setMiniMonth(startOfMonth(next));
      return next;
    });
  }, [viewMode]);

  const goToNext = useCallback(() => {
    setDirection("forward");
    setNavCounter((n) => n + 1);
    setAnchorDate((prev) => {
      const next = stepAnchor(viewMode, prev, 1);
      setMiniMonth(startOfMonth(next));
      return next;
    });
  }, [viewMode]);

  const goToDate = useCallback((date: Date) => {
    setAnchorDate(date);
    setMiniMonth(startOfMonth(date));
  }, []);

  const goToDayView = useCallback((date: Date) => {
    setAnchorDate(date);
    setMiniMonth(startOfMonth(date));
    setViewMode("day");
  }, []);

  const openTodayInDayView = useCallback(() => {
    setAnchorDate(today);
    setMiniMonth(startOfMonth(today));
    setViewMode("day");
  }, [today]);

  const goToPreviousMiniMonth = useCallback(() => {
    setMiniMonth((prev) => addMonths(prev, -1));
  }, []);

  const goToNextMiniMonth = useCallback(() => {
    setMiniMonth((prev) => addMonths(prev, 1));
  }, []);

  const applyFilters = useCallback((next: EventFilters) => {
    setFilters(next);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(createDefaultFilters());
  }, []);

  const toggleUpcomingExpanded = useCallback(() => {
    setUpcomingExpanded((value) => !value);
  }, []);

  const visibleEvents = useMemo(() => {
    const visibleIds = new Set(calendars.filter((cal) => cal.visible).map((cal) => cal.id));
    return events.filter((event) => {
      if (!visibleIds.has(event.calendarId)) return false;
      return matchesEventFilters(event, calendarById.get(event.calendarId), filters);
    });
  }, [events, calendars, calendarById, filters]);

  // Single merged view of real calendar events + date-bearing tasks — the
  // shared source every grid/month/agenda component renders from.
  const visibleEntries = useMemo<CalendarEntry[]>(() => {
    const eventEntries = filters.onlyTasks
      ? []
      : visibleEvents.map((event) => eventToEntry(event, calendarById.get(event.calendarId)?.color ?? "blue"));

    const taskEntries = filters.onlyEvents
      ? []
      : tasksStore.tasks
          .filter((task) => !task.completed && task.date)
          .filter((task) => (filters.onlyImportant ? task.important : true))
          .map((task) => taskToEntry(task))
          .filter((entry): entry is CalendarEntry => entry !== null);

    return [...eventEntries, ...taskEntries];
  }, [visibleEvents, calendarById, filters, tasksStore.tasks]);

  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    for (const entry of visibleEntries) {
      const list = map.get(entry.date);
      if (list) list.push(entry);
      else map.set(entry.date, [entry]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => {
        if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;
        return (a.startTime ?? "").localeCompare(b.startTime ?? "");
      });
    }
    return map;
  }, [visibleEntries]);

  const sortedUpcoming = useMemo<UpcomingEntry[]>(() => {
    const todayIso = toISODate(today);
    const tomorrowIso = toISODate(addDays(today, 1));

    return [...visibleEvents]
      .filter((event) => event.date >= todayIso)
      .sort((a, b) =>
        a.date === b.date ? timeToMinutes(a.startTime) - timeToMinutes(b.startTime) : a.date.localeCompare(b.date),
      )
      .map((event) => {
        let dateLabel: string;
        if (event.date === todayIso) dateLabel = `Сегодня, ${event.startTime} – ${event.endTime}`;
        else if (event.date === tomorrowIso) dateLabel = `Завтра, ${event.startTime} – ${event.endTime}`;
        else dateLabel = `${formatFullDateLabel(fromISODate(event.date))}, ${event.startTime} – ${event.endTime}`;
        return { event, dateLabel };
      });
  }, [visibleEvents, today]);

  const upcomingEvents = upcomingExpanded ? sortedUpcoming : sortedUpcoming.slice(0, UPCOMING_PREVIEW_COUNT);

  const selectEntry = useCallback((id: string | null) => {
    setSelectedEntryId(id);
  }, []);

  const openCreateModal = useCallback((defaults: Partial<CalendarEventDraft> = {}) => {
    setSelectedEntryId(null);
    setModalState({ mode: "create", defaults });
  }, []);

  const openEditModal = useCallback((id: string) => {
    setModalState({ mode: "edit", eventId: id });
  }, []);

  const closeModal = useCallback(() => {
    setModalState(null);
  }, []);

  // Single edit entry point per rendered item — routes to the calendar's own
  // modal for events, and to the task editor for tasks. Never both at once.
  const openEntryEditor = useCallback(
    (entry: CalendarEntry) => {
      if (entry.kind === "event") {
        setModalState({ mode: "edit", eventId: entry.sourceId });
      } else {
        tasksStore.startEditing(entry.sourceId);
      }
    },
    [tasksStore],
  );

  const archiveAndRemoveEvent = useCallback(
    (id: string) => {
      const event = events.find((item) => item.id === id);
      if (event) {
        archiveStore.addItem({
          entityType: "event",
          entityId: event.id,
          title: event.title,
          preview: `${event.date} ${event.startTime}–${event.endTime}`,
          sourceModule: "Календарь",
          originalData: event,
        });
      }
      setEvents((prev) => prev.filter((item) => item.id !== id));
    },
    [events, archiveStore],
  );

  const deleteEntry = useCallback(
    (entry: CalendarEntry) => {
      if (entry.kind === "event") {
        archiveAndRemoveEvent(entry.sourceId);
        setModalState((current) => (current?.mode === "edit" && current.eventId === entry.sourceId ? null : current));
      } else {
        tasksStore.deleteTask(entry.sourceId);
      }
      setSelectedEntryId((current) => (current === entry.id ? null : current));
    },
    [tasksStore, archiveAndRemoveEvent],
  );

  const toggleEntryComplete = useCallback(
    (entry: CalendarEntry) => {
      if (entry.kind === "task") tasksStore.toggleComplete(entry.sourceId);
    },
    [tasksStore],
  );

  const rescheduleEntry = useCallback(
    (entry: CalendarEntry, changes: { date: string; startTime: string | null; endTime: string | null }) => {
      if (entry.kind === "event") {
        setEvents((prev) =>
          prev.map((event) =>
            event.id === entry.sourceId
              ? {
                  ...event,
                  date: changes.date,
                  startTime: changes.startTime ?? event.startTime,
                  endTime: changes.endTime ?? event.endTime,
                }
              : event,
          ),
        );
      } else {
        tasksStore.rescheduleTask(entry.sourceId, changes.date, changes.startTime ?? undefined);
      }
    },
    [tasksStore],
  );

  const createEvent = useCallback((draft: CalendarEventDraft) => {
    const event = { id: generateId("event"), ...draft };
    setEvents((prev) => [...prev, event]);
    return event;
  }, []);

  const updateEvent = useCallback((id: string, changes: Partial<CalendarEventDraft>) => {
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...event, ...changes } : event)));
  }, []);

  const deleteEvent = useCallback(
    (id: string) => {
      archiveAndRemoveEvent(id);
      setSelectedEntryId((current) => (current === `event:${id}` ? null : current));
      setModalState((current) => (current?.mode === "edit" && current.eventId === id ? null : current));
    },
    [archiveAndRemoveEvent],
  );

  /** Reinserts a full event snapshot — used only by the Archive restore pipeline. */
  const restoreDeletedEvent = useCallback((event: CalendarEvent) => {
    setEvents((prev) => [...prev, event]);
  }, []);

  const openCreateCalendarForm = useCallback(() => setCalendarFormState({ mode: "create" }), []);
  const openEditCalendarForm = useCallback((id: string) => setCalendarFormState({ mode: "edit", calendarId: id }), []);
  const closeCalendarForm = useCallback(() => setCalendarFormState(null), []);

  const createCalendar = useCallback((name: string, color: CalendarColor) => {
    const trimmed = name.trim();
    setCalendars((prev) => [
      ...prev,
      { id: generateId("calendar"), name: trimmed || "Новый календарь", color, visible: true },
    ]);
  }, []);

  const renameCalendar = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCalendars((prev) => prev.map((cal) => (cal.id === id ? { ...cal, name: trimmed } : cal)));
  }, []);

  const recolorCalendar = useCallback((id: string, color: CalendarColor) => {
    setCalendars((prev) => prev.map((cal) => (cal.id === id ? { ...cal, color } : cal)));
  }, []);

  const requestDeleteCalendar = useCallback((id: string) => {
    setCalendarDeleteRequest({ calendarId: id });
  }, []);

  const cancelDeleteCalendar = useCallback(() => {
    setCalendarDeleteRequest(null);
  }, []);

  const confirmDeleteCalendar = useCallback(
    (mode: CalendarDeleteMode, targetCalendarId?: string) => {
      setCalendarDeleteRequest((current) => {
        if (!current) return null;
        const { calendarId } = current;

        setCalendars((prevCalendars) => {
          if (prevCalendars.length <= 1) return prevCalendars; // never delete the last calendar

          if (mode === "withEvents") {
            // Every event in a deleted calendar goes through the same archive
            // pipeline as a single deleteEvent() — no bulk deletion bypasses it.
            for (const event of events.filter((item) => item.calendarId === calendarId)) {
              archiveStore.addItem({
                entityType: "event",
                entityId: event.id,
                title: event.title,
                preview: `${event.date} ${event.startTime}–${event.endTime}`,
                sourceModule: "Календарь",
                originalData: event,
              });
            }
            setEvents((prevEvents) => prevEvents.filter((event) => event.calendarId !== calendarId));
          } else if (mode === "moveEvents" && targetCalendarId) {
            setEvents((prevEvents) =>
              prevEvents.map((event) =>
                event.calendarId === calendarId ? { ...event, calendarId: targetCalendarId } : event,
              ),
            );
          }

          return prevCalendars.filter((cal) => cal.id !== calendarId);
        });

        return null;
      });
    },
    [events, archiveStore],
  );

  const value: CalendarStoreValue = {
    today,
    nowMinutes,
    hydrated,

    calendars,
    calendarById,
    toggleCalendarVisibility,

    events,
    visibleEvents,
    visibleEntries,
    entriesByDate,

    viewMode,
    setViewMode,

    anchorDate,
    weekStart,
    weekDays,
    monthStart,
    monthGrid,
    periodLabel,

    direction,
    navCounter,
    goToToday,
    goToPrevious,
    goToNext,
    goToDate,
    goToDayView,
    openTodayInDayView,

    miniMonth,
    goToPreviousMiniMonth,
    goToNextMiniMonth,

    filters,
    applyFilters,
    resetFilters,

    upcomingEvents,
    upcomingTotalCount: sortedUpcoming.length,
    upcomingExpanded,
    toggleUpcomingExpanded,

    selectedEntryId,
    selectEntry,

    modalState,
    openCreateModal,
    openEditModal,
    closeModal,
    openEntryEditor,
    deleteEntry,
    toggleEntryComplete,
    rescheduleEntry,

    createEvent,
    updateEvent,
    deleteEvent,
    restoreDeletedEvent,

    calendarFormState,
    openCreateCalendarForm,
    openEditCalendarForm,
    closeCalendarForm,
    createCalendar,
    renameCalendar,
    recolorCalendar,

    calendarDeleteRequest,
    requestDeleteCalendar,
    cancelDeleteCalendar,
    confirmDeleteCalendar,
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendarStore(): CalendarStoreValue {
  const ctx = useContext(CalendarContext);
  if (!ctx) throw new Error("useCalendarStore must be used within a CalendarProvider");
  return ctx;
}
