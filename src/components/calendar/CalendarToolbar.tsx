"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { FilterPanel } from "@/components/calendar/FilterPanel";
import type { CalendarViewMode } from "@/types/calendar";
import { calendarButtonBase, calendarButtonIdle, calendarButtonSelected, calendarIconButton } from "@/lib/calendar-button-styles";
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

export function CalendarToolbar() {
  const { periodLabel, goToToday, goToPrevious, goToNext, viewMode, setViewMode, openCreateModal } =
    useCalendarStore();
  const navLabels = NAV_LABELS[viewMode];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={goToToday}
          className={cn(calendarButtonBase, calendarButtonIdle, "border-gray-200 px-3 py-1.5")}
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

        <span className="inline-flex items-center gap-1 text-base font-semibold text-gray-900">
          {periodLabel}
          <ChevronDown size={15} className="text-gray-400" />
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-lg bg-gray-50 p-1 text-sm">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              aria-pressed={viewMode === mode}
              className={cn(
                calendarButtonBase,
                "px-3 py-1.5",
                viewMode === mode ? calendarButtonSelected : "border border-transparent hover:bg-white",
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-1"
        >
          <Plus size={16} />
          Добавить
          <ChevronDown size={14} className="opacity-70" />
        </button>
      </div>
    </div>
  );
}
