"use client";

import {
  Bell,
  BellRing,
  CalendarPlus,
  CalendarRange,
  CheckCircle2,
  Flag,
} from "lucide-react";
import { RemindersCalendar } from "@/components/reminders/RemindersCalendar";
import { SnoozeMenu } from "@/components/reminders/SnoozeMenu";
import { datesWithReminders, formatCountdown, formatReminderDateLabel, type SnoozeOption } from "@/lib/reminders";
import type { Reminder } from "@/types/reminder";

interface RemindersInfoPanelProps {
  reminders: Reminder[];
  now: Date;
  today: Date;
  nextReminder: Reminder | null;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  onToggleComplete: (id: string) => void;
  onSnooze: (id: string, option: SnoozeOption) => void;
  onOpenReminder: (reminder: Reminder) => void;
  onCreateEvent: () => void;
  onCreateReminder: () => void;
  onOpenCalendar: () => void;
}

export function RemindersInfoPanel({
  reminders,
  now,
  today,
  nextReminder,
  selectedDateKey,
  onSelectDate,
  onToggleComplete,
  onSnooze,
  onOpenReminder,
  onCreateEvent,
  onCreateReminder,
  onOpenCalendar,
}: RemindersInfoPanelProps) {
  const completedCount = reminders.filter((reminder) => reminder.completed).length;
  const overdueCount = reminders.filter(
    (reminder) => !reminder.completed && reminder.date && new Date(`${reminder.date}T${reminder.time ?? "23:59"}`) < now,
  ).length;
  const remainingCount = reminders.filter((reminder) => !reminder.completed).length - overdueCount;
  const weekTotal = Math.max(1, completedCount + remainingCount + overdueCount);
  const nextCountdown = nextReminder ? formatCountdown(nextReminder, now) : null;

  const quickActions = [
    { key: "reminder", label: "Создать напоминание", icon: Bell, onClick: onCreateReminder },
    {
      key: "event",
      label: "Добавить событие",
      icon: CalendarPlus,
      onClick: onCreateEvent,
    },
    { key: "calendar", label: "Открыть календарь", icon: CalendarRange, onClick: onOpenCalendar },
  ];

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
        <RemindersCalendar
          today={today}
          selectedDateKey={selectedDateKey}
          onSelectDate={onSelectDate}
          datesWithReminders={datesWithReminders(reminders)}
        />
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Следующее напоминание</h3>
        {nextReminder ? (
          <div className="mt-3 rounded-xl bg-gray-50 p-3 dark:bg-surface-2/70">
            <button
              type="button"
              onClick={() => onOpenReminder(nextReminder)}
              className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            >
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-ink">{nextReminder.title}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-ink-faint">
                {formatReminderDateLabel(nextReminder, today)}
                {nextCountdown ? ` · ${nextCountdown}` : ""}
              </p>
            </button>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleComplete(nextReminder.id)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <CheckCircle2 size={13} />
                Выполнено
              </button>
              <SnoozeMenu
                onSnooze={(option) => onSnooze(nextReminder.id, option)}
                onPickDateTime={() => onOpenReminder(nextReminder)}
                triggerClassName="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-white hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:text-ink-faint dark:hover:bg-surface-2 dark:hover:text-ink-dim"
              />
            </div>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 p-3 text-sm text-gray-500 dark:bg-surface-2/70 dark:text-ink-faint">
            <BellRing size={16} className="shrink-0 text-gray-400 dark:text-ink-faint" />
            Нет активных напоминаний с датой.
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Прогресс недели</h3>
        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-surface-2">
          <div className="h-full bg-emerald-500" style={{ width: `${(completedCount / weekTotal) * 100}%` }} />
          <div className="h-full bg-accent" style={{ width: `${(remainingCount / weekTotal) * 100}%` }} />
          <div className="h-full bg-red-500" style={{ width: `${(overdueCount / weekTotal) * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-ink-faint">
            <Flag size={11} className="text-emerald-500" />
            Выполнено {completedCount}
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-ink-faint">
            <Flag size={11} className="text-accent" />
            Осталось {remainingCount}
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-ink-faint">
            <Flag size={11} className="text-red-500" />
            Просрочено {overdueCount}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface dark:shadow-none">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">Быстрые действия</h3>
        <div className="mt-2 space-y-1">
          {quickActions.map(({ key, label, icon: Icon, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:text-ink-faint dark:hover:bg-surface-2"
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
