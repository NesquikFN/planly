export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addMonths(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
  return next;
}

export function startOfWeek(date: Date): Date {
  const next = new Date(date);
  const day = next.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

function capitalize(text: string): string {
  return text.length > 0 ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

export function formatWeekdayShort(date: Date): string {
  return capitalize(date.toLocaleDateString("ru-RU", { weekday: "short" }).replace(".", ""));
}

export function formatMonthYear(date: Date): string {
  return capitalize(date.toLocaleDateString("ru-RU", { month: "long", year: "numeric" }));
}

export function formatFullDateLabel(date: Date): string {
  return capitalize(date.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" }));
}

export function formatMonthLabel(date: Date): string {
  return capitalize(date.toLocaleDateString("ru-RU", { month: "long" }));
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

export function diffInCalendarDays(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const normalizedA = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const normalizedB = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((normalizedA.getTime() - normalizedB.getTime()) / msPerDay);
}

// --- Single, unified date/time toolkit -------------------------------------
// Every part of the app (Header, tasks, calendar, notifications) should go
// through these instead of rolling its own `new Date()` / string-slicing —
// that's how the "22 июля" hardcoded-date and UTC-offset bugs crept in.

/** Local calendar-date key "YYYY-MM-DD" — never use toISOString().slice(0,10),
 * which shifts to UTC and can land on the wrong day near midnight. */
export const getLocalDateKey = toISODate;

export function startOfLocalDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export const startOfWeekMonday = startOfWeek;

export function endOfWeekSunday(date: Date): Date {
  const end = addDays(startOfWeek(date), 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function isToday(date: Date): boolean {
  return diffInCalendarDays(date, new Date()) === 0;
}

export function isYesterday(date: Date): boolean {
  return diffInCalendarDays(date, new Date()) === -1;
}

export function isTomorrow(date: Date): boolean {
  return diffInCalendarDays(date, new Date()) === 1;
}

/** "Четверг, 23 июля" — capitalized weekday + day + month, ru-RU. */
export const formatRussianDate = formatFullDateLabel;

const GREETING_RANGES: { start: number; end: number; text: string }[] = [
  { start: 5, end: 12, text: "Доброе утро" },
  { start: 12, end: 18, text: "Добрый день" },
  { start: 18, end: 23, text: "Добрый вечер" },
];

/** 05:00–11:59 утро, 12:00–17:59 день, 18:00–22:59 вечер, 23:00–04:59 ночь. */
export function getGreeting(date: Date): string {
  const hour = date.getHours();
  const match = GREETING_RANGES.find((range) => hour >= range.start && hour < range.end);
  return match ? match.text : "Доброй ночи";
}

/** 6x7 grid (Monday-first) of the given month, including leading/trailing days from adjacent months. */
export function getMonthGrid(monthStart: Date): Date[] {
  const gridStart = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}
