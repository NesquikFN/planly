import type { Task } from "@/types/task";

/**
 * Auto-suggestion order (requirement 2.2):
 * 1. an overdue task (important ones first),
 * 2. an important task scheduled for today,
 * 3. the nearest task due today (by time),
 * never a completed one.
 */
export function pickAutoFocusTask(tasks: Task[], todayKey: string): Task | null {
  const active = tasks.filter((task) => !task.completed);

  const overdue = active
    .filter((task) => task.priority === "overdue")
    .sort((a, b) => Number(b.important) - Number(a.important));
  if (overdue[0]) return overdue[0];

  const important = active.filter((task) => task.priority === "important");
  if (important[0]) return important[0];

  const dueToday = active
    .filter((task) => task.date === todayKey)
    .sort((a, b) => (a.time ?? "23:59").localeCompare(b.time ?? "23:59"));
  if (dueToday[0]) return dueToday[0];

  return null;
}
