"use client";

import { useMemo } from "react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { AGENDA_WINDOW_DAYS } from "@/lib/calendar-constants";
import { addDays, formatFullDateLabel, isSameDay, toISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

export function AgendaView() {
  const { today, anchorDate, visibleEvents, calendarById, openEditModal, selectEvent } = useCalendarStore();

  const groups = useMemo(() => {
    const startIso = toISODate(anchorDate);
    const endIso = toISODate(addDays(anchorDate, AGENDA_WINDOW_DAYS - 1));

    const inWindow = visibleEvents
      .filter((event) => event.date >= startIso && event.date <= endIso)
      .sort((a, b) => (a.date === b.date ? a.startTime.localeCompare(b.startTime) : a.date.localeCompare(b.date)));

    const byDate = new Map<string, typeof visibleEvents>();
    for (const event of inWindow) {
      const list = byDate.get(event.date);
      if (list) list.push(event);
      else byDate.set(event.date, [event]);
    }

    return Array.from(byDate.entries()).map(([date, dayEvents]) => ({ date, events: dayEvents }));
  }, [visibleEvents, anchorDate]);

  const tomorrowIso = toISODate(addDays(today, 1));

  if (groups.length === 0) {
    return <p className="p-6 text-center text-sm text-gray-400">Нет событий в этот период</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {groups.map(({ date, events }) => {
        const dayDate = new Date(`${date}T00:00:00`);
        const isToday = isSameDay(dayDate, today);
        const isTomorrow = date === tomorrowIso;
        const label = isToday ? "Сегодня" : isTomorrow ? "Завтра" : null;
        const fullLabel = formatFullDateLabel(dayDate);

        return (
          <div key={date} className="p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-gray-900">
              {label ? `${label}, ${fullLabel.split(", ")[1] ?? fullLabel}` : fullLabel}
            </h3>
            <ul className="mt-2 space-y-1.5">
              {events.map((event) => {
                const styles = calendarColorStyles[calendarById.get(event.calendarId)?.color ?? "blue"];
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => {
                        selectEvent(event.id);
                        openEditModal(event.id);
                      }}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-gray-50"
                    >
                      <span className={cn("h-2 w-2 shrink-0 rounded-full", styles.dot)} />
                      <span className="w-24 shrink-0 text-xs text-gray-400 sm:w-28 sm:text-sm">
                        {event.startTime}–{event.endTime}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                        {event.title}
                        {event.important && <span className="ml-1.5 text-amber-500">★</span>}
                      </span>
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
