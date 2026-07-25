import {
  Archive,
  Bell,
  Briefcase,
  CalendarClock,
  CalendarX2,
  CheckCircle2,
  Clock,
  HeartPulse,
  ListTodo,
  ShoppingCart,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { CalendarColor } from "@/types/calendar";
import { addDays, toISODate } from "@/lib/date-utils";
import { minutesToTime } from "@/lib/calendar-time";
import type {
  QuickFilterKey,
  Reminder,
  ReminderCategory,
  ReminderLeadTime,
  ReminderPriority,
  ReminderRepeat,
} from "@/types/reminder";

export interface ReminderCategoryDef {
  key: ReminderCategory;
  label: string;
  color: CalendarColor;
  icon: LucideIcon;
}

export const REMINDER_CATEGORIES: ReminderCategoryDef[] = [
  { key: "work", label: "Работа", color: "blue", icon: Briefcase },
  { key: "personal", label: "Личное", color: "purple", icon: User },
  { key: "health", label: "Здоровье", color: "green", icon: HeartPulse },
  { key: "finance", label: "Финансы", color: "orange", icon: Wallet },
  { key: "shopping", label: "Покупки", color: "pink", icon: ShoppingCart },
  { key: "meetings", label: "Встречи", color: "teal", icon: Users },
];

export function categoryDef(category: ReminderCategory): ReminderCategoryDef {
  return REMINDER_CATEGORIES.find((item) => item.key === category) ?? REMINDER_CATEGORIES[0];
}

export interface RepeatOptionDef {
  key: ReminderRepeat;
  label: string;
}

// Sidebar filter — the four buckets called out in the brief.
export const REPEAT_FILTERS: RepeatOptionDef[] = [
  { key: "none", label: "Однократные" },
  { key: "daily", label: "Ежедневные" },
  { key: "weekly", label: "Еженедельные" },
  { key: "monthly", label: "Ежемесячные" },
];

// Full set — used by the create/edit modal.
export const REPEAT_OPTIONS: RepeatOptionDef[] = [
  { key: "none", label: "Не повторять" },
  { key: "daily", label: "Каждый день" },
  { key: "weekdays", label: "По будням" },
  { key: "weekly", label: "Каждую неделю" },
  { key: "monthly", label: "Каждый месяц" },
  { key: "custom", label: "Пользовательский период" },
];

export const LEAD_TIME_OPTIONS: { key: ReminderLeadTime; label: string }[] = [
  { key: "none", label: "В момент события" },
  { key: "5m", label: "За 5 минут" },
  { key: "15m", label: "За 15 минут" },
  { key: "30m", label: "За 30 минут" },
  { key: "1h", label: "За 1 час" },
  { key: "1d", label: "За 1 день" },
];

export const PRIORITY_OPTIONS: { key: ReminderPriority; label: string }[] = [
  { key: "high", label: "Высокий" },
  { key: "medium", label: "Средний" },
  { key: "low", label: "Низкий" },
];

export const PRIORITY_META: Record<ReminderPriority, { label: string; badge: string }> = {
  high: { label: "Высокий", badge: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
  medium: { label: "Средний", badge: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400" },
  low: { label: "Низкий", badge: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" },
};

export interface QuickFilterDef {
  key: QuickFilterKey;
  label: string;
  icon: LucideIcon;
  count: number;
}

// Static, decorative totals (same convention as Projects/Notes) — the actual
// mock array below is smaller; quick filters narrow within it.
export const QUICK_FILTERS: QuickFilterDef[] = [
  { key: "all", label: "Все напоминания", icon: Bell, count: 18 },
  { key: "today", label: "Сегодня", icon: CalendarClock, count: 5 },
  { key: "upcoming", label: "Предстоящие", icon: Clock, count: 9 },
  { key: "overdue", label: "Просроченные", icon: ListTodo, count: 3 },
  { key: "completed", label: "Выполненные", icon: CheckCircle2, count: 24 },
  { key: "noDate", label: "Без даты", icon: CalendarX2, count: 1 },
];

export const ARCHIVE_ICON = Archive;

interface ReminderSeed {
  id: string;
  title: string;
  description?: string;
  /** Days from "today". Omit entirely for "no date" reminders. */
  dayOffset?: number;
  /** Fixed clock time — used for anything not "today". */
  time?: string;
  /** Minutes relative to the real current time — only for today's items, so
   * overdue/upcoming examples stay true regardless of when the demo runs. */
  minuteOffsetFromNow?: number;
  category: ReminderCategory;
  priority: ReminderPriority;
  repeat: ReminderRepeat;
  leadTime?: ReminderLeadTime;
  links?: Reminder["links"];
  completed?: boolean;
  completedLabel?: string;
  starred?: boolean;
}

const SEEDS: ReminderSeed[] = [
  {
    id: "r1",
    title: "Отправить документы бухгалтеру",
    description: "Подготовить и отправить отчётные документы за месяц",
    dayOffset: 0,
    minuteOffsetFromNow: -120,
    category: "work",
    priority: "high",
    repeat: "none",
    links: { project: "Финансы и бюджет" },
  },
  {
    id: "r2",
    title: "Позвонить поставщику материалов",
    description: "Уточнить наличие циркониевых дисков",
    dayOffset: 0,
    minuteOffsetFromNow: -45,
    category: "work",
    priority: "medium",
    repeat: "none",
  },
  {
    id: "r3",
    title: "Приём витаминов",
    description: "Принять витамины после ужина",
    dayOffset: 0,
    minuteOffsetFromNow: 180,
    category: "health",
    priority: "low",
    repeat: "daily",
  },
  {
    id: "r4",
    title: "Проверить расписание на завтра",
    dayOffset: 0,
    minuteOffsetFromNow: 240,
    category: "personal",
    priority: "low",
    repeat: "none",
    links: { event: "Календарь" },
  },
  {
    id: "r5",
    title: "Подготовить план лечения пациента",
    description: "Проверить КЛКТ и составить предварительный план",
    dayOffset: 0,
    minuteOffsetFromNow: 300,
    category: "work",
    priority: "high",
    repeat: "none",
    links: { project: "Клиника 2026" },
    starred: true,
  },
  {
    id: "r6",
    title: "Заказать материалы для лаборатории",
    dayOffset: 1,
    time: "10:00",
    category: "shopping",
    priority: "medium",
    repeat: "none",
    links: { task: "Проверить остатки материалов" },
  },
  {
    id: "r7",
    title: "Консультация пациента",
    dayOffset: 1,
    time: "14:00",
    category: "meetings",
    priority: "medium",
    repeat: "none",
    links: { event: "Консультация пациента" },
  },
  {
    id: "r8",
    title: "Оплатить интернет",
    dayOffset: 1,
    time: "19:00",
    category: "finance",
    priority: "low",
    repeat: "monthly",
  },
  {
    id: "r9",
    title: "Подготовить презентацию",
    dayOffset: 4,
    time: "12:00",
    category: "work",
    priority: "medium",
    repeat: "none",
    links: { project: "Курс по имплантологии" },
  },
  {
    id: "r10",
    title: "Забронировать гостиницу",
    dayOffset: 6,
    time: "18:00",
    category: "personal",
    priority: "low",
    repeat: "none",
    links: { note: "Поездка в Грузию" },
  },
  {
    id: "r11",
    title: "Забрать документы из типографии",
    dayOffset: -1,
    time: "11:00",
    category: "work",
    priority: "medium",
    repeat: "none",
    completed: true,
    completedLabel: "Вчера, 11:20",
  },
  {
    id: "r12",
    title: "Оплатить аренду кабинета",
    dayOffset: -2,
    time: "09:00",
    category: "finance",
    priority: "high",
    repeat: "monthly",
    completed: true,
    completedLabel: "22 июля, 09:05",
  },
  {
    id: "r13",
    title: "Позвонить в лабораторию",
    dayOffset: -3,
    time: "15:00",
    category: "work",
    priority: "low",
    repeat: "none",
    completed: true,
    completedLabel: "21 июля, 15:10",
  },
  {
    id: "r14",
    title: "Пересмотреть план развития клиники",
    description: "Собрать идеи для следующего года",
    category: "personal",
    priority: "low",
    repeat: "none",
  },
];

export function createMockReminders(now: Date): Reminder[] {
  return SEEDS.map((seed) => {
    let date: string | undefined;
    let time: string | undefined;

    if (typeof seed.dayOffset === "number") {
      if (typeof seed.minuteOffsetFromNow === "number") {
        const absolute = new Date(now.getTime() + seed.minuteOffsetFromNow * 60_000);
        date = toISODate(absolute);
        time = `${String(absolute.getHours()).padStart(2, "0")}:${String(absolute.getMinutes()).padStart(2, "0")}`;
      } else {
        date = toISODate(addDays(now, seed.dayOffset));
        time = seed.time;
      }
    }

    return {
      id: seed.id,
      title: seed.title,
      description: seed.description,
      date,
      time,
      category: seed.category,
      priority: seed.priority,
      repeat: seed.repeat,
      leadTime: seed.leadTime ?? "none",
      completed: seed.completed ?? false,
      completedLabel: seed.completedLabel,
      starred: seed.starred ?? false,
      links: seed.links,
    };
  });
}

// Re-exported so callers don't need calendar-time directly for the snooze menu.
export { minutesToTime };
