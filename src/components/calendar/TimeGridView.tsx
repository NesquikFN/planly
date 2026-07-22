"use client";

import { useCallback, useMemo, useRef } from "react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { EventBlock } from "@/components/calendar/EventBlock";
import { DAY_START_HOUR, DAY_END_HOUR, HOUR_HEIGHT } from "@/lib/calendar-constants";
import { formatHourLabel, minutesToOffsetPx, pxToMinutes, snapMinutes, minutesToTime, clamp } from "@/lib/calendar-time";
import { formatWeekdayShort, isSameDay, toISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, index) => DAY_START_HOUR + index);

interface TimeGridViewProps {
  days: Date[];
  /** Week view shows the weekday header row; Day view keeps just the date. */
  showWeekdayLabel?: boolean;
}

export function TimeGridView({ days, showWeekdayLabel = true }: TimeGridViewProps) {
  const {
    today,
    nowMinutes,
    visibleEvents,
    calendarById,
    selectedEventId,
    selectEvent,
    openEditModal,
    updateEvent,
    openCreateModal,
  } = useCalendarStore();

  const columnRefs = useRef<Array<HTMLDivElement | null>>([]);
  const gridTemplate = `64px repeat(${days.length}, minmax(0, 1fr))`;

  const eventsByDay = useMemo(() => {
    return days.map((day) => {
      const iso = toISODate(day);
      return visibleEvents
        .filter((event) => event.date === iso)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
  }, [days, visibleEvents]);

  const resolveColumnDate = useCallback(
    (clientX: number): string => {
      for (let index = 0; index < columnRefs.current.length; index += 1) {
        const el = columnRefs.current[index];
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (clientX >= rect.left && clientX < rect.right) return toISODate(days[index]);
      }
      const firstRect = columnRefs.current[0]?.getBoundingClientRect();
      const lastRect = columnRefs.current[days.length - 1]?.getBoundingClientRect();
      if (firstRect && clientX < firstRect.left) return toISODate(days[0]);
      if (lastRect && clientX >= lastRect.right) return toISODate(days[days.length - 1]);
      return toISODate(days[0]);
    },
    [days],
  );

  const handleCommit = useCallback(
    (id: string, changes: { date: string; startTime: string; endTime: string }) => {
      updateEvent(id, changes);
    },
    [updateEvent],
  );

  function handleColumnDoubleClick(dayIndex: number, domEvent: React.MouseEvent<HTMLDivElement>) {
    const el = columnRefs.current[dayIndex];
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const offsetY = domEvent.clientY - rect.top;
    const rawMinutes = pxToMinutes(offsetY);
    const startMinutes = clamp(snapMinutes(rawMinutes, 30), DAY_START_HOUR * 60, DAY_END_HOUR * 60 - 30);
    const endMinutes = clamp(startMinutes + 60, startMinutes + 30, DAY_END_HOUR * 60);

    openCreateModal({
      date: toISODate(days[dayIndex]),
      startTime: minutesToTime(startMinutes),
      endTime: minutesToTime(endMinutes),
    });
  }

  const gridHeight = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT;
  const nowOffsetPx = minutesToOffsetPx(nowMinutes);

  return (
    <div className="flex flex-col">
      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: gridTemplate }}>
        <div />
        {days.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1 py-3">
              {showWeekdayLabel && (
                <span className="text-xs font-medium text-gray-400">{formatWeekdayShort(day)}</span>
              )}
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                  isToday ? "bg-blue-600 text-white" : "text-gray-900",
                )}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid border-b border-gray-100" style={{ gridTemplateColumns: gridTemplate }}>
        <div className="flex items-center justify-end px-2 py-2 text-xs text-gray-400">Весь день</div>
        {days.map((day) => (
          <div key={day.toISOString()} className="border-l border-gray-50 py-2" />
        ))}
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        <div className="grid" style={{ gridTemplateColumns: gridTemplate, height: gridHeight }}>
          <div className="relative">
            {HOURS.slice(0, -1).map((hour) => (
              <div
                key={hour}
                className="relative -top-2.5 pr-2 text-right text-xs text-gray-400"
                style={{ height: HOUR_HEIGHT }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {days.map((day, dayIndex) => {
            const isToday = isSameDay(day, today);
            return (
              <div
                key={day.toISOString()}
                ref={(el) => {
                  columnRefs.current[dayIndex] = el;
                }}
                onDoubleClick={(domEvent) => handleColumnDoubleClick(dayIndex, domEvent)}
                onClick={() => selectEvent(null)}
                className="relative border-l border-gray-50"
              >
                {HOURS.slice(0, -1).map((hour) => (
                  <div key={hour} className="border-b border-gray-50" style={{ height: HOUR_HEIGHT }} />
                ))}

                {isToday && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 flex items-center"
                    style={{ top: nowOffsetPx }}
                  >
                    <span className="-ml-1 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <span className="h-px flex-1 bg-red-500" />
                  </div>
                )}

                {eventsByDay[dayIndex].map((event) => (
                  <EventBlock
                    key={event.id}
                    event={event}
                    color={calendarById.get(event.calendarId)?.color ?? "blue"}
                    isSelected={selectedEventId === event.id}
                    onSelect={selectEvent}
                    onEdit={openEditModal}
                    onCommit={handleCommit}
                    resolveColumnDate={resolveColumnDate}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
