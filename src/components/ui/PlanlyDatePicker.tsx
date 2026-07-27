"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { calendarIconButton } from "@/lib/calendar-button-styles";
import { addMonths, formatDateDMY, formatMonthYear, fromISODate, getMonthGrid, isSameDay, startOfMonth, toISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export interface PlanlyDatePickerProps {
  /** "YYYY-MM-DD", or "" when empty. */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  /** Defaults to `!required` — required fields hide the clear affordance. */
  allowClear?: boolean;
  placeholder?: string;
  /** "YYYY-MM-DD" bounds, inclusive. */
  minDate?: string;
  maxDate?: string;
  error?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

export function PlanlyDatePicker({
  value,
  onChange,
  disabled,
  required,
  allowClear,
  placeholder = "Выберите дату",
  minDate,
  maxDate,
  error,
  className,
  id,
  "aria-label": ariaLabel,
}: PlanlyDatePickerProps) {
  const canClear = allowClear ?? !required;
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(value ? fromISODate(value) : new Date()));
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);
  useEscapeKey(() => setOpen(false), open);

  // Re-center the visible month on whatever is currently selected every time the popover opens.
  useEffect(() => {
    if (open) setViewMonth(startOfMonth(value ? fromISODate(value) : new Date()));
  }, [open, value]);

  const selectedDate = value ? fromISODate(value) : null;
  const today = new Date();
  const days = getMonthGrid(viewMonth);
  const currentMonth = viewMonth.getMonth();
  const min = minDate ? fromISODate(minDate) : null;
  const max = maxDate ? fromISODate(maxDate) : null;

  function isDisabledDay(day: Date): boolean {
    if (min && day < min) return true;
    if (max && day > max) return true;
    return false;
  }

  function selectDay(day: Date) {
    if (isDisabledDay(day)) return;
    onChange(toISODate(day));
    setOpen(false);
  }

  function clear() {
    onChange("");
    setOpen(false);
  }

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:pointer-events-none disabled:opacity-40 dark:bg-gray-800",
          error ? "border-red-400 dark:border-red-500/60" : "border-gray-200 dark:border-gray-700",
        )}
      >
        <CalendarIcon size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />
        <span className={cn("flex-1 truncate", selectedDate ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500")}>
          {selectedDate ? formatDateDMY(selectedDate) : placeholder}
        </span>
        {canClear && value && !disabled && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Очистить дату"
            onClick={(event) => {
              event.stopPropagation();
              clear();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                clear();
              }
            }}
            className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Выбор даты"
          className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-50">{formatMonthYear(viewMonth)}</span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMonth((month) => addMonths(month, -1))}
                aria-label="Предыдущий месяц"
                className={calendarIconButton}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMonth((month) => addMonths(month, 1))}
                aria-label="Следующий месяц"
                className={calendarIconButton}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAY_LABELS.map((label) => (
              <span key={label} className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                {label}
              </span>
            ))}

            {days.map((day) => {
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentMonth = day.getMonth() === currentMonth;
              const disabledDay = isDisabledDay(day);

              return (
                <button
                  key={toISODate(day)}
                  type="button"
                  onClick={() => selectDay(day)}
                  disabled={disabledDay}
                  aria-pressed={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  className={cn(
                    "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent",
                    isSelected
                      ? "bg-blue-600 font-semibold text-white"
                      : isToday
                        ? "font-semibold text-blue-600 ring-1 ring-inset ring-blue-400 dark:text-blue-400 dark:ring-blue-500/60"
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

          {canClear && value && (
            <button
              type="button"
              onClick={clear}
              className="mt-2 w-full rounded-lg px-2 py-1.5 text-center text-xs font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Очистить дату
            </button>
          )}
        </div>
      )}
    </div>
  );
}
