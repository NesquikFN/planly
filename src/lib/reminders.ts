import { addDays, diffInCalendarDays, formatShortDate, fromISODate, getLocalDateKey } from "@/lib/date-utils";
import { minutesToTime, timeToMinutes } from "@/lib/calendar-time";
import type { QuickFilterKey, Reminder, ReminderPriority } from "@/types/reminder";

export function getReminderDateTime(reminder: Reminder): Date | null {
  if (!reminder.date) return null;
  const day = fromISODate(reminder.date);
  if (reminder.time) {
    const [hours, minutes] = reminder.time.split(":").map(Number);
    day.setHours(hours, minutes, 0, 0);
  } else {
    day.setHours(23, 59, 0, 0);
  }
  return day;
}

export function isOverdue(reminder: Reminder, now: Date): boolean {
  if (reminder.completed || !reminder.date) return false;
  const dateTime = getReminderDateTime(reminder);
  return dateTime !== null && dateTime.getTime() < now.getTime();
}

/** "Сегодня, 16:00" / "Завтра, 10:00" / "28 июля, 12:00" / "Без даты" */
export function formatReminderDateLabel(reminder: Reminder, today: Date): string {
  if (!reminder.date) return "Без даты";
  const diff = diffInCalendarDays(fromISODate(reminder.date), today);
  const relative =
    diff === 0 ? "Сегодня" : diff === 1 ? "Завтра" : diff === -1 ? "Вчера" : formatShortDate(fromISODate(reminder.date));
  return reminder.time ? `${relative}, ${reminder.time}` : relative;
}

function formatDuration(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours === 0) return `${mins} мин`;
  if (mins === 0) return `${hours} ч`;
  return `${hours} ч ${mins} мин`;
}

export function formatOverdueLabel(reminder: Reminder, now: Date): string | null {
  const dateTime = getReminderDateTime(reminder);
  if (!dateTime || dateTime.getTime() >= now.getTime()) return null;
  const minutesLate = (now.getTime() - dateTime.getTime()) / 60_000;
  return `Просрочено на ${formatDuration(minutesLate)}`;
}

export function formatCountdown(reminder: Reminder, now: Date): string | null {
  const dateTime = getReminderDateTime(reminder);
  if (!dateTime || dateTime.getTime() <= now.getTime()) return null;
  const minutesLeft = (dateTime.getTime() - now.getTime()) / 60_000;
  return `Через ${formatDuration(minutesLeft)}`;
}

export interface ReminderGroup {
  key: string;
  label: string;
  reminders: Reminder[];
}

/** Groups active (non-completed) reminders by time bucket, in display order. */
export function groupReminders(reminders: Reminder[], now: Date): ReminderGroup[] {
  const active = reminders.filter((reminder) => !reminder.completed);
  const todayKey = getLocalDateKey(now);
  const tomorrowKey = getLocalDateKey(addDays(now, 1));

  const overdue: Reminder[] = [];
  const dueToday: Reminder[] = [];
  const tomorrow: Reminder[] = [];
  const thisWeek: Reminder[] = [];
  const later: Reminder[] = [];
  const noDate: Reminder[] = [];

  for (const reminder of active) {
    if (!reminder.date) {
      noDate.push(reminder);
      continue;
    }
    if (isOverdue(reminder, now)) {
      overdue.push(reminder);
      continue;
    }
    if (reminder.date === todayKey) {
      dueToday.push(reminder);
      continue;
    }
    if (reminder.date === tomorrowKey) {
      tomorrow.push(reminder);
      continue;
    }
    const diff = diffInCalendarDays(fromISODate(reminder.date), now);
    if (diff > 1 && diff <= 6) {
      thisWeek.push(reminder);
    } else {
      later.push(reminder);
    }
  }

  const byDateTime = (a: Reminder, b: Reminder) => {
    const dateA = getReminderDateTime(a)?.getTime() ?? 0;
    const dateB = getReminderDateTime(b)?.getTime() ?? 0;
    return dateA - dateB;
  };

  const groups: ReminderGroup[] = [
    { key: "overdue", label: "Просроченные", reminders: overdue.sort(byDateTime) },
    { key: "today", label: "Сегодня", reminders: dueToday.sort(byDateTime) },
    { key: "tomorrow", label: "Завтра", reminders: tomorrow.sort(byDateTime) },
    { key: "thisWeek", label: "На этой неделе", reminders: thisWeek.sort(byDateTime) },
    { key: "later", label: "Позже", reminders: later.sort(byDateTime) },
    { key: "noDate", label: "Без даты", reminders: noDate },
  ];

  return groups.filter((group) => group.reminders.length > 0);
}

