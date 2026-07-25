export type TaskPriority = "overdue" | "important" | "upcoming" | "none";

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
}
