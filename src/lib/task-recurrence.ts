import { addDays, getLocalDateKey } from "@/lib/date-utils";
import { formatTaskDueLabel } from "@/lib/task-date";
import type { Task, TaskRecurrenceRule } from "@/types/task";

// Monday-first weekday index (0=Mon..6=Sun) — same convention used elsewhere
// in the app (Reminders/Analytics weekday buckets: `(date.getDay() + 6) % 7`).
export function localWeekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export const WEEKDAY_OPTIONS: { key: number; label: string }[] = [
  { key: 0, label: "Пн" },
  { key: 1, label: "Вт" },
  { key: 2, label: "Ср" },
  { key: 3, label: "Чт" },
  { key: 4, label: "Пт" },
  { key: 5, label: "Сб" },
  { key: 6, label: "Вс" },
];

export const RECURRENCE_RULE_OPTIONS: { key: TaskRecurrenceRule; label: string }[] = [
  { key: "none", label: "Не повторять" },
  { key: "daily", label: "Каждый день" },
  { key: "weekdays", label: "По будням" },
  { key: "weekly", label: "Каждую неделю" },
  { key: "custom", label: "Выбранные дни недели" },
];

/**
 * Resolves the effective weekday set for a rule. `weekly`/`custom` depend on
 * user input (the task's own date for `weekly`, explicit picks for `custom`);
 * `daily`/`weekdays` are fixed regardless of what's passed in.
 */
export function weekdaysForRule(rule: TaskRecurrenceRule, picked: number[]): number[] {
  switch (rule) {
    case "daily":
      return [0, 1, 2, 3, 4, 5, 6];
    case "weekdays":
      return [0, 1, 2, 3, 4];
    case "weekly":
      return picked.slice(0, 1);
    case "custom":
      return [...picked].sort((a, b) => a - b);
    default:
      return [];
  }
}

/**
 * Next date (local time, strictly after `fromDate`) whose weekday is in
 * `weekdays`. Scans at most 7 days ahead — always finds one since a non-empty
 * weekday set repeats at least weekly. Returns null only when there's nothing
 * to repeat on (empty set — treated as "no recurrence").
 */
export function computeNextOccurrenceDateKey(weekdays: number[], fromDate: Date): string | null {
  if (weekdays.length === 0) return null;
  for (let offset = 1; offset <= 7; offset++) {
    const candidate = addDays(fromDate, offset);
    if (weekdays.includes(localWeekdayIndex(candidate))) {
      return getLocalDateKey(candidate);
    }
  }
  return null;
}

/**
 * @deprecated Legacy — no longer called anywhere. Task completion (see
 * useTasksStore's toggleComplete) used to call this to spawn the next
 * occurrence as a new task row; that generation step has been removed
 * (repetition now lives on Calendar event series, not Tasks). Kept only for
 * reference/rollback safety alongside the still-legacy `Task.recurrence`
 * field — safe to delete once old recurring tasks have been migrated.
 */
export function buildNextOccurrence(completed: Task, today: Date, generateId: () => string): Task | null {
  const recurrence = completed.recurrence;
  if (!recurrence || recurrence.rule === "none" || recurrence.weekdays.length === 0) return null;

  const referenceDate = completed.date ? new Date(`${completed.date}T00:00:00`) : today;
  const nextDateKey = computeNextOccurrenceDateKey(recurrence.weekdays, referenceDate);
  if (!nextDateKey) return null;

  return {
    id: generateId(),
    title: completed.title,
    dueLabel: formatTaskDueLabel(nextDateKey, recurrence.time, today),
    priority: "upcoming",
    completed: false,
    important: completed.important,
    date: nextDateKey,
    time: recurrence.time,
    createdAt: new Date().toISOString(),
    recurrence,
  };
}
