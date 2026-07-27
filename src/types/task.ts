export type TaskPriority = "overdue" | "important" | "upcoming" | "none";

export type TaskRecurrenceRule = "none" | "daily" | "weekdays" | "weekly" | "custom";

export interface TaskRecurrence {
  rule: TaskRecurrenceRule;
  /** Monday-first weekday indices (0=Mon..6=Sun) this task repeats on — the resolved effective set for `rule`, not just the user's raw custom picks. */
  weekdays: number[];
  /** Same value as the task's own `time` field, kept here so the rule is self-contained when computing the next occurrence. */
  time?: string;
}

export interface Task {
  id: string;
  title: string;
  dueLabel: string;
  priority: TaskPriority;
  completed: boolean;
  important: boolean;
  date?: string;
  time?: string;
  /** ISO datetime — set the moment the task was marked done, cleared on undo. */
  completedAt?: string;
  /** ISO datetime — set when the task is created. Absent on tasks that predate this field (never backfilled). */
  createdAt?: string;
  /** Absent = one-off task (default, backward compatible with existing tasks). */
  recurrence?: TaskRecurrence;
}
