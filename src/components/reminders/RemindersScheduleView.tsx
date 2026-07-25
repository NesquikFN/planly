"use client";

import { CalendarX2 } from "lucide-react";
import { ReminderCard } from "@/components/reminders/ReminderCard";
import { formatReminderDateLabel, getReminderDateTime, type SnoozeOption } from "@/lib/reminders";
import type { Reminder } from "@/types/reminder";

interface RemindersScheduleViewProps {
  reminders: Reminder[];
  now: Date;
  today: Date;
  onToggleComplete: (id: string) => void;
  onToggleStar: (id: string) => void;
  onSnooze: (id: string, option: SnoozeOption) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

export function RemindersScheduleView({
  reminders,
  now,
  today,
  onToggleComplete,
  onToggleStar,
  onSnooze,
  onEdit,
  onDelete,
}: RemindersScheduleViewProps) {
  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center dark:border-gray-800 dark:bg-gray-900">
        <CalendarX2 size={28} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Ничего не найдено</p>
        <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Попробуйте изменить фильтры или запрос поиска</p>
      </div>
    );
  }

  const sorted = [...reminders].sort((a, b) => {
    const timeA = getReminderDateTime(a)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const timeB = getReminderDateTime(b)?.getTime() ?? Number.MAX_SAFE_INTEGER;
    return timeA - timeB;
  });

  let lastDateKey: string | null | undefined = undefined;

  return (
    <div className="space-y-2">
      {sorted.map((reminder) => {
        const dateKey = reminder.date ?? null;
        const showDivider = dateKey !== lastDateKey;
        lastDateKey = dateKey;

        return (
          <div key={reminder.id}>
            {showDivider && (
              <p className="mb-1.5 mt-4 px-1 text-xs font-semibold uppercase tracking-wide text-gray-400 first:mt-0 dark:text-gray-500">
                {formatReminderDateLabel(reminder, today)}
              </p>
            )}
            <ReminderCard
              reminder={reminder}
              now={now}
              today={today}
              compact
              onToggleComplete={onToggleComplete}
              onToggleStar={onToggleStar}
              onSnooze={onSnooze}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        );
      })}
    </div>
  );
}
