"use client";

import { useMemo } from "react";
import { CheckSquare, Repeat, Square } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { AGENDA_WINDOW_DAYS } from "@/lib/calendar-constants";
import { addDays, formatFullDateLabel, fromISODate, isSameDay, toISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export function AgendaView() {
  const { today, anchorDate, entriesByDate, openEntryEditor, selectEntry, toggleEntryComplete } = useCalendarStore();

  const groups = useMemo(() => {
    const startIso = toISODate(anchorDate);
    const endIso = toISODate(addDays(anchorDate, AGENDA_WINDOW_DAYS - 1));

    return Array.from(entriesByDate.entries())
      .filter(([date]) => date >= startIso && date <= endIso)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, entries]) => ({ date, entries }));
  }, [entriesByDate, anchorDate]);

  const tomorrowIso = toISODate(addDays(today, 1));

  if (groups.length === 0) {
    return (
      <p className="flex h-full min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-gray-400 dark:text-ink-faint">
        Нет событий в этот период
      </p>
    );
  }

  return (
    <div className="min-h-0 flex-1 divide-y divide-gray-100 overflow-y-auto dark:divide-white/[0.06]">
      {groups.map(({ date, entries }) => {
        const dayDate = fromISODate(date);
        const isToday = isSameDay(dayDate, today);
        const isTomorrow = date === tomorrowIso;
        const label = isToday ? "Сегодня" : isTomorrow ? "Завтра" : null;
        const fullLabel = formatFullDateLabel(dayDate);

        return (
          <div key={date} className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">
              {label ? `${label}, ${fullLabel.split(", ")[1] ?? fullLabel}` : fullLabel}
            </h3>
            <ul className="mt-2 space-y-1.5">
              {entries.map((entry) => {
                const styles = calendarColorStyles[entry.color];
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => {
                        selectEntry(entry.id);
                        openEntryEditor(entry);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      {entry.kind === "task" ? (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(domEvent) => {
                            domEvent.stopPropagation();
                            toggleEntryComplete(entry);
                          }}
                          className="shrink-0 text-gray-400 dark:text-ink-faint"
                        >
                          {entry.completed ? <CheckSquare size={14} /> : <Square size={14} />}
                        </span>
                      ) : (
                        <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} />
                      )}
                      <span className="w-24 shrink-0 text-xs text-gray-400 dark:text-ink-faint sm:w-28 sm:text-sm">
                        {entry.allDay ? "Весь день" : `${entry.startTime}${entry.kind === "event" ? `–${entry.endTime}` : ""}`}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-ink">
                        {entry.title}
                        {entry.important && <span className="ml-1.5 text-amber-500">★</span>}
                      </span>
                      {entry.isRecurring && <Repeat size={12} className="ml-auto shrink-0 text-gray-300 dark:text-ink-faint" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
