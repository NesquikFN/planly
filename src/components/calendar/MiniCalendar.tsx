"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarIconButton } from "@/lib/calendar-button-styles";
import { formatMonthYear, getMonthGrid, isSameDay } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function MiniCalendar() {
  const { today, anchorDate, miniMonth, goToPreviousMiniMonth, goToNextMiniMonth, goToDate } = useCalendarStore();
  const [navCounter, setNavCounter] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  const days = getMonthGrid(miniMonth);
  const currentMonth = miniMonth.getMonth();

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{formatMonthYear(miniMonth)}</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              setDirection("backward");
              setNavCounter((n) => n + 1);
              goToPreviousMiniMonth();
            }}
            aria-label="Предыдущий месяц"
            className={calendarIconButton}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setDirection("forward");
              setNavCounter((n) => n + 1);
              goToNextMiniMonth();
            }}
            aria-label="Следующий месяц"
            className={calendarIconButton}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        key={navCounter}
        className={cn(
          "mt-3 grid grid-cols-7 gap-y-1 text-center",
          direction === "forward" ? "calendar-slide-forward" : "calendar-slide-backward",
        )}
      >
        {WEEKDAY_LABELS.map((label) => (
          <span key={label} className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
            {label}
          </span>
        ))}

        {days.map((day) => {
          const isToday = isSameDay(day, today);
          const isSelected = !isToday && isSameDay(day, anchorDate);
          const isCurrentMonth = day.getMonth() === currentMonth;

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => goToDate(day)}
              aria-pressed={isToday || isSelected}
              className={cn(
                "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors duration-150",
                isToday
                  ? "bg-blue-600 font-semibold text-white"
                  : isSelected
                    ? "bg-gray-200 font-semibold text-gray-900 dark:bg-gray-700 dark:text-gray-50"
                    : isCurrentMonth
                      ? "text-gray-700 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700"
                      : "text-gray-300 hover:bg-gray-100 dark:text-gray-600 dark:hover:bg-gray-800",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
