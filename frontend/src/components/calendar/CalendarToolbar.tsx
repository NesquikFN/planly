"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { FilterPanel } from "@/components/calendar/FilterPanel";
import type { CalendarViewMode } from "@/types/calendar";
import { calendarButtonBase, calendarButtonIdle, calendarIconButton } from "@/lib/calendar-button-styles";
import { cn } from "@/lib/utils";

const VIEW_MODE_LABELS: Record<CalendarViewMode, string> = {
  day: "День",
  week: "Неделя",
  month: "Месяц",
  agenda: "Повестка",
};

const NAV_LABELS: Record<CalendarViewMode, { prev: string; next: string }> = {
  day: { prev: "Предыдущий день", next: "Следующий день" },
  week: { prev: "Предыдущая неделя", next: "Следующая неделя" },
  month: { prev: "Предыдущий месяц", next: "Следующий месяц" },
  agenda: { prev: "Предыдущий период", next: "Следующий период" },
};

const VIEW_MODES: CalendarViewMode[] = ["day", "week", "month", "agenda"];

// Calm, minimal toolbar: period + navigation on the left, view switcher +
// filter + create on the right. No standing filter pills — calendar
// visibility lives entirely in FilterPanel's popover (see brief: filters
// shouldn't be permanently on screen).
export function CalendarToolbar() {
  const { periodLabel, goToToday, goToPrevious, goToNext, viewMode, setViewMode, openCreateModal } = useCalendarStore();
  const navLabels = NAV_LABELS[viewMode];

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 dark:border-white/[0.06] sm:px-5 sm:py-4">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-gray-900 dark:text-ink">{periodLabel}</span>

        <button
          type="button"
          onClick={goToToday}
          className={cn(calendarButtonBase, calendarButtonIdle, "border-gray-200 px-3 py-1.5 dark:border-white/8")}
        >
          Сегодня
        </button>

        <div className="flex items-center gap-0.5">
          <button type="button" onClick={goToPrevious} aria-label={navLabels.prev} className={calendarIconButton}>
            <ChevronLeft size={18} />
          </button>
          <button type="button" onClick={goToNext} aria-label={navLabels.next} className={calendarIconButton}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg bg-gray-50 p-1 text-sm dark:bg-surface-2">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={cn(
                calendarButtonBase,
                "px-3 py-1.5",
                viewMode === mode
                  ? "border border-gray-200 bg-white text-gray-900 dark:border-white/8 dark:bg-surface dark:text-ink"
                  : "border border-transparent hover:bg-white dark:hover:bg-surface",
              )}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        <FilterPanel />

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-accent/90 active:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-canvas"
        >
          <Plus size={16} />
          Добавить событие
        </button>
      </div>
    </div>
  );
}
