"use client";

import { Calendar as CalendarIcon, CheckSquare, ChevronDown, Clock, Folder, Square, Trash2, X } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { fromISODate, formatFullDateLabel } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export function EventDetailsPanel() {
  const {
    events,
    visibleEntries,
    calendarById,
    selectedEntryId,
    selectEntry,
    openEntryEditor,
    deleteEntry,
    toggleEntryComplete,
  } = useCalendarStore();

  const entry = visibleEntries.find((item) => item.id === selectedEntryId);
  if (!entry) return null;

  const styles = calendarColorStyles[entry.color];
  const dateLabel = formatFullDateLabel(fromISODate(entry.date));
  const sourceEvent = entry.kind === "event" ? events.find((event) => event.id === entry.sourceId) : undefined;
  const calendar = sourceEvent ? calendarById.get(sourceEvent.calendarId) : undefined;

  return (
    <div className="border-t border-gray-100 p-4 dark:border-gray-800 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {entry.kind === "task" ? (
              <button
                type="button"
                onClick={() => toggleEntryComplete(entry)}
                aria-label="Отметить задачу выполненной"
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                {entry.completed ? <CheckSquare size={16} /> : <Square size={16} />}
              </button>
            ) : (
              <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} />
            )}
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-gray-50">{entry.title}</h3>
            {entry.important && <span className="text-amber-500">★</span>}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon size={14} />
              {dateLabel}
            </span>
            {entry.startTime && (
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} />
                {entry.startTime}
                {entry.kind === "event" && entry.endTime ? ` – ${entry.endTime}` : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Folder size={14} />
              {entry.kind === "task" ? "Задача" : (calendar?.name ?? "Событие")}
              {sourceEvent?.project ? ` · ${sourceEvent.project}` : ""}
            </span>
          </div>

          {sourceEvent?.description && <p className="mt-2 max-w-xl text-sm text-gray-500 dark:text-gray-400">{sourceEvent.description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => deleteEntry(entry)}
            aria-label="Удалить"
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-500/10 dark:hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => openEntryEditor(entry)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Изменить
            <ChevronDown size={14} className="opacity-80" />
          </button>
          <button
            type="button"
            onClick={() => selectEntry(null)}
            aria-label="Закрыть"
            className="rounded-lg p-2 text-gray-300 hover:bg-gray-50 hover:text-gray-500 dark:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-400"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
