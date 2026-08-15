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
import { useClock } from "@/hooks/useClock";
import { useArchiveStore } from "@/hooks/useArchiveStore";
import { useNotesStore } from "@/hooks/useNotesStore";
import {
  applySnooze,
  getNextReminder,
  getReminderDateTime,
  groupReminders,
  matchesQuickFilter,
  sortReminders,
  type ReminderGroup,
  type ReminderSortKey,
  type SnoozeOption,
} from "@/lib/reminders";
import { readStorage, writeStorage } from "@/lib/storage";
import type {
  QuickFilterKey,
  Reminder,
  ReminderCategory,
  ReminderDraft,
  ReminderPriority,
  ReminderRepeat,
} from "@/types/reminder";

const REMINDERS_STORAGE_KEY = "planly:reminders";

export type RemindersViewMode = "list" | "schedule";

interface RemindersStoreValue {
  hydrated: boolean;
  now: Date;
  today: Date;
  reminders: Reminder[];
  visibleReminders: Reminder[];
  groups: ReminderGroup[];
  stats: { today: number; upcoming: number; overdue: number; completed: number };
  nextReminder: Reminder | null;
  upcomingReminders: Reminder[];

  activeQuickFilter: QuickFilterKey;
  setActiveQuickFilter: (filter: QuickFilterKey) => void;
  activeCategory: ReminderCategory | null;
  setActiveCategory: (category: ReminderCategory | null) => void;
  activeRepeat: ReminderRepeat | null;
  setActiveRepeat: (repeat: ReminderRepeat | null) => void;
  selectedDateKey: string | null;
  toggleSelectedDate: (dateKey: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  priorityFilter: ReminderPriority | null;
  setPriorityFilter: (priority: ReminderPriority | null) => void;
  sortKey: ReminderSortKey;
  setSortKey: (key: ReminderSortKey) => void;
  viewMode: RemindersViewMode;
  setViewMode: (mode: RemindersViewMode) => void;
  collapsedGroups: Set<string>;
  toggleCollapsedGroup: (key: string) => void;

  createReminder: (draft: ReminderDraft) => string;
  updateReminder: (id: string, draft: ReminderDraft) => void;
  toggleComplete: (id: string) => void;
  toggleStar: (id: string) => void;
  postponeReminder: (id: string, option: SnoozeOption) => void;
  deleteReminder: (id: string) => void;
  /** Reinserts a full reminder snapshot — used only by the Archive restore pipeline. */
  restoreDeletedReminder: (reminder: Reminder) => void;
}

const RemindersContext = createContext<RemindersStoreValue | null>(null);

export function ReminderProvider({ children }: { children: ReactNode }) {
  const { now, today, todayKey } = useClock();
  const archiveStore = useArchiveStore();
  const { notes } = useNotesStore();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [activeQuickFilter, setActiveQuickFilterState] = useState<QuickFilterKey>("all");
  const [activeCategory, setActiveCategory] = useState<ReminderCategory | null>(null);
  const [activeRepeat, setActiveRepeat] = useState<ReminderRepeat | null>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<ReminderPriority | null>(null);
  const [sortKey, setSortKey] = useState<ReminderSortKey>("time");
  const [viewMode, setViewMode] = useState<RemindersViewMode>("list");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = readStorage<Reminder[] | null>(REMINDERS_STORAGE_KEY, null);
    setReminders(stored ?? []);
    setHydrated(true);
    // Hydration must happen once; subsequent changes are persisted below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(REMINDERS_STORAGE_KEY, reminders);
  }, [hydrated, reminders]);

  useEffect(() => {
    if (!hydrated || !archiveStore.hydrated) return;
    const archivedNoteIds = new Set(archiveStore.items.filter((item) => item.entityType === "note").map((item) => item.entityId));
    setReminders((current) => current.map((reminder) => {
      const noteId = reminder.links?.note;
      if (!noteId || notes.some((note) => note.id === noteId) || archivedNoteIds.has(noteId)) return reminder;
      const links = { ...reminder.links };
      delete links.note;
      delete links.noteLabel;
      return { ...reminder, links: Object.keys(links).length ? links : undefined };
    }));
  }, [notes, archiveStore.items, archiveStore.hydrated, hydrated]);

  const setActiveQuickFilter = useCallback((filter: QuickFilterKey) => {
    setActiveQuickFilterState(filter);
    setSelectedDateKey(null);
  }, []);

  const toggleSelectedDate = useCallback((dateKey: string) => {
    setSelectedDateKey((current) => (current === dateKey ? null : dateKey));
  }, []);

  const toggleCollapsedGroup = useCallback((key: string) => {
    setCollapsedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const visibleReminders = useMemo(() => {
    let list = reminders;

    if (selectedDateKey) {
      list = list.filter((reminder) => reminder.date === selectedDateKey);
    } else {
      list = list.filter((reminder) => matchesQuickFilter(reminder, activeQuickFilter, now, todayKey));
    }

    if (activeCategory) list = list.filter((reminder) => reminder.category === activeCategory);
    if (activeRepeat) list = list.filter((reminder) => reminder.repeat === activeRepeat);
    if (priorityFilter) list = list.filter((reminder) => reminder.priority === priorityFilter);

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (reminder) =>
          reminder.title.toLowerCase().includes(query) || (reminder.description ?? "").toLowerCase().includes(query),
      );
    }

    return sortReminders(list, sortKey);
  }, [activeCategory, activeQuickFilter, activeRepeat, now, priorityFilter, reminders, searchQuery, selectedDateKey, sortKey, todayKey]);

  const groups = useMemo(() => {
    if (activeQuickFilter === "completed" && !selectedDateKey) {
      return visibleReminders.length > 0
        ? [{ key: "completed", label: "Выполненные", reminders: visibleReminders }]
        : [];
    }
    return groupReminders(visibleReminders, now);
  }, [activeQuickFilter, now, selectedDateKey, visibleReminders]);

  const stats = useMemo(
    () => ({
      today: reminders.filter((reminder) => matchesQuickFilter(reminder, "today", now, todayKey)).length,
      upcoming: reminders.filter((reminder) => matchesQuickFilter(reminder, "upcoming", now, todayKey)).length,
      overdue: reminders.filter((reminder) => matchesQuickFilter(reminder, "overdue", now, todayKey)).length,
      completed: reminders.filter((reminder) => reminder.completed).length,
    }),
    [now, reminders, todayKey],
  );

  const nextReminder = useMemo(() => getNextReminder(reminders, now), [now, reminders]);

  const upcomingReminders = useMemo(
    () =>
      reminders
        .filter((reminder) => !reminder.completed)
        .map((reminder) => ({ reminder, dateTime: getReminderDateTime(reminder) }))
        .filter((entry): entry is { reminder: Reminder; dateTime: Date } => entry.dateTime !== null && entry.dateTime >= now)
        .sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
        .slice(0, 5)
        .map(({ reminder }) => reminder),
    [now, reminders],
  );

  const createReminder = useCallback((draft: ReminderDraft) => {
    const reminder: Reminder = {
      ...draft,
      id: `r-${Date.now()}`,
      completed: false,
      starred: false,
    };
    setReminders((current) => [reminder, ...current]);
    return reminder.id;
  }, []);

  const updateReminder = useCallback((id: string, draft: ReminderDraft) => {
    setReminders((current) => current.map((reminder) => (reminder.id === id ? { ...reminder, ...draft } : reminder)));
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setReminders((current) =>
      current.map((reminder) => {
        if (reminder.id !== id) return reminder;
        const completed = !reminder.completed;
        return { ...reminder, completed, completedLabel: completed ? "Только что" : undefined };
      }),
    );
  }, []);

  const toggleStar = useCallback((id: string) => {
    setReminders((current) =>
      current.map((reminder) => (reminder.id === id ? { ...reminder, starred: !reminder.starred } : reminder)),
    );
  }, []);

  const postponeReminder = useCallback(
    (id: string, option: SnoozeOption) => {
      setReminders((current) =>
        current.map((reminder) =>
          reminder.id === id ? { ...reminder, ...applySnooze(reminder, option, now) } : reminder,
        ),
      );
    },
    [now],
  );

  const deleteReminder = useCallback(
    (id: string) => {
      const target = reminders.find((reminder) => reminder.id === id);
      if (target) {
        archiveStore.addItem({
          entityType: "reminder",
          entityId: target.id,
          title: target.title,
          preview: target.description ?? target.date,
          sourceModule: "Напоминания",
          originalData: target,
        });
      }
      setReminders((current) => current.filter((reminder) => reminder.id !== id));
    },
    [reminders, archiveStore],
  );

  /** Reinserts a full reminder snapshot — used only by the Archive restore pipeline. */
  const restoreDeletedReminder = useCallback((reminder: Reminder) => {
    setReminders((current) => [reminder, ...current]);
  }, []);

  const value: RemindersStoreValue = {
    hydrated,
    now,
    today,
    reminders,
    visibleReminders,
    groups,
    stats,
    nextReminder,
    upcomingReminders,
    activeQuickFilter,
    setActiveQuickFilter,
    activeCategory,
    setActiveCategory,
    activeRepeat,
    setActiveRepeat,
    selectedDateKey,
    toggleSelectedDate,
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    sortKey,
    setSortKey,
    viewMode,
    setViewMode,
    collapsedGroups,
    toggleCollapsedGroup,
    createReminder,
    updateReminder,
    toggleComplete,
    toggleStar,
    postponeReminder,
    deleteReminder,
    restoreDeletedReminder,
  };

  return <RemindersContext.Provider value={value}>{children}</RemindersContext.Provider>;
}

export function useRemindersStore(): RemindersStoreValue {
  const context = useContext(RemindersContext);
  if (!context) throw new Error("useRemindersStore must be used within a ReminderProvider");
  return context;
}
