"use client";

import { Bell, CalendarPlus, CalendarRange, ClipboardList, Flag } from "lucide-react";
import { RemindersCalendar } from "@/components/reminders/RemindersCalendar";
import { SnoozeMenu } from "@/components/reminders/SnoozeMenu";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { categoryDef } from "@/lib/reminders-mock-data";
import {
  datesWithReminders,
  formatCountdown,
  formatReminderDateLabel,
  getNextReminder,
  type SnoozeOption,
} from "@/lib/reminders";
import type { Reminder } from "@/types/reminder";

interface RemindersInfoPanelProps {
  reminders: Reminder[];
  now: Date;
  today: Date;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  onToggleComplete: (id: string) => void;
  onSnooze: (id: string, option: SnoozeOption) => void;
  onEdit: (reminder: Reminder) => void;
  onQuickAction: (action: string) => void;
  onCreateReminder: () => void;
  onOpenCalendar: () => void;
}

export function RemindersInfoPanel({
  reminders,
  now,
  today,
  selectedDateKey,
  onSelectDate,
  onToggleComplete,
  onSnooze,
  onEdit,
  onQuickAction,
  onCreateReminder,
  onOpenCalendar,
}: RemindersInfoPanelProps) {
  const next = getNextReminder(reminders, now);
  const countdown = next ? formatCountdown(next, now) : null;

  const upcomingTimeline = reminders
    .filter((reminder) => !reminder.completed && reminder.date && reminder.id !== next?.id)
    .filter((reminder) => new Date(`${reminder.date}T${reminder.time ?? "23:59"}`).getTime() >= now.getTime())
    .sort(
      (a, b) =>
        new Date(`${a.date}T${a.time ?? "23:59"}`).getTime() - new Date(`${b.date}T${b.time ?? "23:59"}`).getTime(),
    )
    .slice(0, 3);

  const completedCount = reminders.filter((r) => r.completed).length;
  const overdueCount = reminders.filter((r) => !r.completed && r.date && new Date(`${r.date}T${r.time ?? "23:59"}`) < now).length;
  const remainingCount = reminders.filter((r) => !r.completed).length - overdueCount;

  const weekTotal = Math.max(1, completedCount + remainingCount + overdueCount);

  const quickActions = [
    { key: "reminder", label: "Создать напоминание", icon: Bell, onClick: onCreateReminder },
    { key: "task", label: "Создать задачу", icon: ClipboardList, onClick: () => onQuickAction("Создать задачу") },
    { key: "event", label: "Добавить событие", icon: CalendarPlus, onClick: () => onQuickAction("Добавить событие") },
    { key: "calendar", label: "Открыть календарь", icon: CalendarRange, onClick: onOpenCalendar },
  ];

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto">
      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <RemindersCalendar
          today={today}
          selectedDateKey={selectedDateKey}
          onSelectDate={onSelectDate}
          datesWithReminders={datesWithReminders(reminders)}
        />
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Следующее напоминание</h3>
        {next ? (
          <div className="mt-2">
            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{next.title}</p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{formatReminderDateLabel(next, today)}</p>
            {countdown && (
              <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">{countdown}</p>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggleComplete(next.id)}
                className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
              >
                Выполнено
              </button>
              <SnoozeMenu
                onSnooze={(option) => onSnooze(next.id, option)}
                onPickDateTime={() => onEdit(next)}
                triggerClassName="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Нет предстоящих напоминаний</p>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Ближайшие</h3>
        {upcomingTimeline.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Больше напоминаний нет</p>
        ) : (
          <ul className="mt-2 space-y-3 border-l border-gray-100 pl-3 dark:border-gray-800">
            {upcomingTimeline.map((reminder) => {
              const category = categoryDef(reminder.category);
              const styles = calendarColorStyles[category.color];
              return (
                <li key={reminder.id} className="relative">
                  <span
                    className={`absolute -left-[15px] top-1 h-2 w-2 rounded-full ${styles.dot}`}
                  />
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{reminder.title}</p>
                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">{reminder.time ?? "—"}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Прогресс недели</h3>
        <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div className="h-full bg-emerald-500" style={{ width: `${(completedCount / weekTotal) * 100}%` }} />
          <div className="h-full bg-blue-400" style={{ width: `${(remainingCount / weekTotal) * 100}%` }} />
          <div className="h-full bg-red-500" style={{ width: `${(overdueCount / weekTotal) * 100}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Flag size={11} className="text-emerald-500" />
            Выполнено {completedCount}
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Flag size={11} className="text-blue-400" />
            Осталось {remainingCount}
          </span>
          <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Flag size={11} className="text-red-500" />
            Просрочено {overdueCount}
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Быстрые действия</h3>
        <div className="mt-2 space-y-1">
          {quickActions.map(({ key, label, icon: Icon, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
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
