export type ReminderCategory = "work" | "personal" | "health" | "finance" | "shopping" | "meetings";
export type ReminderPriority = "high" | "medium" | "low";
export type ReminderRepeat = "none" | "daily" | "weekdays" | "weekly" | "monthly" | "custom";
export type ReminderLeadTime = "none" | "5m" | "15m" | "30m" | "1h" | "1d";

export interface ReminderLinks {
  project?: string;
  task?: string;
  note?: string;
  event?: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  /** ISO "YYYY-MM-DD" — absent means "без даты". */
  date?: string;
  /** 24h "HH:MM" — absent means all-day/no specific time. */
  time?: string;
  category: ReminderCategory;
  priority: ReminderPriority;
  repeat: ReminderRepeat;
  leadTime: ReminderLeadTime;
  completed: boolean;
  completedLabel?: string;
  starred: boolean;
  links?: ReminderLinks;
}

export type ReminderDraft = Omit<Reminder, "id" | "completed" | "starred" | "completedLabel">;

export type QuickFilterKey = "all" | "today" | "upcoming" | "overdue" | "completed" | "noDate";
