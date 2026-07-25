"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { CALENDAR_COLORS } from "@/lib/calendar-constants";
import { cn } from "@/lib/utils";
import type { CalendarColor } from "@/types/calendar";

export function CalendarFormModal() {
  const { calendars, calendarFormState, closeCalendarForm, createCalendar, renameCalendar, recolorCalendar } =
    useCalendarStore();

  const editingCalendar =
    calendarFormState?.mode === "edit" ? calendars.find((cal) => cal.id === calendarFormState.calendarId) : undefined;

  const [name, setName] = useState("");
  const [color, setColor] = useState<CalendarColor>("blue");

  useEffect(() => {
    if (!calendarFormState) return;
    if (calendarFormState.mode === "edit" && editingCalendar) {
      setName(editingCalendar.name);
      setColor(editingCalendar.color);
    } else {
      setName("");
      setColor("blue");
    }
  }, [calendarFormState, editingCalendar]);

  if (!calendarFormState) return null;

  function handleSubmit(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    if (!name.trim()) return;

    if (calendarFormState?.mode === "edit") {
      renameCalendar(calendarFormState.calendarId, name);
      recolorCalendar(calendarFormState.calendarId, color);
    } else {
      createCalendar(name, color);
    }
    closeCalendarForm();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20" onClick={closeCalendarForm} aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {calendarFormState.mode === "edit" ? "Изменить календарь" : "Новый календарь"}
          </h3>
          <button
            type="button"
            onClick={closeCalendarForm}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Название</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
            />
          </label>

          <div>
            <span className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Цвет</span>
            <div className="flex flex-wrap items-center gap-2">
              {CALENDAR_COLORS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setColor(option)}
                  aria-label={option}
                  aria-pressed={color === option}
                  className={cn(
                    "h-6 w-6 rounded-full transition-shadow",
                    calendarColorStyles[option].dot,
                    color === option && "ring-2 ring-gray-400 ring-offset-2 dark:ring-gray-500 dark:ring-offset-gray-900",
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeCalendarForm}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {calendarFormState.mode === "edit" ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
