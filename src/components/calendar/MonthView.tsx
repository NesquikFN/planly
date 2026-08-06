"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckSquare, Repeat, Square, X } from "lucide-react";
import { useCalendarStore } from "@/hooks/useCalendarStore";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { formatFullDateLabel, fromISODate, isSameDay, toISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { CalendarEntry } from "@/lib/calendar-entries";

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MAX_VISIBLE_PER_DAY = 3;

interface DragState {
  entry: CalendarEntry;
  clientX: number;
  clientY: number;
  hoverDate: string | null;
}

export function MonthView() {
  const {
    today,
    anchorDate,
    monthStart,
    monthGrid,
    entriesByDate,
    goToDate,
    openEntryEditor,
    selectEntry,
    rescheduleEntry,
  } = useCalendarStore();

  const [overflowDay, setOverflowDay] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragStart = useRef<{ x: number; y: number; entry: CalendarEntry } | null>(null);
  const hasMoved = useRef(false);

  const currentMonth = monthStart.getMonth();

  function handlePillPointerDown(entry: CalendarEntry, pointerEvent: React.PointerEvent<HTMLElement>) {
    if (pointerEvent.button !== 0 && pointerEvent.pointerType === "mouse") return;
    pointerEvent.stopPropagation();
    try {
      (pointerEvent.target as Element).setPointerCapture(pointerEvent.pointerId);
    } catch {
      // Some pointer sessions (e.g. programmatic events) can't be captured — ignore, drag still tracks via move/up.
    }
    dragStart.current = { x: pointerEvent.clientX, y: pointerEvent.clientY, entry };
    hasMoved.current = false;
  }

  function handlePillPointerMove(pointerEvent: React.PointerEvent<HTMLElement>) {
    const start = dragStart.current;
    if (!start) return;
    const dx = pointerEvent.clientX - start.x;
    const dy = pointerEvent.clientY - start.y;
    if (!hasMoved.current && Math.hypot(dx, dy) < 4) return;
    hasMoved.current = true;

    const targetEl = document
      .elementFromPoint(pointerEvent.clientX, pointerEvent.clientY)
      ?.closest<HTMLElement>("[data-month-date]");
    const hoverDate = targetEl?.dataset.monthDate ?? null;

    setDrag({ entry: start.entry, clientX: pointerEvent.clientX, clientY: pointerEvent.clientY, hoverDate });
  }

  function handlePillPointerUp(pointerEvent: React.PointerEvent<HTMLElement>) {
    const start = dragStart.current;
    if (!start) return;
    pointerEvent.stopPropagation();

    if (!hasMoved.current) {
      selectEntry(start.entry.id);
      openEntryEditor(start.entry);
    } else if (drag?.hoverDate && drag.hoverDate !== start.entry.date) {
      rescheduleEntry(start.entry, {
        date: drag.hoverDate,
        startTime: start.entry.startTime,
        endTime: start.entry.endTime,
      });
    }

    dragStart.current = null;
    hasMoved.current = false;
    setDrag(null);
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="grid shrink-0 grid-cols-7 border-b border-gray-100 dark:border-white/[0.06]">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2 text-center text-xs font-medium text-gray-400 dark:text-ink-faint">
            {label}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 overflow-y-auto">
        {monthGrid.map((day) => {
          const iso = toISODate(day);
          const isToday = isSameDay(day, today);
          const isSelected = isSameDay(day, anchorDate);
          const isCurrentMonth = day.getMonth() === currentMonth;
          const dayEntries = entriesByDate.get(iso) ?? [];
          const visible = dayEntries.slice(0, MAX_VISIBLE_PER_DAY);
          const overflow = dayEntries.length - visible.length;
          const isDropTarget = drag?.hoverDate === iso;

          return (
            <div
              key={iso}
              data-month-date={iso}
              role="button"
              tabIndex={0}
              onClick={() => goToDate(day)}
              className={cn(
                "flex min-h-[104px] cursor-pointer flex-col items-stretch gap-1 border-b border-l border-gray-50 p-1.5 text-left transition-colors hover:bg-gray-50 first:border-l-0 [&:nth-child(7n+1)]:border-l-0 dark:border-white/[0.06] dark:hover:bg-white/[0.03]",
                !isCurrentMonth && "bg-gray-50/40 dark:bg-transparent dark:opacity-50",
                isDropTarget && "bg-gray-100 dark:bg-surface-2",
                isSelected && "dark:bg-accent/5",
              )}
              style={isSelected ? { boxShadow: "inset 0 0 0 1.5px var(--color-accent)" } : undefined}
            >
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  isToday
                    ? "border border-blue-600 text-blue-600 dark:border-accent dark:bg-accent/10 dark:text-accent"
                    : isCurrentMonth
                      ? "text-gray-900 dark:text-ink"
                      : "text-gray-300 dark:text-ink-faint",
                )}
              >
                {day.getDate()}
              </span>

              <div className="flex flex-col gap-1">
                {visible.map((entry) => {
                  const styles = calendarColorStyles[entry.color];
                  const isBeingDragged = drag?.entry.id === entry.id;
                  return (
                    <span
                      key={entry.id}
                      role="button"
                      tabIndex={0}
                      onPointerDown={(pointerEvent) => handlePillPointerDown(entry, pointerEvent)}
                      onPointerMove={handlePillPointerMove}
                      onPointerUp={handlePillPointerUp}
                      onClick={(domEvent) => domEvent.stopPropagation()}
                      className={cn(
                        "flex cursor-grab items-center gap-1 truncate rounded-md px-1.5 py-0.5 text-left text-[11px] font-medium transition-opacity active:cursor-grabbing",
                        "bg-gray-50 text-gray-700 dark:bg-surface-2 dark:text-ink-dim",
                        isBeingDragged && "opacity-40",
                      )}
                      style={{ touchAction: "none" }}
                    >
                      {entry.kind === "task" ? (
                        entry.completed ? (
                          <CheckSquare size={10} className="shrink-0" />
                        ) : (
                          <Square size={10} className="shrink-0" />
                        )
                      ) : (
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
                      )}
                      {entry.startTime && <span className="shrink-0 tabular-nums">{entry.startTime}</span>}
                      <span className="truncate">{entry.title}</span>
                      {entry.isRecurring && <Repeat size={9} className="ml-auto shrink-0 opacity-60" />}
                    </span>
                  );
                })}
                {overflow > 0 && (
                  <button
                    type="button"
                    onClick={(domEvent) => {
                      domEvent.stopPropagation();
                      setOverflowDay(iso);
                    }}
                    className="rounded px-1.5 text-left text-[11px] font-medium text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-ink-faint dark:hover:bg-surface-2 dark:hover:text-ink-dim"
                  >
                    Ещё {overflow}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {drag &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 flex items-center gap-1 truncate rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-gray-700 shadow-lg dark:bg-surface-2 dark:text-ink-dim"
            style={{ left: drag.clientX + 12, top: drag.clientY + 12, transform: "scale(1.05)" }}
          >
            {drag.entry.title}
          </div>,
          document.body,
        )}

      {overflowDay && <DayOverflowList date={overflowDay} onClose={() => setOverflowDay(null)} />}
    </div>
  );
}

function DayOverflowList({ date, onClose }: { date: string; onClose: () => void }) {
  const { entriesByDate, openEntryEditor, selectEntry, toggleEntryComplete } = useCalendarStore();
  const entries = entriesByDate.get(date) ?? [];
  const label = formatFullDateLabel(fromISODate(date));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" aria-hidden="true" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/8 dark:bg-surface"
        onClick={(domEvent) => domEvent.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-ink">{label}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2"
          >
            <X size={16} />
          </button>
        </div>
        <ul className="mt-3 max-h-80 space-y-1 overflow-y-auto">
          {entries.map((entry) => {
            const styles = calendarColorStyles[entry.color];
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => {
                    selectEntry(entry.id);
                    openEntryEditor(entry);
                    onClose();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-surface-2"
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
                  {entry.startTime && <span className="shrink-0 text-xs text-gray-400 dark:text-ink-faint">{entry.startTime}</span>}
                  <span className="truncate text-gray-900 dark:text-ink">{entry.title}</span>
                  {entry.isRecurring && <Repeat size={11} className="ml-auto shrink-0 text-gray-300 dark:text-ink-faint" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
