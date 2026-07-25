"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckSquare, Square } from "lucide-react";
import type { CalendarEntry } from "@/lib/calendar-entries";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { HOUR_HEIGHT, DAY_START_HOUR, DAY_END_HOUR, MIN_DURATION_MINUTES } from "@/lib/calendar-constants";
import { clamp, minutesToOffsetPx, minutesToTime, snapMinutes, timeToMinutes } from "@/lib/calendar-time";
import { cn } from "@/lib/utils";

interface DragPreview {
  mode: "move" | "resize";
  date: string;
  startMinutes: number;
  endMinutes: number;
  clientX: number;
  clientY: number;
  grabOffsetX: number;
  grabOffsetY: number;
  width: number;
  height: number;
}

interface DragInfo {
  mode: "move" | "resize";
  startClientX: number;
  startClientY: number;
  grabOffsetX: number;
  grabOffsetY: number;
  width: number;
  height: number;
  originalStart: number;
  originalEnd: number;
  hasMoved: boolean;
}

interface EventBlockProps {
  entry: CalendarEntry;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (entry: CalendarEntry) => void;
  onToggleComplete: (entry: CalendarEntry) => void;
  onCommit: (entry: CalendarEntry, changes: { date: string; startTime: string; endTime: string }) => void;
  resolveColumnDate: (clientX: number) => string;
  onDragHoverChange?: (date: string | null) => void;
}

