"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Task, TaskRecurrence } from "@/types/task";
import { readStorage, writeStorage } from "@/lib/storage";
import { matchesFilter, sortTasks, type FilterKey, type SortKey } from "@/lib/filters";
import { createTaskFromText } from "@/lib/task-parser";
import { computeTaskPriority, formatTaskDueLabel } from "@/lib/task-date";
import { addDays, getLocalDateKey } from "@/lib/date-utils";
import { pickAutoFocusTask } from "@/lib/focus";
import { recordDailyActivity } from "@/lib/streak";
import { useClock } from "@/hooks/useClock";
import { useArchiveStore } from "@/hooks/useArchiveStore";
import { getErrorMessage } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import * as tasksRepository from "@/lib/tasks-repository";

const TASKS_STORAGE_KEY = "planly:tasks";
const FOCUS_STORAGE_KEY = "planly:focus";
const TASKS_MIGRATION_FLAG_PREFIX = "planly:tasksMigrated:";

const EMPTY_TASKS: Task[] = [];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function generateTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Dev builds show the real API message (and log the full error); production shows only the action phrase. */
function reportError(action: string, err: unknown): string {
  const detail = getErrorMessage(err);
  return process.env.NODE_ENV !== "production" ? `${action}: ${detail}` : action;
}

// Temporary dev-only tracing for the delete/complete/recurrence flow — logs
// exactly what each action does (one line per repository call) so a real
// browser session can confirm the call count without guessing. No-op in
// production builds. Remove once the recurrence duplication report is closed.
function debugLog(action: string, details: Record<string, unknown>): void {
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[tasks:${action}]`, details);
  }
}

/** Cloud `tasks.id` is a uuid column — old locally-generated ids from the (rare) non-crypto.randomUUID fallback get a fresh uuid before migrating. */
function ensureUuidIds(list: Task[]): { tasks: Task[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>();
  const tasks = list.map((task) => {
    if (UUID_RE.test(task.id)) return task;
    const newId = generateTaskId();
    idMap.set(task.id, newId);
    return { ...task, id: newId };
  });
  return { tasks, idMap };
}

function noop(): void {}

// Completing/deleting a task archives it immediately (no grace period, no
// undo toast, no timers) — the checkbox/delete action and the archive write
// happen in the same synchronous update. `toast`/`undoComplete`/`dismissToast`
// and the two empty-id sets below stay in the public API only because
// TaskRow/CompletedTaskToast/CompletedTasksList already read them; they're
// permanently inert now that nothing ever populates them.
const EMPTY_ID_SET: Set<string> = new Set();

export type DashboardView = "dashboard" | "completed";

export interface ToastState {
  taskId: string;
  title: string;
}

export interface TaskEditDraft {
  title: string;
  date: string;
  time: string;
  important: boolean;
  recurrence?: TaskRecurrence;
}

export type FocusSource = "manual" | "auto";

interface FocusRecord {
  taskId: string;
  source: FocusSource;
  dateKey: string;
}

export type FocusStatus =
  | { kind: "empty" }
  | { kind: "active"; task: Task; source: FocusSource }
  | { kind: "completed"; task: Task; source: FocusSource };

interface TasksStoreValue {
  today: Date;
  hydrated: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  tasks: Task[];
  visibleTasks: Task[];
  completedTasks: Task[];
  stats: { overdue: number; important: number; upcoming: number; none: number };

  view: DashboardView;
  setView: (view: DashboardView) => void;

  activeFilter: FilterKey;
  setActiveFilter: (filter: FilterKey) => void;
  toggleStatFilter: (filter: FilterKey) => void;

  sortKey: SortKey;
  setSortKey: (key: SortKey) => void;

  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  pendingCompleteIds: Set<string>;
  exitingIds: Set<string>;
  toggleComplete: (id: string) => void;
  toast: ToastState | null;
  undoComplete: () => void;
  dismissToast: () => void;
  restoreTask: (id: string) => void;

  focusStatus: FocusStatus;
  eligibleFocusTasks: Task[];
  setManualFocus: (id: string) => void;
  clearFocus: () => void;

  addTaskFromText: (text: string) => string | undefined;
  deleteTask: (id: string) => void;
  restoreDeletedTask: (task: Task) => void;
  postponeToTomorrow: (id: string) => void;
  toggleImportant: (id: string) => void;
  rescheduleTask: (id: string, date: string | undefined, time: string | undefined) => void;

  editingTaskId: string | null;
  startEditing: (id: string) => void;
  cancelEditing: () => void;
  saveTaskEdit: (id: string, draft: TaskEditDraft) => void;
}

const TasksContext = createContext<TasksStoreValue | null>(null);

export function TasksProvider({ children }: { children: ReactNode }) {
  const { today, todayKey } = useClock();
  const archiveStore = useArchiveStore();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // The API is the source of truth; `rawTasks` may briefly still hold the
  // previous account's data for one render after `userId` changes (before the
  // effect below clears it) — `tasks` (below) is what every consumer actually
  // reads, and it's gated so that render can never show it.
  const [rawTasks, setRawTasks] = useState<Task[]>([]);
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserRef = useRef<string | null>(null);

  const [focusRecord, setFocusRecord] = useState<FocusRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [view, setView] = useState<DashboardView>("dashboard");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  // Shared by toggleComplete and deleteTask: blocks a second action on the
  // same task id while one is still in flight (fast double-click, or
  // clicking Complete then Delete before the first request settles). Each
  // action owns removing its own id when it finishes, success or failure.
  const pendingTaskIdsRef = useRef<Set<string>>(new Set());
  // Guards against React Strict Mode's double-invoke of the mount effect
  // below (dev only, App Router default since Next 13.5): without this, two
  // concurrent loadFromCloud(uid) calls can both see zero cloud tasks and an
  // un-set migration flag, and both independently upsert the local cache —
  // each minting its own fresh UUIDs, so every legacy task gets migrated twice.
  const loadInFlightRef = useRef<Set<string>>(new Set());

  const tasks = useMemo(
    () => (loadedForUserId === userId ? rawTasks : EMPTY_TASKS),
    [rawTasks, loadedForUserId, userId],
  );

  // Reconciles with the cloud: fetches this user's tasks, and — the first time
  // ever, only while the cloud has nothing yet — migrates whatever is in the
  // local cache up. Every state update is guarded by currentUserRef so a
  // slow response for an account the user has since signed out of can never
  // clobber the next account's freshly-loaded state.
  const loadFromCloud = useCallback(async (uid: string) => {
    if (loadInFlightRef.current.has(uid)) return;
    loadInFlightRef.current.add(uid);
    setLoading(true);
    setError(null);
    try {
      const cloudTasks = await tasksRepository.listTasks();
      if (currentUserRef.current !== uid) return;

      if (cloudTasks.length === 0) {
        const cached = readStorage<Task[] | null>(TASKS_STORAGE_KEY, null);
        const migrationFlag = `${TASKS_MIGRATION_FLAG_PREFIX}${uid}`;

        if (cached && cached.length > 0 && !readStorage(migrationFlag, false)) {
          const { tasks: migratable, idMap } = ensureUuidIds(cached);
          try {
            await tasksRepository.upsertTasks(migratable);
            if (currentUserRef.current !== uid) return;
            writeStorage(migrationFlag, true);
            if (idMap.size > 0) {
              setFocusRecord((current) =>
                current && idMap.has(current.taskId) ? { ...current, taskId: idMap.get(current.taskId)! } : current,
              );
            }
            const reloaded = await tasksRepository.listTasks();
            if (currentUserRef.current !== uid) return;
            setRawTasks(reloaded);
            writeStorage(TASKS_STORAGE_KEY, reloaded);
          } catch (migrateErr) {
            // Local cache (already shown, from the effect below) stays as-is — nothing lost, just not migrated yet.
            setError(reportError("Не удалось перенести локальные задачи в облако", migrateErr));
          }
          return;
        }
      }

      setRawTasks(cloudTasks);
      writeStorage(TASKS_STORAGE_KEY, cloudTasks);
    } catch (err) {
      if (currentUserRef.current !== uid) return;
      // Network/API failure: leave whatever is currently shown (the
      // local cache loaded synchronously below) untouched.
      setError(reportError("Не удалось загрузить задачи", err));
    } finally {
      loadInFlightRef.current.delete(uid);
      if (currentUserRef.current === uid) setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (userId) loadFromCloud(userId);
  }, [userId, loadFromCloud]);

  // Runs on every sign-in/sign-out. Synchronously (before any network round
  // trip) shows this user's local cache — or nothing, for a signed-out state
  // or a user with no cache — then kicks off the cloud reconciliation.
  useEffect(() => {
    currentUserRef.current = userId;
    setError(null);

    if (!userId) {
      setRawTasks([]);
      setFocusRecord(null);
      setLoadedForUserId(null);
      setHydrated(true);
      return;
    }

    const cached = readStorage<Task[] | null>(TASKS_STORAGE_KEY, null);
    setRawTasks(cached ?? []);
    setLoadedForUserId(userId);
    setHydrated(true);

    const storedFocus = readStorage<FocusRecord | null>(FOCUS_STORAGE_KEY, null);
    if (storedFocus && (storedFocus.source === "manual" || storedFocus.dateKey === todayKey)) {
      setFocusRecord(storedFocus);
    } else {
      setFocusRecord(null);
    }

    loadFromCloud(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Cache mirror for instant next-load paint / offline fallback — only once
  // this user's real data is in place, never during the gated empty window.
  useEffect(() => {
    if (!hydrated || !userId || loadedForUserId !== userId) return;
    writeStorage(TASKS_STORAGE_KEY, tasks);
  }, [tasks, hydrated, userId, loadedForUserId]);

  useEffect(() => {
    if (hydrated) writeStorage(FOCUS_STORAGE_KEY, focusRecord);
  }, [focusRecord, hydrated]);

  const toggleStatFilter = useCallback((filter: FilterKey) => {
    setActiveFilter((prev) => (prev === filter ? "all" : filter));
  }, []);

  // Optimistic single-field patch shared by every "edit a field" action below:
  // apply locally, persist, and on failure revert to the exact pre-patch task.
  const applyOptimisticUpdate = useCallback(
    (id: string, patch: Partial<Task>, failureMessage: string) => {
      if (!userId) return;
      let previous: Task | undefined;
      setRawTasks((prev) => {
        previous = prev.find((task) => task.id === id);
        return prev.map((task) => (task.id === id ? { ...task, ...patch } : task));
      });

      tasksRepository
        .updateTask(id, patch)
        .then((updated) => setRawTasks((prev) => prev.map((task) => (task.id === id ? updated : task))))
        .catch((err) => {
          setRawTasks((prev) => (previous ? prev.map((task) => (task.id === id ? previous! : task)) : prev));
          setError(reportError(failureMessage, err));
        });
    },
    [userId],
  );

  // Marks a task done and archives it in the same update — no grace period,
  // no undo timer. The task disappears from the active list and shows up in
  // Archive with reason "completed" immediately. Completion never creates
  // another task: repetition is no longer a Task concept (it lives on
  // Calendar event series instead — see EventRecurrence in types/calendar.ts
  // and useCalendarStore). `target.recurrence` (legacy) is read nowhere here.
  const toggleComplete = useCallback(
    (id: string) => {
      if (!userId) return;
      // Blocks a second Complete/Delete on this id while this one is still
      // in flight — covers a fast double-click and a Complete-then-Delete
      // race, for every task, not just recurring ones.
      if (pendingTaskIdsRef.current.has(id)) return;
      const target = tasks.find((task) => task.id === id);
      if (!target || target.completed) return;
      pendingTaskIdsRef.current.add(id);

      const completedSnapshot: Task = { ...target, completed: true, completedAt: new Date().toISOString() };

      debugLog("complete", { taskId: id });

      const archiveItem = archiveStore.addItem({
        entityType: "task",
        entityId: completedSnapshot.id,
        title: completedSnapshot.title,
        preview: completedSnapshot.dueLabel,
        sourceModule: "Задачи",
        reason: "completed",
        originalData: completedSnapshot,
      });

      setRawTasks((prev) => prev.filter((task) => task.id !== id));

      (async () => {
        try {
          debugLog("complete:delete-current", { taskId: id, source: "toggleComplete" });
          await tasksRepository.deleteTask(id);
        } catch (err) {
          // Completion didn't actually persist — put everything back exactly as it was.
          setRawTasks((prev) => (prev.some((task) => task.id === target.id) ? prev : [target, ...prev]));
          archiveStore.removeItem(archiveItem.id);
          setError(reportError("Не удалось сохранить изменения", err));
          pendingTaskIdsRef.current.delete(id);
          return;
        }

        // Streak is a secondary effect: a malformed legacy streak snapshot
        // must never block task completion or its persistence.
        try {
          recordDailyActivity();
        } catch (err) {
          getErrorMessage(err);
        }

        pendingTaskIdsRef.current.delete(id);
      })();
    },
    [tasks, archiveStore, userId],
  );

  // Kept for CompletedTasksList's "Вернуть" — resets a still-present task
  // back to active. Distinct from `restoreDeletedTask`, which re-inserts a
  // full snapshot pulled back out of the Archive. Effectively unreachable
  // today (completion always removes the task from `tasks` immediately), so
  // this only best-effort logs a persistence failure rather than rolling back.
  const restoreTask = useCallback(
    (id: string) => {
      setRawTasks((prev) => prev.map((task) => (task.id === id ? { ...task, completed: false, completedAt: undefined } : task)));
      if (userId) {
        tasksRepository.updateTask(id, { completed: false, completedAt: undefined }).catch((err) => getErrorMessage(err));
      }
    },
    [userId],
  );

  const setManualFocus = useCallback(
    (id: string) => {
      setFocusRecord({ taskId: id, source: "manual", dateKey: todayKey });
    },
    [todayKey],
  );

  const clearFocus = useCallback(() => {
    setFocusRecord(null);
  }, []);

  const addTaskFromText = useCallback(
    (text: string) => {
      if (!text.trim() || !userId) return undefined;
      const newTask = createTaskFromText(text, today);
      setRawTasks((prev) => [newTask, ...prev]);
      recordDailyActivity();

      debugLog("create", { taskId: newTask.id, userId, source: "addTaskFromText" });

      tasksRepository.createTask(newTask).catch((err) => {
        // getErrorMessage (called by reportError below) logs the full
        // error — this line just marks which local action it belongs to.
        debugLog("create:failed", { taskId: newTask.id, userId });
        // Optimistic task never persisted — remove it and surface why,
        // rather than leaving a phantom local-only task the user thinks was saved.
        setRawTasks((prev) => prev.filter((task) => task.id !== newTask.id));
        setError(reportError("Не удалось сохранить задачу", err));
      });

      return newTask.id;
    },
    [today, userId],
  );

  // Plain delete — only ever removes the one targeted row. It never calls
  // toggleComplete, never archives with reason "completed", and never
  // creates any other task: Tasks have no recurrence-generation path at all
  // anymore (see toggleComplete above).
  const deleteTask = useCallback(
    (id: string) => {
      if (!userId) return;
      if (pendingTaskIdsRef.current.has(id)) return;
      const target = tasks.find((task) => task.id === id);
      if (!target) return;
      pendingTaskIdsRef.current.add(id);

      debugLog("delete", { taskId: id, recurrence: target.recurrence, source: "deleteTask" });

      const archiveItem = archiveStore.addItem({
        entityType: "task",
        entityId: target.id,
        title: target.title,
        preview: target.dueLabel,
        sourceModule: "Задачи",
        reason: "deleted",
        originalData: target,
      });

      setRawTasks((prev) => prev.filter((task) => task.id !== id));
      setFocusRecord((current) => (current?.taskId === id ? null : current));

      tasksRepository
        .deleteTask(id)
        .catch((err) => {
          setRawTasks((prev) => (prev.some((task) => task.id === target.id) ? prev : [target, ...prev]));
          archiveStore.removeItem(archiveItem.id);
          setError(reportError("Не удалось удалить задачу", err));
        })
        .finally(() => {
          pendingTaskIdsRef.current.delete(id);
        });
    },
    [tasks, archiveStore, userId],
  );

  /**
   * Reinserts a full task snapshot pulled back out of the Archive. Always
   * comes back active (completed:false) regardless of why it was archived —
   * otherwise a task archived via completion would silently re-enter the
   * list still marked done and vanish from the active view again. Guarded
   * against being present already so double-restore can't duplicate it.
   * The archive/page.tsx caller removes the ArchiveItem right after calling
   * this, so on failure a fresh ArchiveItem is re-added — otherwise the task
   * would vanish from both the active list and the Archive.
   */
  const restoreDeletedTask = useCallback(
    (task: Task) => {
      if (!userId) return;
      const restored: Task = { ...task, completed: false, completedAt: undefined };
      setRawTasks((prev) => {
        if (prev.some((existing) => existing.id === task.id)) return prev;
        return [restored, ...prev];
      });

      tasksRepository.restoreTask(restored).catch((err) => {
        setRawTasks((prev) => prev.filter((existing) => existing.id !== task.id));
        archiveStore.addItem({
          entityType: "task",
          entityId: task.id,
          title: task.title,
          preview: task.dueLabel,
          sourceModule: "Задачи",
          reason: task.completed ? "completed" : "deleted",
          originalData: task,
        });
        setError(reportError("Не удалось восстановить задачу", err));
      });
    },
    [userId, archiveStore],
  );

  const postponeToTomorrow = useCallback(
    (id: string) => {
      const tomorrow = getLocalDateKey(addDays(today, 1));
      applyOptimisticUpdate(id, { dueLabel: "Завтра", priority: "upcoming", date: tomorrow, time: undefined }, "Не удалось сохранить изменения");
    },
    [today, applyOptimisticUpdate],
  );

  const toggleImportant = useCallback(
    (id: string) => {
      const target = tasks.find((task) => task.id === id);
      if (!target) return;
      applyOptimisticUpdate(id, { important: !target.important }, "Не удалось сохранить изменения");
    },
    [tasks, applyOptimisticUpdate],
  );

  const startEditing = useCallback((id: string) => {
    setEditingTaskId(id);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingTaskId(null);
  }, []);

  const saveTaskEdit = useCallback(
    (id: string, draft: TaskEditDraft) => {
      const date = draft.date.trim() || undefined;
      const time = draft.time.trim() || undefined;
      const currentTitle = tasks.find((task) => task.id === id)?.title ?? "";
      const patch: Partial<Task> = {
        title: draft.title.trim() || currentTitle,
        date,
        time,
        // Deadline changes must re-flag overdue/today/upcoming immediately —
        // priority was previously left stale after editing the date.
        dueLabel: formatTaskDueLabel(date, time, today),
        priority: computeTaskPriority(date, today),
        important: draft.important,
        recurrence: draft.recurrence,
      };
      applyOptimisticUpdate(id, patch, "Не удалось сохранить изменения");
      setEditingTaskId(null);
    },
    [tasks, today, applyOptimisticUpdate],
  );

  // Used by calendar drag-and-drop: moves a task to a new date/time without
  // touching its priority bucket.
  const rescheduleTask = useCallback(
    (id: string, date: string | undefined, time: string | undefined) => {
      applyOptimisticUpdate(id, { date, time, dueLabel: formatTaskDueLabel(date, time, today) }, "Не удалось сохранить изменения");
    },
    [today, applyOptimisticUpdate],
  );

  const visibleTasks = useMemo(() => {
    let list = tasks.filter((task) => !task.completed);

    if (activeFilter !== "all") {
      list = list.filter((task) => matchesFilter(task, activeFilter));
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((task) => task.title.toLowerCase().includes(query));
    }

    return sortTasks(list, sortKey);
  }, [tasks, activeFilter, searchQuery, sortKey]);

  // Always empty now that completion archives immediately — kept for
  // CompletedTasksList, which renders its own empty state for this.
  const completedTasks = useMemo(() => tasks.filter((task) => task.completed), [tasks]);

  const stats = useMemo(() => {
    const active = tasks.filter((task) => !task.completed);
    return {
      overdue: active.filter((task) => task.priority === "overdue").length,
      important: active.filter((task) => task.priority === "important").length,
      upcoming: active.filter((task) => task.priority === "upcoming").length,
      none: active.filter((task) => task.priority === "none").length,
    };
  }, [tasks]);

  const eligibleFocusTasks = useMemo(() => tasks.filter((task) => !task.completed), [tasks]);

  const focusStatus = useMemo<FocusStatus>(() => {
    if (focusRecord) {
      const task = tasks.find((item) => item.id === focusRecord.taskId);
      if (task) {
        return task.completed
          ? { kind: "completed", task, source: focusRecord.source }
          : { kind: "active", task, source: focusRecord.source };
      }
      // Record points at a task that no longer exists — an effect below
      // will clear it; render as empty in the meantime.
      return { kind: "empty" };
    }

    const suggestion = pickAutoFocusTask(tasks, todayKey);
    if (suggestion) return { kind: "active", task: suggestion, source: "auto" };
    return { kind: "empty" };
  }, [tasks, focusRecord, todayKey]);

  // Locks in the first auto-suggestion for the day so it doesn't silently
  // swap to a different task later in the session (requirement 2.4/4).
  useEffect(() => {
    if (!hydrated) return;
    if (!focusRecord && focusStatus.kind !== "empty" && focusStatus.source === "auto") {
      setFocusRecord({ taskId: focusStatus.task.id, source: "auto", dateKey: todayKey });
    }
  }, [hydrated, focusRecord, focusStatus, todayKey]);

  // A focus record pointing at a deleted task cleans itself up.
  useEffect(() => {
    if (focusRecord && !tasks.some((task) => task.id === focusRecord.taskId)) {
      setFocusRecord(null);
    }
  }, [focusRecord, tasks]);

  const value: TasksStoreValue = {
    today,
    hydrated,
    loading,
    error,
    refresh,
    tasks,
    visibleTasks,
    completedTasks,
    stats,

    view,
    setView,

    activeFilter,
    setActiveFilter,
    toggleStatFilter,

    sortKey,
    setSortKey,

    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,

    pendingCompleteIds: EMPTY_ID_SET,
    exitingIds: EMPTY_ID_SET,
    toggleComplete,
    toast: null,
    undoComplete: noop,
    dismissToast: noop,
    restoreTask,

    focusStatus,
    eligibleFocusTasks,
    setManualFocus,
    clearFocus,

    addTaskFromText,
    deleteTask,
    restoreDeletedTask,
    postponeToTomorrow,
    toggleImportant,
    rescheduleTask,

    editingTaskId,
    startEditing,
    cancelEditing,
    saveTaskEdit,
  };

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>;
}

export function useTasksStore(): TasksStoreValue {
  const ctx = useContext(TasksContext);
  if (!ctx) throw new Error("useTasksStore must be used within a TasksProvider");
  return ctx;
}
