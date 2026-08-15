"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { calendarIconButton } from "@/lib/calendar-button-styles";
import { addMonths, formatMonthYear, getLocalDateKey, getMonthGrid, isSameDay, startOfMonth } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

interface RemindersCalendarProps {
  today: Date;
  selectedDateKey: string | null;
  onSelectDate: (dateKey: string) => void;
  datesWithReminders: Set<string>;
}

export function RemindersCalendar({ today, selectedDateKey, onSelectDate, datesWithReminders }: RemindersCalendarProps) {
  const [month, setMonth] = useState<Date>(() => startOfMonth(today));

  const days = getMonthGrid(month);
  const currentMonth = month.getMonth();

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-ink">{formatMonthYear(month)}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setMonth((prev) => addMonths(prev, -1))}
            aria-label="Предыдущий месяц"
            className={calendarIconButton}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => setMonth((prev) => addMonths(prev, 1))}
            aria-label="Следующий месяц"
            className={calendarIconButton}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-[11px] font-medium text-gray-400 dark:text-ink-faint">
            {label}
          </span>
        ))}

        {days.map((day) => {
          const dateKey = getLocalDateKey(day);
          const isToday = isSameDay(day, today);
          const isSelected = selectedDateKey === dateKey;
          const isCurrentMonth = day.getMonth() === currentMonth;
          const hasReminders = datesWithReminders.has(dateKey);

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              aria-pressed={isSelected}
              className="relative mx-auto flex h-7 w-7 items-center justify-center"
            >
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors duration-150",
                  isToday
                    ? "bg-accent font-semibold text-white"
                    : isSelected
                      ? "bg-gray-200 font-semibold text-gray-900 dark:bg-surface-2 dark:text-ink"
                      : isCurrentMonth
                        ? "text-gray-700 hover:bg-gray-100 dark:text-ink-dim dark:hover:bg-surface-2"
                        : "text-gray-300 hover:bg-gray-100 dark:text-ink-faint dark:hover:bg-surface-2",
                )}
              >
                {day.getDate()}
              </span>
              {hasReminders && !isToday && (
                <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-gray-400 dark:bg-ink-faint" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
