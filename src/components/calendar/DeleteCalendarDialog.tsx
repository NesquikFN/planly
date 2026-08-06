"use client";

import { useEffect, useState } from "react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { cn } from "@/lib/utils";

type DeleteChoice = "withEvents" | "moveEvents";

export function DeleteCalendarDialog() {
  const { calendars, calendarDeleteRequest, cancelDeleteCalendar, confirmDeleteCalendar } = useCalendarStore();

  const calendar = calendarDeleteRequest
    ? calendars.find((cal) => cal.id === calendarDeleteRequest.calendarId)
    : undefined;
  const otherCalendars = calendar ? calendars.filter((cal) => cal.id !== calendar.id) : [];

  const [choice, setChoice] = useState<DeleteChoice>("withEvents");
  const [targetId, setTargetId] = useState<string>("");

  useEffect(() => {
    if (calendarDeleteRequest) {
      setChoice("withEvents");
      setTargetId(otherCalendars[0]?.id ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calendarDeleteRequest]);

  if (!calendarDeleteRequest || !calendar) return null;

  function handleConfirm() {
    if (choice === "moveEvents") {
      if (!targetId) return;
      confirmDeleteCalendar("moveEvents", targetId);
    } else {
      confirmDeleteCalendar("withEvents");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/20" onClick={cancelDeleteCalendar} aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/8 dark:bg-surface">
        <h3 className="text-base font-semibold text-gray-900 dark:text-ink">Удалить календарь «{calendar.name}»?</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-ink-faint">Выберите, что сделать с его событиями.</p>

        <div className="mt-4 space-y-2">
          <label
            className={cn(
              "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm",
              choice === "withEvents" ? "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-surface-2" : "border-gray-200 dark:border-white/8",
            )}
          >
            <input
              type="radio"
              name="delete-calendar-choice"
              checked={choice === "withEvents"}
              onChange={() => setChoice("withEvents")}
              className="mt-0.5 accent-gray-700 dark:accent-gray-400"
            />
            <span>
              <span className="block font-medium text-gray-900 dark:text-ink">Удалить календарь вместе с событиями</span>
              <span className="block text-xs text-gray-500 dark:text-ink-faint">Все его события будут удалены безвозвратно.</span>
            </span>
          </label>

          <label
            className={cn(
              "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm",
              choice === "moveEvents" ? "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-surface-2" : "border-gray-200 dark:border-white/8",
              otherCalendars.length === 0 && "opacity-40",
            )}
          >
            <input
              type="radio"
              name="delete-calendar-choice"
              checked={choice === "moveEvents"}
              onChange={() => setChoice("moveEvents")}
              disabled={otherCalendars.length === 0}
              className="mt-0.5 accent-gray-700 dark:accent-gray-400"
            />
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-gray-900 dark:text-ink">Перенести события в другой календарь</span>
              {choice === "moveEvents" && otherCalendars.length > 0 && (
                <select
                  value={targetId}
                  onChange={(event) => setTargetId(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
                >
                  {otherCalendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      {cal.name}
                    </option>
                  ))}
                </select>
              )}
            </span>
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={cancelDeleteCalendar}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
