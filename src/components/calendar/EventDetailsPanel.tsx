"use client";

import { Calendar as CalendarIcon, ChevronDown, Clock, Folder, Pencil, Trash2, X } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { fromISODate, formatFullDateLabel } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export function EventDetailsPanel() {
  const { events, calendarById, selectedEventId, selectEvent, openEditModal, deleteEvent } = useCalendarStore();
  const event = events.find((item) => item.id === selectedEventId);

  if (!event) return null;

  const calendar = calendarById.get(event.calendarId);
  const styles = calendarColorStyles[calendar?.color ?? "blue"];
  const dateLabel = formatFullDateLabel(fromISODate(event.date));

  return (
    <div className="border-t border-gray-100 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} />
            <h3 className="truncate text-base font-semibold text-gray-900">{event.title}</h3>
            {event.important && <span className="text-amber-500">★</span>}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon size={14} />
              {dateLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              {event.startTime} – {event.endTime}
            </span>
            {calendar && (
              <span className="inline-flex items-center gap-1.5">
                <Folder size={14} />
                {calendar.name}
                {event.project ? ` · ${event.project}` : ""}
              </span>
            )}
          </div>

          {event.description && (
            <p className="mt-2 max-w-xl text-sm text-gray-500">{event.description}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(event.id)}
            aria-label="Редактировать"
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={() => deleteEvent(event.id)}
            aria-label="Удалить"
            className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => openEditModal(event.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Изменить
            <ChevronDown size={14} className="opacity-80" />
          </button>
          <button
            type="button"
            onClick={() => selectEvent(null)}
            aria-label="Закрыть"
            className="rounded-lg p-2 text-gray-300 hover:bg-gray-50 hover:text-gray-500"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
