"use client";

import { useMemo } from "react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { isSameDay, toISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MAX_VISIBLE_PER_DAY = 3;

export function MonthView() {
  const { today, monthStart, monthGrid, visibleEvents, calendarById, goToDayView, openEditModal, selectEvent } =
    useCalendarStore();

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof visibleEvents>();
    for (const event of visibleEvents) {
      const list = map.get(event.date);
      if (list) list.push(event);
      else map.set(event.date, [event]);
    }
    for (const list of map.values()) list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return map;
  }, [visibleEvents]);

  const currentMonth = monthStart.getMonth();

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 border-b border-gray-100">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2 text-center text-xs font-medium text-gray-400">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {monthGrid.map((day) => {
          const iso = toISODate(day);
          const isToday = isSameDay(day, today);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const dayEvents = eventsByDate.get(iso) ?? [];
          const visible = dayEvents.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = dayEvents.length - visible.length;

          return (
            <button
              key={iso}
              type="button"
              onClick={() => goToDayView(day)}
              className={cn(
                "flex min-h-[104px] flex-col items-stretch gap-1 border-b border-l border-gray-50 p-1.5 text-left transition-colors hover:bg-gray-50 first:border-l-0 [&:nth-child(7n+1)]:border-l-0",
                !isCurrentMonth && "bg-gray-50/40",
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  isToday ? "bg-blue-600 text-white" : isCurrentMonth ? "text-gray-900" : "text-gray-300",
                )}
              >
                {day.getDate()}
              </span>

              <div className="flex flex-col gap-1">
                {visible.map((event) => {
                  const styles = calendarColorStyles[calendarById.get(event.calendarId)?.color ?? "blue"];
                  return (
                    <span
                      key={event.id}
                      role="button"
                      tabIndex={0}
                      onClick={(domEvent) => {
                        domEvent.stopPropagation();
                        selectEvent(event.id);
                        openEditModal(event.id);
                      }}
                      className={cn(
                        "truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium",
                        styles.block,
                        styles.text,
                      )}
                    >
                      {event.startTime} {event.title}
                    </span>
                  );
                })}
                {overflow > 0 && <span className="px-1.5 text-[11px] font-medium text-gray-400">Ещё {overflow}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
