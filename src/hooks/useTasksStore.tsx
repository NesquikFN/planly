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
import type { Task, TaskRecurrence } from "@/types/task";
import { createMockTasks } from "@/lib/mock-data";
import { readStorage, writeStorage } from "@/lib/storage";
import { matchesFilter, sortTasks, type FilterKey, type SortKey } from "@/lib/filters";
import { createTaskFromText } from "@/lib/task-parser";
import { formatTaskDueLabel } from "@/lib/task-date";
import { buildNextOccurrence } from "@/lib/task-recurrence";
import { addDays, getLocalDateKey } from "@/lib/date-utils";
import { pickAutoFocusTask } from "@/lib/focus";
import { useClock } from "@/hooks/useClock";
import { useArchiveStore } from "@/hooks/useArchiveStore";

const TASKS_STORAGE_KEY = "planly:tasks";
const FOCUS_STORAGE_KEY = "planly:focus";

function generateTaskId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `task-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Grace period during which a completed task stays in place and can still be
// un-checked (requirements 1–2).
const COMPLETE_GRACE_MS = 500;
// Duration of the collapse/fade-out animation once the grace period ends.
const EXIT_ANIMATION_MS = 220;
const TOAST_DURATION_MS = 5000;

export type DashboardView = "dashboard" | "completed";

export interface ToastState {
  taskId: string;
  title: string;
}

/**
 * One task's undo/archive countdown. Kept in a collection keyed by task ID so
 * completing several tasks in quick succession gives each its own snapshot,
 * deadline and finalize timer instead of sharing one (requirements 1-2).
 */
interface PendingCompletion {
  taskId: string;
  snapshot: Task;
  completedAt: string;
  /** ISO datetime — when this entry finalizes (archives) if not undone first. */
  archiveAt: string;
}

const PENDING_COMPLETIONS_STORAGE_KEY = "planly:pendingCompletions";

/** Removes a finalized occurrence from the task list and splices in its next occurrence, if any. */
function applyArchivalToTasks(taskList: Task[], snapshot: Task, today: Date): Task[] {
  const nextOccurrence = buildNextOccurrence(snapshot, today, generateTaskId);
  const withoutCompleted = taskList.filter((task) => task.id !== snapshot.id);
  return nextOccurrence ? [nextOccurrence, ...withoutCompleted] : withoutCompleted;
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

  const [tasks, setTasks] = useState<Task[]>(() => createMockTasks(today));
  const [focusRecord, setFocusRecord] = useState<FocusRecord | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [view, setView] = useState<DashboardView>("dashboard");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Tasks within the 500ms cancellable grace window.
  const [pendingCompleteIds, setPendingCompleteIds] = useState<Set<string>>(new Set());
  // Tasks past the grace window, playing the collapse/fade-out animation.
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  // Toast bubbles the user explicitly dismissed (without undoing) — their
  // underlying pending completion keeps counting down, only the bubble hides.
  const [hiddenToastIds, setHiddenToastIds] = useState<Set<string>>(new Set());

  const graceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const exitTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // One finalize timer per pending completion (requirement 2) — completing
  // task B must never clear or replace task A's timer.
  const finalizeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Source of truth for in-flight completions, keyed by task ID (requirement 1).
  // A ref (not state) so rapid-fire completions/undos always read the latest
  // value synchronously; `pendingCompletionsTick` below drives re-renders.
  const pendingCompletionsRef = useRef<Map<string, PendingCompletion>>(new Map());
  const [pendingCompletionsTick, setPendingCompletionsTick] = useState(0);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const finalizeCompletion = useCallback(
    (id: string) => {
      finalizeTimers.current.delete(id);
      const entry = pendingCompletionsRef.current.get(id);
      // Already undone, deleted, or finalized by another call — nothing to do.
      // This guard is what makes finalization idempotent (requirement 6).
      if (!entry) return;

      pendingCompletionsRef.current.delete(id);
      setPendingCompletionsTick((tick) => tick + 1);
      setHiddenToastIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      archiveStore.addItem({
        entityType: "task",
        entityId: entry.snapshot.id,
        title: entry.snapshot.title,
        preview: entry.snapshot.dueLabel,
        sourceModule: "Задачи",
        originalData: entry.snapshot,
      });

      // Recurring tasks: completing one occurrence archives it like any other
      // task, but the recurrence rule survives by spawning the next
      // occurrence as its own row — never hundreds in advance, only ever the
      // single next date.
      setTasks((prev) => applyArchivalToTasks(prev, entry.snapshot, today));
    },
    [archiveStore, today],
  );

  // Hydrate from localStorage after mount (avoids SSR/client markup mismatch).
  useEffect(() => {
    const storedTasks = readStorage<Task[] | null>(TASKS_STORAGE_KEY, null);
    let workingTasks = storedTasks && storedTasks.length > 0 ? storedTasks : null;

    // Resume pending completions across reload (requirement 3): expired ones
    // finalize immediately, the rest keep counting down from where they left off.
    const storedPending = readStorage<PendingCompletion[] | null>(PENDING_COMPLETIONS_STORAGE_KEY, null);
    if (storedPending && storedPending.length > 0 && workingTasks) {
      const now = Date.now();
      for (const entry of storedPending) {
        const archiveAtMs = new Date(entry.archiveAt).getTime();
        const stillCompleted = workingTasks.some((task) => task.id === entry.taskId && task.completed);
        if (!stillCompleted) continue; // deleted/restored while the app was closed

        if (Number.isNaN(archiveAtMs) || archiveAtMs <= now) {
          archiveStore.addItem({
            entityType: "task",
            entityId: entry.snapshot.id,
            title: entry.snapshot.title,
            preview: entry.snapshot.dueLabel,
            sourceModule: "Задачи",
            originalData: entry.snapshot,
          });
          workingTasks = applyArchivalToTasks(workingTasks, entry.snapshot, today);
        } else {
          pendingCompletionsRef.current.set(entry.taskId, entry);
          const timer = setTimeout(() => finalizeCompletion(entry.taskId), archiveAtMs - now);
          finalizeTimers.current.set(entry.taskId, timer);
        }
      }
      setPendingCompletionsTick((tick) => tick + 1);
    }

    if (workingTasks) setTasks(workingTasks);

    const storedFocus = readStorage<FocusRecord | null>(FOCUS_STORAGE_KEY, null);
    if (storedFocus) {
      // A stale *automatic* focus from a previous day is discarded — it'll be
      // recomputed fresh for today. A manual pick persists across days until
      // the user changes or clears it (requirement 8).
      if (storedFocus.source === "manual" || storedFocus.dateKey === todayKey) {
        setFocusRecord(storedFocus);
      }
    }

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(TASKS_STORAGE_KEY, tasks);
  }, [tasks, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(FOCUS_STORAGE_KEY, focusRecord);
  }, [focusRecord, hydrated]);

  useEffect(() => {
    if (hydrated) {
      writeStorage(PENDING_COMPLETIONS_STORAGE_KEY, Array.from(pendingCompletionsRef.current.values()));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCompletionsTick, hydrated]);

  // Clear any in-flight timers on unmount.
  useEffect(() => {
    return () => {
      graceTimers.current.forEach((timer) => clearTimeout(timer));
      exitTimers.current.forEach((timer) => clearTimeout(timer));
      finalizeTimers.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const toggleStatFilter = useCallback((filter: FilterKey) => {
    setActiveFilter((prev) => (prev === filter ? "all" : filter));
  }, []);

  const completeTask = useCallback(
    (id: string) => {
      const target = tasks.find((task) => task.id === id);
      if (!target || target.completed) return;

      const completedAt = new Date().toISOString();
      const completedSnapshot: Task = { ...target, completed: true, completedAt };
      setTasks((prev) => prev.map((task) => (task.id === id ? completedSnapshot : task)));
      setPendingCompleteIds((prev) => new Set(prev).add(id));

      const graceTimer = setTimeout(() => {
        graceTimers.current.delete(id);
        setPendingCompleteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setExitingIds((prev) => new Set(prev).add(id));

        const exitTimer = setTimeout(() => {
          exitTimers.current.delete(id);
          setExitingIds((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });

          // Enter the undo/archive countdown. This task gets its own entry
          // and its own timer — completing another task never touches this
          // one (requirements 1-2).
          const archiveAt = new Date(Date.now() + TOAST_DURATION_MS).toISOString();
          pendingCompletionsRef.current.set(id, { taskId: id, snapshot: completedSnapshot, completedAt, archiveAt });
          setPendingCompletionsTick((tick) => tick + 1);

          const finalizeTimer = setTimeout(() => finalizeCompletion(id), TOAST_DURATION_MS);
          finalizeTimers.current.set(id, finalizeTimer);
        }, EXIT_ANIMATION_MS);
        exitTimers.current.set(id, exitTimer);
      }, COMPLETE_GRACE_MS);
      graceTimers.current.set(id, graceTimer);
    },
    [tasks, finalizeCompletion],
  );

  // Cancels completion while still inside the 500ms grace window.
  const cancelComplete = useCallback((id: string) => {
    setPendingCompleteIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    const timer = graceTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      graceTimers.current.delete(id);
    }

    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: false, completedAt: undefined } : task)),
    );
  }, []);

  const toggleComplete = useCallback(
    (id: string) => {
      const target = tasks.find((task) => task.id === id);
      if (!target) return;

      if (!target.completed) {
        completeTask(id);
      } else if (pendingCompleteIds.has(id)) {
        cancelComplete(id);
      }
      // Already past the grace window (archived/exiting) — checkbox isn't
      // interactive there, nothing to do.
    },
    [tasks, pendingCompleteIds, completeTask, cancelComplete],
  );

  // Shared restore path for both the undo-toast and the archive's "Вернуть".
  // Targets exactly one task ID — undoing task A never touches task B's
  // timers, entry, or toast (requirement 4).
  const restoreTask = useCallback((id: string) => {
    const graceTimer = graceTimers.current.get(id);
    if (graceTimer) {
      clearTimeout(graceTimer);
      graceTimers.current.delete(id);
    }
    const exitTimer = exitTimers.current.get(id);
    if (exitTimer) {
      clearTimeout(exitTimer);
      exitTimers.current.delete(id);
    }
    const finalizeTimer = finalizeTimers.current.get(id);
    if (finalizeTimer) {
      clearTimeout(finalizeTimer);
      finalizeTimers.current.delete(id);
    }
    if (pendingCompletionsRef.current.has(id)) {
      pendingCompletionsRef.current.delete(id);
      setPendingCompletionsTick((tick) => tick + 1);
    }

    setPendingCompleteIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setExitingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setHiddenToastIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, completed: false, completedAt: undefined } : task)),
    );
  }, []);

  // The visible undo bubble: the most recently completed task still pending
  // (and not explicitly dismissed). Derived from the pending-completions
  // collection rather than its own state, so it can never go stale relative
  // to which timers are actually still running.
  const toast = useMemo<ToastState | null>(() => {
    let latest: PendingCompletion | null = null;
    for (const entry of pendingCompletionsRef.current.values()) {
      if (hiddenToastIds.has(entry.taskId)) continue;
      if (!latest || entry.completedAt > latest.completedAt) {
        latest = entry;
      }
    }
    return latest ? { taskId: latest.taskId, title: latest.snapshot.title } : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCompletionsTick, hiddenToastIds]);

  const undoComplete = useCallback(() => {
    if (!toast) return;
    restoreTask(toast.taskId);
  }, [toast, restoreTask]);

  // Hides the toast bubble only — the underlying completion keeps counting
  // down and archives normally. (Previously this cancelled the archive timer
  // outright, orphaning the task as completed-forever; unused by any UI today
  // but fixed since it belongs to the same lifecycle.)
  const dismissToast = useCallback(() => {
    if (!toast) return;
    setHiddenToastIds((prev) => new Set(prev).add(toast.taskId));
  }, [toast]);

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
      if (!text.trim()) return undefined;
      const newTask = createTaskFromText(text, today);
      setTasks((prev) => [newTask, ...prev]);
      return newTask.id;
    },
    [today],
  );

  const deleteTask = useCallback(
    (id: string) => {
      const target = tasks.find((task) => task.id === id);
      if (target) {
        archiveStore.addItem({
          entityType: "task",
          entityId: target.id,
          title: target.title,
          preview: target.dueLabel,
          sourceModule: "Задачи",
          originalData: target,
        });
      }

      const graceTimer = graceTimers.current.get(id);
      if (graceTimer) {
        clearTimeout(graceTimer);
        graceTimers.current.delete(id);
      }
      const exitTimer = exitTimers.current.get(id);
      if (exitTimer) {
        clearTimeout(exitTimer);
        exitTimers.current.delete(id);
      }
      // If this same task's completion-undo countdown is still pending, its
      // timer would otherwise fire later and archive it a second time (plus
      // spawn a stray recurrence next-occurrence) — deleting it now must
      // cancel that. Only this task's entry is touched; other pending
      // completions (rapid multi-delete) are unaffected.
      const finalizeTimer = finalizeTimers.current.get(id);
      if (finalizeTimer) {
        clearTimeout(finalizeTimer);
        finalizeTimers.current.delete(id);
      }
      if (pendingCompletionsRef.current.has(id)) {
        pendingCompletionsRef.current.delete(id);
        setPendingCompletionsTick((tick) => tick + 1);
      }
      setHiddenToastIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      setTasks((prev) => prev.filter((task) => task.id !== id));
      setFocusRecord((current) => (current?.taskId === id ? null : current));
      setPendingCompleteIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setExitingIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [tasks, archiveStore],
  );

  /** Reinserts a full task snapshot — used only by the Archive restore pipeline. */
  const restoreDeletedTask = useCallback((task: Task) => {
    setTasks((prev) => [task, ...prev]);
  }, []);

  const postponeToTomorrow = useCallback(
    (id: string) => {
      const tomorrow = getLocalDateKey(addDays(today, 1));
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? { ...task, dueLabel: "Завтра", priority: "upcoming", date: tomorrow, time: undefined }
            : task,
        ),
      );
    },
    [today],
  );

  const toggleImportant = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, important: !task.important } : task)),
    );
  }, []);

  const startEditing = useCallback((id: string) => {
    setEditingTaskId(id);
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingTaskId(null);
  }, []);

  const saveTaskEdit = useCallback(
    (id: string, draft: TaskEditDraft) => {
      setTasks((prev) =>
        prev.map((task) => {
          if (task.id !== id) return task;
          const date = draft.date.trim() || undefined;
          const time = draft.time.trim() || undefined;
          return {
            ...task,
            title: draft.title.trim() || task.title,
            date,
            time,
            dueLabel: formatTaskDueLabel(date, time, today),
            important: draft.important,
            recurrence: draft.recurrence,
          };
        }),
      );
      setEditingTaskId(null);
    },
    [today],
  );

  // Used by calendar drag-and-drop: moves a task to a new date/time without
  // touching its priority bucket.
  const rescheduleTask = useCallback(
    (id: string, date: string | undefined, time: string | undefined) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id ? { ...task, date, time, dueLabel: formatTaskDueLabel(date, time, today) } : task,
        ),
      );
    },
    [today],
  );

  const visibleTasks = useMemo(() => {
    let list = tasks.filter(
      (task) => !task.completed || pendingCompleteIds.has(task.id) || exitingIds.has(task.id),
    );

    if (activeFilter !== "all") {
      list = list.filter((task) => matchesFilter(task, activeFilter));
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((task) => task.title.toLowerCase().includes(query));
    }

    return sortTasks(list, sortKey);
  }, [tasks, pendingCompleteIds, exitingIds, activeFilter, searchQuery, sortKey]);

  // Fully archived tasks: completed and past the grace/exit-animation windows.
  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.completed && !pendingCompleteIds.has(task.id) && !exitingIds.has(task.id),
      ),
    [tasks, pendingCompleteIds, exitingIds],
  );

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

    pendingCompleteIds,
    exitingIds,
    toggleComplete,
    toast,
    undoComplete,
    dismissToast,
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
