// Daily activity streak — a plain module (not a React store) so any store's
// action handler (tasks, notes, calendar, projects) can record activity with
// a single import, without needing Context access or prop drilling.
// UI reads the snapshot via `getStreakData()` and re-renders on the
// `STREAK_UPDATED_EVENT` window event dispatched after every write.

import { addDays, getLocalDateKey } from "@/lib/date-utils";
import { readStorage, writeStorage } from "@/lib/storage";

const STREAK_STORAGE_KEY = "planly:streak";
export const STREAK_UPDATED_EVENT = "planly:streak-updated";

export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  /** "YYYY-MM-DD" of the last day a useful action was recorded, or null. */
  lastActiveDate: string | null;
  /** Deduped, ascending "YYYY-MM-DD" list of every active day. */
  activityDates: string[];
}

const EMPTY_STREAK: StreakData = { currentStreak: 0, bestStreak: 0, lastActiveDate: null, activityDates: [] };

function readStreak(): StreakData {
  return readStorage(STREAK_STORAGE_KEY, EMPTY_STREAK);
}

function writeStreak(data: StreakData): void {
  writeStorage(STREAK_STORAGE_KEY, data);
}

export function getStreakData(): StreakData {
  return readStreak();
}

/**
 * Records one "useful action" for today (create/complete a task, create a
 * note, add an event, update a project). Idempotent per calendar day — a
 * second call the same day is a no-op, so repeated actions never double the
 * streak. A full skipped calendar day resets the streak back to 1.
 */
export function recordDailyActivity(today: Date = new Date()): void {
  const todayKey = getLocalDateKey(today);
  const data = readStreak();

  if (data.lastActiveDate === todayKey) return; // already counted today

  const yesterdayKey = getLocalDateKey(addDays(today, -1));
  const isConsecutive = data.lastActiveDate === yesterdayKey;
  const currentStreak = isConsecutive ? data.currentStreak + 1 : 1;
  const bestStreak = Math.max(data.bestStreak, currentStreak);
  const activityDates = Array.from(new Set([...data.activityDates, todayKey])).sort();

  writeStreak({ currentStreak, bestStreak, lastActiveDate: todayKey, activityDates });
  window.dispatchEvent(new Event(STREAK_UPDATED_EVENT));
}