export function matchesQuickFilter(reminder: Reminder, filter: QuickFilterKey, now: Date, todayKey: string): boolean {
  switch (filter) {
    case "all":
      return !reminder.completed;
    case "today":
      return !reminder.completed && reminder.date === todayKey;
    case "upcoming": {
      if (reminder.completed || !reminder.date || isOverdue(reminder, now)) return false;
      const dateTime = getReminderDateTime(reminder);
      return dateTime !== null && dateTime.getTime() > now.getTime();
    }
    case "overdue":
      return isOverdue(reminder, now);
    case "completed":
      return reminder.completed;
    case "noDate":
      return !reminder.completed && !reminder.date;
    default:
      return true;
  }
}

export function getNextReminder(reminders: Reminder[], now: Date): Reminder | null {
  const upcoming = reminders
    .filter((reminder) => !reminder.completed && reminder.date)
    .map((reminder) => ({ reminder, time: getReminderDateTime(reminder)!.getTime() }))
    .filter(({ time }) => time >= now.getTime())
    .sort((a, b) => a.time - b.time);
  return upcoming[0]?.reminder ?? null;
}

export type ReminderSortKey = "time" | "priority" | "created" | "title";

const priorityRank: Record<ReminderPriority, number> = { high: 0, medium: 1, low: 2 };

export function sortReminders(reminders: Reminder[], sortKey: ReminderSortKey): Reminder[] {
  const list = [...reminders];
  switch (sortKey) {
    case "priority":
      return list.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
    case "title":
      return list.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    case "created":
      return list.sort((a, b) => a.id.localeCompare(b.id));
    case "time":
    default:
      return list.sort((a, b) => {
        const timeA = getReminderDateTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        const timeB = getReminderDateTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
        return timeA - timeB;
      });
  }
}

export function datesWithReminders(reminders: Reminder[]): Set<string> {
  const set = new Set<string>();
  for (const reminder of reminders) {
    if (reminder.date && !reminder.completed) set.add(reminder.date);
  }
  return set;
}

export type SnoozeOption = "10m" | "30m" | "1h" | "evening" | "tomorrow";

export function applySnooze(
  reminder: Reminder,
  option: SnoozeOption,
  now: Date,
): { date: string; time: string } {
  const base = getReminderDateTime(reminder) ?? now;
  const reference = base.getTime() > now.getTime() ? base : now;

  switch (option) {
    case "10m":
      return splitDateTime(new Date(reference.getTime() + 10 * 60_000));
    case "30m":
      return splitDateTime(new Date(reference.getTime() + 30 * 60_000));
    case "1h":
      return splitDateTime(new Date(reference.getTime() + 60 * 60_000));
    case "evening": {
      const eveningToday = new Date(now);
      eveningToday.setHours(19, 0, 0, 0);
      if (eveningToday.getTime() <= now.getTime()) eveningToday.setDate(eveningToday.getDate() + 1);
      return splitDateTime(eveningToday);
    }
    case "tomorrow": {
      const tomorrow = addDays(now, 1);
      const [hours, minutes] = (reminder.time ?? "09:00").split(":").map(Number);
      tomorrow.setHours(hours, minutes, 0, 0);
      return splitDateTime(tomorrow);
    }
    default:
      return splitDateTime(reference);
  }
}

function splitDateTime(date: Date): { date: string; time: string } {
  return { date: getLocalDateKey(date), time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}` };
}

export const SNOOZE_OPTIONS: { key: SnoozeOption; label: string }[] = [
  { key: "10m", label: "На 10 минут" },
  { key: "30m", label: "На 30 минут" },
  { key: "1h", label: "На 1 час" },
  { key: "evening", label: "До вечера" },
  { key: "tomorrow", label: "До завтра" },
];

export { minutesToTime, timeToMinutes };
