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

/** 6x7 grid (Monday-first) of the given month, including leading/trailing days from adjacent months. */
export function getMonthGrid(monthStart: Date): Date[] {
  const gridStart = startOfWeek(monthStart);
  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}
