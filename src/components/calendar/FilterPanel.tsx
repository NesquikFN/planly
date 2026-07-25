"use client";

import { useEffect, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { useClickOutside } from "@/hooks/useClickOutside";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { CALENDAR_COLORS } from "@/lib/calendar-constants";
import { countActiveFilters } from "@/lib/calendar-filters";
import { calendarButtonBase, calendarButtonIdle, calendarButtonSelected } from "@/lib/calendar-button-styles";
import { cn } from "@/lib/utils";
import type { CalendarColor, EventFilters } from "@/types/calendar";

const PRESET_FIELDS: { key: keyof EventFilters; label: string }[] = [
  { key: "onlyPersonal", label: "Только личные" },
  { key: "onlyWork", label: "Только рабочие" },
  { key: "onlyTasks", label: "Только задачи" },
  { key: "onlyEvents", label: "Только события" },
  { key: "onlyImportant", label: "Только важные" },
  { key: "onlyWithDescription", label: "Только с описанием" },
];

export function FilterPanel() {
  const { calendars, toggleCalendarVisibility, filters, applyFilters, resetFilters } = useCalendarStore();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<EventFilters>(filters);
  const containerRef = useRef<HTMLDivElement>(null);

  useClickOutside(containerRef, () => setOpen(false), open);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const activeCount = countActiveFilters(filters);

  function toggleColor(color: CalendarColor) {
    setDraft((prev) => ({
      ...prev,
      colors: prev.colors.includes(color) ? prev.colors.filter((c) => c !== color) : [...prev.colors, color],
    }));
  }

  function togglePreset(key: keyof EventFilters) {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleApply() {
    applyFilters(draft);
    setOpen(false);
  }

  function handleReset() {
    resetFilters();
    setOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          calendarButtonBase,
          "px-3 py-1.5",
          activeCount > 0 || open ? calendarButtonSelected : calendarButtonIdle,
        )}
      >
        <SlidersHorizontal size={15} />
        Фильтр
        {activeCount > 0 && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-gray-700 px-1 text-[10px] font-semibold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-72 rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">По календарям</p>
            <div className="space-y-1">
              {calendars.map((calendar) => (
                <label key={calendar.id} className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                  <input
                    type="checkbox"
                    checked={calendar.visible}
                    onChange={() => toggleCalendarVisibility(calendar.id)}
                    className={`h-3.5 w-3.5 rounded border-gray-300 dark:border-gray-600 ${calendarColorStyles[calendar.color].accent} focus:ring-0`}
                  />
                  <span className="truncate text-gray-600 dark:text-gray-300">{calendar.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">По цветам</p>
            <div className="flex flex-wrap gap-1.5">
              {CALENDAR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => toggleColor(color)}
                  aria-pressed={draft.colors.includes(color)}
                  className={cn(
                    "h-6 w-6 rounded-full transition-shadow",
                    calendarColorStyles[color].dot,
                    draft.colors.includes(color) && "ring-2 ring-gray-400 ring-offset-2 dark:ring-gray-500 dark:ring-offset-gray-900",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {PRESET_FIELDS.map((field) => (
              <label key={field.key} className="flex items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-gray-50 dark:hover:bg-gray-800">
                <input
                  type="checkbox"
                  checked={Boolean(draft[field.key])}
                  onChange={() => togglePreset(field.key)}
                  className="h-3.5 w-3.5 rounded border-gray-300 accent-gray-700 focus:ring-0 dark:border-gray-600 dark:accent-gray-400"
                />
                <span className="text-gray-600 dark:text-gray-300">{field.label}</span>
              </label>
            ))}
          </div>

          <div className="mt-3">
            <p className="mb-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Период времени</p>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={draft.dateFrom ?? ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, dateFrom: event.target.value || null }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
              <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
              <input
                type="date"
                value={draft.dateTo ?? ""}
                onChange={(event) => setDraft((prev) => ({ ...prev, dateTo: event.target.value || null }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-100 active:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 dark:active:bg-gray-700"
            >
              Сбросить
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Применить
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
