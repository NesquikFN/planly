import {
  Briefcase,
  HeartPulse,
  ShoppingCart,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { CalendarColor } from "@/types/calendar";
import type {
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

// System categories and form options; these are UI structure, not reminders.
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
  low: { label: "Низкий", badge: "bg-gray-100 text-gray-500 dark:bg-surface-2 dark:text-ink-faint" },
};
