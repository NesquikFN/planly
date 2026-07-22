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
}
