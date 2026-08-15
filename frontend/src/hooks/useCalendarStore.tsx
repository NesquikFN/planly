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
import { useAuth } from "@/hooks/useAuth";
import { calendarApi, getErrorMessage } from "@/lib/api-client";
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

// Calendars (the coloured lists themselves) have no cloud table — they are
// a purely local grouping, and `calendarId` is a plain text column on the
// event. Events, by contrast, are cloud-owned; this key is only their cache.
const CALENDARS_STORAGE_KEY = "planly:calendars";
const EVENTS_STORAGE_KEY = "planly:events";
const EVENTS_MIGRATION_FLAG_PREFIX = "planly:eventsMigrated:";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Local events created before the cloud backend existed (or by a browser
 * without crypto.randomUUID) can carry ids like "event-1712...", which the
 * API rejects — `calendar_events.id` is a uuid column. Rewrites those to
 * fresh uuids, keeping `seriesId` references pointing at the right row.
 */
function ensureUuidIds(events: CalendarEvent[]): CalendarEvent[] {
  const idMap = new Map<string, string>();
  for (const event of events) {
    if (!UUID_RE.test(event.id)) idMap.set(event.id, generateId("event"));
  }
  if (idMap.size === 0) return events;

  return events.map((event) => ({
    ...event,
    id: idMap.get(event.id) ?? event.id,
    seriesId: event.seriesId ? (idMap.get(event.seriesId) ?? event.seriesId) : event.seriesId,
  }));
}

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

