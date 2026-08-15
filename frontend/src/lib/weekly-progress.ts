import type { Task } from "@/types/task";
import { addDays, endOfWeekSunday, getLocalDateKey, startOfWeekMonday } from "@/lib/date-utils";

export interface WeeklyProgressResult {
  completed: number;
  total: number;
  percent: number;
  /** Mon..Sun daily completion percentage — the chart's 7 points. */
  dailyPercents: number[];
}

function inRange(key: string, startKey: string, endKey: string): boolean {
  return key >= startKey && key <= endKey;
}

/**
 * completed: tasks marked done with `completedAt` inside this week.
 * total: tasks "belonging" to this week — scheduled here (by `date`) or
 * completed here — deduplicated by id so nothing is counted twice.
 * Date-less, never-completed tasks never enter the picture.
 */
export function computeWeeklyProgress(tasks: Task[], today: Date): WeeklyProgressResult {
  const weekStart = startOfWeekMonday(today);
  const weekEnd = endOfWeekSunday(today);
  const startKey = getLocalDateKey(weekStart);
  const endKey = getLocalDateKey(weekEnd);

  const completedKeyOf = (task: Task): string | null =>
    task.completed && task.completedAt ? getLocalDateKey(new Date(task.completedAt)) : null;

  const weekTaskIds = new Set<string>();
  for (const task of tasks) {
    if (task.date && inRange(task.date, startKey, endKey)) weekTaskIds.add(task.id);
    const completedKey = completedKeyOf(task);
    if (completedKey && inRange(completedKey, startKey, endKey)) weekTaskIds.add(task.id);
  }

  let completed = 0;
  for (const task of tasks) {
    if (!weekTaskIds.has(task.id)) continue;
    const completedKey = completedKeyOf(task);
    if (completedKey && inRange(completedKey, startKey, endKey)) completed += 1;
  }

  const total = weekTaskIds.size;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const dailyPercents = Array.from({ length: 7 }, (_, index) => {
    const dayKey = getLocalDateKey(addDays(weekStart, index));

    const dayTaskIds = new Set<string>();
    for (const task of tasks) {
      if (task.date === dayKey) dayTaskIds.add(task.id);
      if (completedKeyOf(task) === dayKey) dayTaskIds.add(task.id);
    }
    if (dayTaskIds.size === 0) return 0;

    let dayCompleted = 0;
    for (const task of tasks) {
      if (dayTaskIds.has(task.id) && completedKeyOf(task) === dayKey) dayCompleted += 1;
    }

    return Math.round((dayCompleted / dayTaskIds.size) * 100);
  });

  return { completed, total, percent, dailyPercents };
}
