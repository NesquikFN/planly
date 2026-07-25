"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { EventBlock } from "@/components/calendar/EventBlock";
import type { CalendarEntry } from "@/lib/calendar-entries";
import { DAY_START_HOUR, DAY_END_HOUR, HOUR_HEIGHT } from "@/lib/calendar-constants";
import { formatHourLabel, minutesToOffsetPx, pxToMinutes, snapMinutes, minutesToTime, clamp } from "@/lib/calendar-time";
import { formatWeekdayShort, isSameDay, toISODate } from "@/lib/date-utils";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { cn } from "@/lib/utils";
import { CheckSquare, Square } from "lucide-react";

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
    entriesByDate,
    selectedEntryId,
    selectEntry,
    openEntryEditor,
    toggleEntryComplete,
    rescheduleEntry,
    openCreateModal,
  } = useCalendarStore();

  const columnRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [hoveredDropDate, setHoveredDropDate] = useState<string | null>(null);
  const gridTemplate = `64px repeat(${days.length}, minmax(0, 1fr))`;

  const entriesByDay = useMemo(() => {
    return days.map((day) => {
      const iso = toISODate(day);
      const dayEntries = entriesByDate.get(iso) ?? [];
      return {
        allDay: dayEntries.filter((entry) => entry.allDay),
        timed: dayEntries.filter((entry) => !entry.allDay),
      };
    });
  }, [days, entriesByDate]);

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
    (entry: CalendarEntry, changes: { date: string; startTime: string; endTime: string }) => {
      rescheduleEntry(entry, changes);
    },
    [rescheduleEntry],
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
        {days.map((day, dayIndex) => (
          <div key={day.toISOString()} className="flex flex-col gap-1 border-l border-gray-50 p-1">
            {entriesByDay[dayIndex].allDay.map((entry) => {
              const styles = calendarColorStyles[entry.color];
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    selectEntry(entry.id);
                    if (entry.kind === "event") openEntryEditor(entry);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium",
                    styles.block,
                    styles.text,
                    selectedEntryId === entry.id && `ring-1 ${styles.ring}`,
                  )}
                >
                  {entry.kind === "task" ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEntryComplete(entry);
                      }}
                      className="shrink-0"
                    >
                      {entry.completed ? <CheckSquare size={11} /> : <Square size={11} />}
                    </span>
                  ) : (
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
                  )}
                  <span className="truncate">{entry.title}</span>
                </button>
              );
            })}
          </div>
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
            const iso = toISODate(day);
            const isDropTarget = hoveredDropDate === iso;
            return (
              <div
                key={day.toISOString()}
                ref={(el) => {
                  columnRefs.current[dayIndex] = el;
                }}
                onDoubleClick={(domEvent) => handleColumnDoubleClick(dayIndex, domEvent)}
                onClick={() => selectEntry(null)}
                className={cn(
                  "relative border-l border-gray-50 transition-colors duration-100",
                  isDropTarget && "bg-gray-100",
                )}
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

                {entriesByDay[dayIndex].timed.map((entry) => (
                  <EventBlock
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedEntryId === entry.id}
                    onSelect={selectEntry}
                    onEdit={openEntryEditor}
                    onToggleComplete={toggleEntryComplete}
                    onCommit={handleCommit}
                    resolveColumnDate={resolveColumnDate}
                    onDragHoverChange={setHoveredDropDate}
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