export function EventBlock({
  entry,
  isSelected,
  onSelect,
  onEdit,
  onToggleComplete,
  onCommit,
  resolveColumnDate,
  onDragHoverChange,
}: EventBlockProps) {
  const styles = calendarColorStyles[entry.color];
  const dragInfo = useRef<DragInfo | null>(null);
  const [preview, setPreview] = useState<DragPreview | null>(null);

  const baseStart = entry.startTime ? timeToMinutes(entry.startTime) : DAY_START_HOUR * 60;
  const baseEnd = entry.endTime ? timeToMinutes(entry.endTime) : baseStart + MIN_DURATION_MINUTES;

  const isDragging = preview !== null;
  const displayStart = isDragging ? preview.startMinutes : baseStart;
  const displayEnd = isDragging ? preview.endMinutes : baseEnd;
  const topPx = minutesToOffsetPx(displayStart);
  const heightPx = Math.max(minutesToOffsetPx(displayEnd) - topPx, 22);

  function handleMoveStart(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    if (pointerEvent.button !== 0 && pointerEvent.pointerType === "mouse") return;
    pointerEvent.stopPropagation();
    const rect = pointerEvent.currentTarget.getBoundingClientRect();
    try {
      pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    } catch {
      // Some pointer sessions (e.g. programmatic events) can't be captured — ignore, drag still tracks via move/up.
    }
    dragInfo.current = {
      mode: "move",
      startClientX: pointerEvent.clientX,
      startClientY: pointerEvent.clientY,
      grabOffsetX: pointerEvent.clientX - rect.left,
      grabOffsetY: pointerEvent.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      originalStart: baseStart,
      originalEnd: baseEnd,
      hasMoved: false,
    };
  }

  function handleResizeStart(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    if (pointerEvent.button !== 0 && pointerEvent.pointerType === "mouse") return;
    pointerEvent.stopPropagation();
    try {
      pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    } catch {
      // Some pointer sessions (e.g. programmatic events) can't be captured — ignore, drag still tracks via move/up.
    }
    dragInfo.current = {
      mode: "resize",
      startClientX: pointerEvent.clientX,
      startClientY: pointerEvent.clientY,
      grabOffsetX: 0,
      grabOffsetY: 0,
      width: 0,
      height: 0,
      originalStart: baseStart,
      originalEnd: baseEnd,
      hasMoved: false,
    };
  }

  function handlePointerMove(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    const info = dragInfo.current;
    if (!info) return;

    const deltaY = pointerEvent.clientY - info.startClientY;
    const deltaX = pointerEvent.clientX - info.startClientX;
    if (!info.hasMoved && Math.hypot(deltaX, deltaY) < 4) return;
    info.hasMoved = true;

    const deltaMinutes = snapMinutes((deltaY / HOUR_HEIGHT) * 60);
    const duration = info.originalEnd - info.originalStart;

    if (info.mode === "move") {
      const newStart = clamp(
        info.originalStart + deltaMinutes,
        DAY_START_HOUR * 60,
        DAY_END_HOUR * 60 - duration,
      );
      const date = resolveColumnDate(pointerEvent.clientX);
      onDragHoverChange?.(date);
      setPreview({
        mode: "move",
        date,
        startMinutes: newStart,
        endMinutes: newStart + duration,
        clientX: pointerEvent.clientX,
        clientY: pointerEvent.clientY,
        grabOffsetX: info.grabOffsetX,
        grabOffsetY: info.grabOffsetY,
        width: info.width,
        height: info.height,
      });
    } else {
      const newEnd = clamp(
        info.originalEnd + deltaMinutes,
        info.originalStart + MIN_DURATION_MINUTES,
        DAY_END_HOUR * 60,
      );
      setPreview({
        mode: "resize",
        date: entry.date,
        startMinutes: info.originalStart,
        endMinutes: newEnd,
        clientX: pointerEvent.clientX,
        clientY: pointerEvent.clientY,
        grabOffsetX: 0,
        grabOffsetY: 0,
        width: 0,
        height: 0,
      });
    }
  }

  function handlePointerUp(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    const info = dragInfo.current;
    if (!info) return;
    pointerEvent.stopPropagation();
    onDragHoverChange?.(null);

    if (!info.hasMoved) {
      onSelect(entry.id);
    } else if (preview) {
      onCommit(entry, {
        date: preview.date,
        startTime: minutesToTime(preview.startMinutes),
        endTime: minutesToTime(preview.endMinutes),
      });
    }

    dragInfo.current = null;
    setPreview(null);
  }

  const showGhost = isDragging && preview.mode === "move" && typeof document !== "undefined";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={(domEvent) => domEvent.stopPropagation()}
        onPointerDown={handleMoveStart}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={(domEvent) => {
          domEvent.stopPropagation();
          onEdit(entry);
        }}
        className={cn(
          "group absolute inset-x-1 cursor-grab select-none overflow-hidden rounded-lg border px-2 py-1 text-left text-xs shadow-sm active:cursor-grabbing",
          !isDragging && "transition-[top,height,box-shadow,transform] duration-150 ease-out",
          styles.block,
          styles.border,
          styles.text,
          isSelected && `ring-2 ring-offset-1 ${styles.ring}`,
          isDragging ? "z-20 scale-[1.02] opacity-40 shadow-lg" : "shadow-sm",
        )}
        style={{ top: topPx, height: heightPx, touchAction: "none" }}
      >
        <p className="flex items-center gap-1.5 truncate font-medium">
          {entry.kind === "task" ? (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleComplete(entry);
              }}
              aria-label="Отметить задачу выполненной"
              className="shrink-0 text-current opacity-80 hover:opacity-100"
            >
              {entry.completed ? <CheckSquare size={12} /> : <Square size={12} />}
            </button>
          ) : (
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
          )}
          <span className="truncate">{entry.title}</span>
          {entry.important && <span className="shrink-0 text-amber-500">★</span>}
        </p>
        {heightPx > 32 && (
          <p className="truncate text-[11px] opacity-80">
            {minutesToTime(displayStart)} – {minutesToTime(displayEnd)}
          </p>
        )}

        {entry.kind === "event" && (
          <div
            onPointerDown={handleResizeStart}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100"
            style={{ touchAction: "none" }}
          />
        )}
      </div>

      {showGhost &&
        createPortal(
          <div
            className={cn(
              "pointer-events-none fixed z-50 overflow-hidden rounded-lg border px-2 py-1 text-left text-xs shadow-lg",
              styles.block,
              styles.border,
              styles.text,
            )}
            style={{
              left: preview.clientX - preview.grabOffsetX,
              top: preview.clientY - preview.grabOffsetY,
              width: preview.width,
              height: preview.height,
              transform: "scale(1.03)",
            }}
          >
            <p className="flex items-center gap-1.5 truncate font-medium">
              {entry.kind === "task" ? (
                entry.completed ? (
                  <CheckSquare size={12} />
                ) : (
                  <Square size={12} />
                )
              ) : (
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
              )}
              <span className="truncate">{entry.title}</span>
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