/** Dev builds append the real API message (and log the full error); production shows only the action phrase. */
function reportSyncError(action: string, err: unknown): string {
  const detail = getErrorMessage(err);
  return process.env.NODE_ENV !== "production" ? `${action}: ${detail}` : action;
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
  /** True while the first load from the API is in flight. The cached events are already rendered underneath. */
  loading: boolean;
  /** Last persistence failure, already reverted locally — null when everything is in sync. */
  syncError: string | null;
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

  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [calendars, setCalendars] = useState<CalendarDefinition[]>(DEFAULT_CALENDARS);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  // Same shape as the tasks store: a slow response for an account the user
  // has since signed out of must never clobber the next account's state.
  const currentUserRef = useRef<string | null>(null);
  const loadInFlightRef = useRef<Set<string>>(new Set());

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

  /**
   * Reconciles with the API: loads this user's events and — the first time
   * only, and only while the cloud still has nothing — uploads whatever the
   * local cache holds, so events created before the backend existed aren't
   * lost. Mirrors the tasks store's loadFromCloud step for step.
   */
  const loadFromCloud = useCallback(async (uid: string) => {
    if (loadInFlightRef.current.has(uid)) return;
    loadInFlightRef.current.add(uid);
    setLoading(true);
    setSyncError(null);
    try {
      const cloudEvents = await calendarApi.list();
      if (currentUserRef.current !== uid) return;

      if (cloudEvents.length === 0) {
        const cached = readStorage<CalendarEvent[] | null>(EVENTS_STORAGE_KEY, null);
        const migrationFlag = `${EVENTS_MIGRATION_FLAG_PREFIX}${uid}`;

        if (cached && cached.length > 0 && !readStorage(migrationFlag, false)) {
          const migratable = ensureUuidIds(cached);
          try {
            // Series first: an override row's seriesId references one, and
            // the API rejects a reference to a series it can't see yet.
            const ordered = [...migratable].sort((a, b) => Number(Boolean(a.seriesId)) - Number(Boolean(b.seriesId)));
            for (const event of ordered) {
              await calendarApi.create(event);
            }
            if (currentUserRef.current !== uid) return;
            writeStorage(migrationFlag, true);
            const reloaded = await calendarApi.list();
            if (currentUserRef.current !== uid) return;
            setEvents(reloaded);
            writeStorage(EVENTS_STORAGE_KEY, reloaded);
          } catch (migrateErr) {
            // The local cache is already on screen — nothing lost, just not migrated yet.
            setSyncError(reportSyncError("Не удалось перенести локальные события в облако", migrateErr));
          }
          return;
        }
      }

      setEvents(cloudEvents);
      writeStorage(EVENTS_STORAGE_KEY, cloudEvents);
    } catch (err) {
      if (currentUserRef.current !== uid) return;
      setSyncError(reportSyncError("Не удалось загрузить события", err));
    } finally {
      loadInFlightRef.current.delete(uid);
      if (currentUserRef.current === uid) setLoading(false);
    }
  }, []);

  // Runs on every sign-in/sign-out. Shows this user's local cache
  // synchronously (before any network round trip), then reconciles.
  useEffect(() => {
    currentUserRef.current = userId;
    setSyncError(null);

    const storedCalendars = readStorage<CalendarDefinition[] | null>(CALENDARS_STORAGE_KEY, null);
    if (storedCalendars && storedCalendars.length > 0) setCalendars(storedCalendars);

    if (!userId) {
      setEvents([]);
      setHydrated(true);
      return;
    }

    const storedEvents = readStorage<CalendarEvent[] | null>(EVENTS_STORAGE_KEY, null);
    setEvents(storedEvents ?? []);
    setHydrated(true);
    loadFromCloud(userId);
  }, [userId, loadFromCloud]);

  useEffect(() => {
    if (hydrated) writeStorage(CALENDARS_STORAGE_KEY, calendars);
  }, [calendars, hydrated]);

  // Cache only — the API is the source of truth. Kept so a reload paints
  // the calendar instantly instead of waiting on the network.
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
      // Overrides of this series go away with it — locally here, and in the
      // database through `series_id ... on delete cascade`. Snapshotted so a
      // failed delete can put every one of them back.
      const removed = events.filter((item) => item.id === id || item.seriesId === id);

      const archiveItem = event
        ? archiveStore.addItem({
            entityType: "event",
            entityId: event.id,
            title: event.title,
            preview: `${event.date} ${event.startTime}–${event.endTime}`,
            sourceModule: "Календарь",
            originalData: event,
          })
        : null;

      // Deleting a whole series also drops its per-occurrence override rows
      // (see CalendarEvent.seriesId) — they exist only to stand in for one
      // date of this series, so there's nothing left for them to override
      // once it's gone. They aren't archived separately: the series' own
      // archive entry (above) already covers "this series was deleted".
      setEvents((prev) => prev.filter((item) => item.id !== id && item.seriesId !== id));

      if (!userId) return;
      calendarApi.remove(id).catch((err) => {
        // Never actually deleted — restore exactly what was on screen.
        setEvents((prev) => [...prev, ...removed.filter((item) => !prev.some((existing) => existing.id === item.id))]);
        if (archiveItem) archiveStore.removeItem(archiveItem.id);
        setSyncError(reportSyncError("Не удалось удалить событие", err));
      });
    },
    [events, archiveStore, userId],
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

  const createEvent = useCallback(
    (draft: CalendarEventDraft) => {
      // Created optimistically with its final id, so the returned event can
      // be selected/edited straight away — the API accepts that id verbatim.
      const event = { id: generateId("event"), ...draft };
      setEvents((prev) => [...prev, event]);
      recordDailyActivity();

      if (userId) {
        calendarApi.create(event).catch((err) => {
          // Never persisted — drop it rather than leave a phantom the user
          // believes was saved.
          setEvents((prev) => prev.filter((item) => item.id !== event.id));
          setSyncError(reportSyncError("Не удалось сохранить событие", err));
        });
      }

      return event;
    },
    [userId],
  );

  const updateEvent = useCallback(
    (id: string, changes: Partial<CalendarEventDraft>) => {
      if (pendingEventIdsRef.current.has(id)) return;
      pendingEventIdsRef.current.add(id);

      let previous: CalendarEvent | undefined;
      setEvents((prev) => {
        previous = prev.find((event) => event.id === id);
        return prev.map((event) => (event.id === id ? { ...event, ...changes } : event));
      });

      if (!userId) {
        requestAnimationFrame(() => pendingEventIdsRef.current.delete(id));
        return;
      }

      calendarApi
        .update(id, changes)
        .then((updated) => setEvents((prev) => prev.map((event) => (event.id === id ? updated : event))))
        .catch((err) => {
          setEvents((prev) => (previous ? prev.map((event) => (event.id === id ? previous! : event)) : prev));
          setSyncError(reportSyncError("Не удалось сохранить событие", err));
        })
        .finally(() => pendingEventIdsRef.current.delete(id));
    },
    [userId],
  );

  const rescheduleEntry = useCallback(
    (entry: CalendarEntry, changes: { date: string; startTime: string | null; endTime: string | null }) => {
      if (entry.kind === "event") {
        const current = events.find((event) => event.id === entry.sourceId);
        if (!current) return;
        // Routed through updateEvent so a drag-and-drop reschedule persists
        // (and rolls back on failure) exactly like an edit from the modal.
        updateEvent(entry.sourceId, {
          date: changes.date,
          startTime: changes.startTime ?? current.startTime,
          endTime: changes.endTime ?? current.endTime,
        });
      } else {
        tasksStore.rescheduleTask(entry.sourceId, changes.date, changes.startTime ?? undefined);
      }
    },
    [tasksStore, events, updateEvent],
  );

  const deleteEvent = useCallback(
    (id: string) => {
      if (pendingEventIdsRef.current.has(id)) return;
      pendingEventIdsRef.current.add(id);
      archiveAndRemoveEvent(id);
      setSelectedEntryId((current) => (current === `event:${id}` ? null : current));
      setModalState((current) => (current?.mode === "edit" && current.eventId === id ? null : current));
      // The DELETE itself is fire-and-forget inside archiveAndRemoveEvent
      // (it owns the rollback). Releasing on the next frame still blocks the
      // case this guard exists for: a same-tick double-submit.
      requestAnimationFrame(() => pendingEventIdsRef.current.delete(id));
    },
    [archiveAndRemoveEvent],
  );

  const skipOccurrence = useCallback(
    (seriesId: string, date: string) => {
      const guardKey = `${seriesId}:${date}`;
      if (pendingEventIdsRef.current.has(guardKey)) return;
      pendingEventIdsRef.current.add(guardKey);

      let previous: CalendarEvent | undefined;
      let nextSkipped: string[] | undefined;
      setEvents((prev) =>
        prev.map((event) => {
          if (event.id !== seriesId) return event;
          previous = event;
          nextSkipped = event.skippedDates?.includes(date) ? event.skippedDates : [...(event.skippedDates ?? []), date];
          return { ...event, skippedDates: nextSkipped };
        }),
      );

      if (!userId || !nextSkipped) {
        requestAnimationFrame(() => pendingEventIdsRef.current.delete(guardKey));
        return;
      }

      // The whole exception list is sent, not a delta: it's a single column
      // on the series row, and a delta would need a read-modify-write that
      // two concurrent skips could interleave badly.
      calendarApi
        .update(seriesId, { skippedDates: nextSkipped })
        .catch((err) => {
          setEvents((prev) => (previous ? prev.map((event) => (event.id === seriesId ? previous! : event)) : prev));
          setSyncError(reportSyncError("Не удалось пропустить событие", err));
        })
        .finally(() => pendingEventIdsRef.current.delete(guardKey));
    },
    [userId],
  );

  /** Reinserts a full event snapshot — used only by the Archive restore pipeline. */
  const restoreDeletedEvent = useCallback(
    (event: CalendarEvent) => {
      setEvents((prev) => (prev.some((item) => item.id === event.id) ? prev : [...prev, event]));

      if (!userId) return;
      // A restore is a fresh insert with the original id: the row was really
      // deleted when it was archived, so POST (not PATCH) is what applies.
      calendarApi.create(event).catch((err) => {
        setEvents((prev) => prev.filter((item) => item.id !== event.id));
        setSyncError(reportSyncError("Не удалось восстановить событие", err));
      });
    },
    [userId],
  );

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
    loading,
    syncError,
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
