"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { DEFAULT_CALENDARS } from "@/lib/calendar-mock-data";
import { readStorage, writeStorage } from "@/lib/storage";
import { createDefaultFilters, matchesEventFilters } from "@/lib/calendar-filters";
import { UPCOMING_PREVIEW_COUNT } from "@/lib/calendar-constants";
import { type CalendarEntry, eventToEntry, taskToEntry } from "@/lib/calendar-entries";
import { expandSeriesDates } from "@/lib/calendar-recurrence";
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
  isSameDay,
  startOfMonth,
  startOfWeek,
  toISODate,
} from "@/lib/date-utils";
import { timeToMinutes } from "@/lib/calendar-time";
import { recordDailyActivity } from "@/lib/streak";

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
  /** Unique per occurrence — event.id alone collides across a recurring series' multiple upcoming dates. */
  entryId: string;
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
  /**
   * Excludes one occurrence date from a series' generated occurrences —
   * covers both "skip this one" and "delete this one occurrence" (see
   * CalendarEvent.skippedDates). Never creates or removes a row.
   */
  skipOccurrence: (seriesId: string, date: string) => void;

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

  const [calendars, setCalendars] = useState<CalendarDefinition[]>(DEFAULT_CALENDARS);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
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

  // Blocks a second update/delete/skip on the same event id while one is
  // still in flight — same guard shape as tasks' pendingTaskIdsRef.
  const pendingEventIdsRef = useRef<Set<string>>(new Set());

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
    setAnchorDate((prev) => {
      if (isSameDay(prev, today)) return prev; // already there — no animation, no flicker
      setDirection(today.getTime() >= prev.getTime() ? "forward" : "backward");
      setNavCounter((n) => n + 1);
      setMiniMonth(startOfMonth(today));
      return today;
    });
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

  // Generous, fixed rendering window for recurring series — covers the
  // month grid plus a few months of lookahead for the "upcoming" widgets,
  // without generating occurrences forever. Tied to `today`, not to
  // whatever the Calendar page's view currently is, so Dashboard's "today"
  // lookups stay correct even before the Calendar page has ever mounted.
  const occurrenceRangeStart = useMemo(() => addDays(today, -60), [today]);
  const occurrenceRangeEnd = useMemo(() => {
    const monthGridEnd = monthGrid[monthGrid.length - 1];
    const upcomingHorizon = addDays(today, 120);
    return monthGridEnd.getTime() > upcomingHorizon.getTime() ? monthGridEnd : upcomingHorizon;
  }, [monthGrid, today]);

  // Series id -> set of dates that have their own override row (see
  // CalendarEvent.seriesId) — expansion skips generating a virtual
  // occurrence wherever a real row already stands in for that date.
  const overrideDatesBySeriesId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const event of events) {
      if (!event.seriesId) continue;
      const set = map.get(event.seriesId) ?? new Set<string>();
      set.add(event.date);
      map.set(event.seriesId, set);
    }
    return map;
  }, [events]);

  // Single merged view of real calendar events + date-bearing tasks — the
  // shared source every grid/month/agenda component renders from. Recurring
  // series are expanded into one entry per occurrence date here — nothing
  // about a series is ever stored per-occurrence.
  const visibleEntries = useMemo<CalendarEntry[]>(() => {
    const eventEntries: CalendarEntry[] = [];
    if (!filters.onlyTasks) {
      for (const event of visibleEvents) {
        const color = calendarById.get(event.calendarId)?.color ?? "blue";
        if (event.recurrence && event.recurrence.rule !== "none") {
          const overrides = overrideDatesBySeriesId.get(event.id);
          for (const date of expandSeriesDates(event, occurrenceRangeStart, occurrenceRangeEnd)) {
            if (overrides?.has(date)) continue;
            eventEntries.push(eventToEntry(event, color, date));
          }
        } else {
          eventEntries.push(eventToEntry(event, color));
        }
      }
    }

    const taskEntries = filters.onlyEvents
      ? []
      : tasksStore.tasks
          .filter((task) => !task.completed && task.date)
          .filter((task) => (filters.onlyImportant ? task.important : true))
          .map((task) => taskToEntry(task))
          .filter((entry): entry is CalendarEntry => entry !== null);

    return [...eventEntries, ...taskEntries];
  }, [
    visibleEvents,
    calendarById,
    filters,
    tasksStore.tasks,
    overrideDatesBySeriesId,
    occurrenceRangeStart,
    occurrenceRangeEnd,
  ]);

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

    const dated: { event: CalendarEvent; date: string }[] = [];
    for (const event of visibleEvents) {
      if (event.recurrence && event.recurrence.rule !== "none") {
        const overrides = overrideDatesBySeriesId.get(event.id);
        for (const date of expandSeriesDates(event, today, occurrenceRangeEnd)) {
          if (overrides?.has(date)) continue;
          dated.push({ event, date });
        }
      } else if (event.date >= todayIso) {
        dated.push({ event, date: event.date });
      }
    }

    return dated
      .sort((a, b) =>
        a.date === b.date
          ? timeToMinutes(a.event.startTime) - timeToMinutes(b.event.startTime)
          : a.date.localeCompare(b.date),
      )
      .map(({ event, date }) => {
        let dateLabel: string;
        if (date === todayIso) dateLabel = `Сегодня, ${event.startTime} – ${event.endTime}`;
        else if (date === tomorrowIso) dateLabel = `Завтра, ${event.startTime} – ${event.endTime}`;
        else dateLabel = `${formatFullDateLabel(fromISODate(date))}, ${event.startTime} – ${event.endTime}`;
        return { entryId: `${event.id}:${date}`, event, dateLabel };
      });
  }, [visibleEvents, today, overrideDatesBySeriesId, occurrenceRangeEnd]);

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
      // Deleting a whole series also drops its per-occurrence override rows
      // (see CalendarEvent.seriesId) — they exist only to stand in for one
      // date of this series, so there's nothing left for them to override
      // once it's gone. They aren't archived separately: the series' own
      // archive entry (above) already covers "this series was deleted".
      setEvents((prev) => prev.filter((item) => item.id !== id && item.seriesId !== id));
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
    recordDailyActivity();
    return event;
  }, []);

  const updateEvent = useCallback((id: string, changes: Partial<CalendarEventDraft>) => {
    if (pendingEventIdsRef.current.has(id)) return;
    pendingEventIdsRef.current.add(id);
    setEvents((prev) => prev.map((event) => (event.id === id ? { ...event, ...changes } : event)));
    // Local-only store, no network round trip — release on the next tick so
    // a genuine same-tick double-submit is still blocked.
    requestAnimationFrame(() => pendingEventIdsRef.current.delete(id));
  }, []);

  const deleteEvent = useCallback(
    (id: string) => {
      if (pendingEventIdsRef.current.has(id)) return;
      pendingEventIdsRef.current.add(id);
      archiveAndRemoveEvent(id);
      setSelectedEntryId((current) => (current === `event:${id}` ? null : current));
      setModalState((current) => (current?.mode === "edit" && current.eventId === id ? null : current));
      requestAnimationFrame(() => pendingEventIdsRef.current.delete(id));
    },
    [archiveAndRemoveEvent],
  );

  const skipOccurrence = useCallback((seriesId: string, date: string) => {
    const guardKey = `${seriesId}:${date}`;
    if (pendingEventIdsRef.current.has(guardKey)) return;
    pendingEventIdsRef.current.add(guardKey);
    setEvents((prev) =>
      prev.map((event) =>
        event.id === seriesId
          ? { ...event, skippedDates: event.skippedDates?.includes(date) ? event.skippedDates : [...(event.skippedDates ?? []), date] }
          : event,
      ),
    );
    requestAnimationFrame(() => pendingEventIdsRef.current.delete(guardKey));
  }, []);

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
    skipOccurrence,

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
