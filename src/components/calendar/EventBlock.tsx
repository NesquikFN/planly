"use client";

import { useRef, useState } from "react";
import type { CalendarColor, CalendarEvent } from "@/types/calendar";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { HOUR_HEIGHT, DAY_START_HOUR, DAY_END_HOUR, MIN_DURATION_MINUTES } from "@/lib/calendar-constants";
import { clamp, minutesToOffsetPx, minutesToTime, snapMinutes, timeToMinutes } from "@/lib/calendar-time";
import { cn } from "@/lib/utils";

interface DragPreview {
  date: string;
  startMinutes: number;
  endMinutes: number;
}

interface DragInfo {
  mode: "move" | "resize";
  startClientX: number;
  startClientY: number;
  originalStart: number;
  originalEnd: number;
  hasMoved: boolean;
}

interface EventBlockProps {
  event: CalendarEvent;
  color: CalendarColor;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onCommit: (id: string, changes: { date: string; startTime: string; endTime: string }) => void;
  resolveColumnDate: (clientX: number) => string;
}

export function EventBlock({
  event,
  color,
  isSelected,
  onSelect,
  onEdit,
  onCommit,
  resolveColumnDate,
}: EventBlockProps) {
  const styles = calendarColorStyles[color];
  const dragInfo = useRef<DragInfo | null>(null);
  const [preview, setPreview] = useState<DragPreview | null>(null);

  const baseStart = timeToMinutes(event.startTime);
  const baseEnd = timeToMinutes(event.endTime);

  const displayStart = preview ? preview.startMinutes : baseStart;
  const displayEnd = preview ? preview.endMinutes : baseEnd;
  const topPx = minutesToOffsetPx(displayStart);
  const heightPx = Math.max(minutesToOffsetPx(displayEnd) - topPx, 22);

  function handleMoveStart(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    if (pointerEvent.button !== 0 && pointerEvent.pointerType === "mouse") return;
    pointerEvent.stopPropagation();
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    dragInfo.current = {
      mode: "move",
      startClientX: pointerEvent.clientX,
      startClientY: pointerEvent.clientY,
      originalStart: baseStart,
      originalEnd: baseEnd,
      hasMoved: false,
    };
  }

  function handleResizeStart(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    if (pointerEvent.button !== 0 && pointerEvent.pointerType === "mouse") return;
    pointerEvent.stopPropagation();
    pointerEvent.currentTarget.setPointerCapture(pointerEvent.pointerId);
    dragInfo.current = {
      mode: "resize",
      startClientX: pointerEvent.clientX,
      startClientY: pointerEvent.clientY,
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
      setPreview({ date, startMinutes: newStart, endMinutes: newStart + duration });
    } else {
      const newEnd = clamp(
        info.originalEnd + deltaMinutes,
        info.originalStart + MIN_DURATION_MINUTES,
        DAY_END_HOUR * 60,
      );
      setPreview({ date: event.date, startMinutes: info.originalStart, endMinutes: newEnd });
    }
  }

  function handlePointerUp(pointerEvent: React.PointerEvent<HTMLDivElement>) {
    const info = dragInfo.current;
    if (!info) return;
    pointerEvent.stopPropagation();

    if (!info.hasMoved) {
      onSelect(event.id);
    } else if (preview) {
      onCommit(event.id, {
        date: preview.date,
        startTime: minutesToTime(preview.startMinutes),
        endTime: minutesToTime(preview.endMinutes),
      });
    }

    dragInfo.current = null;
    setPreview(null);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(domEvent) => domEvent.stopPropagation()}
      onPointerDown={handleMoveStart}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={(domEvent) => {
        domEvent.stopPropagation();
        onEdit(event.id);
      }}
      className={cn(
        "group absolute inset-x-1 cursor-grab select-none overflow-hidden rounded-lg border px-2 py-1 text-left text-xs shadow-sm transition-shadow active:cursor-grabbing",
        styles.block,
        styles.border,
        styles.text,
        isSelected && `ring-2 ring-offset-1 ${styles.ring}`,
      )}
      style={{ top: topPx, height: heightPx }}
    >
      <p className="flex items-center gap-1.5 truncate font-medium">
        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
        <span className="truncate">{event.title}</span>
        {event.important && <span className="shrink-0 text-amber-500">★</span>}
      </p>
      {heightPx > 32 && (
        <p className="truncate text-[11px] opacity-80">
          {minutesToTime(displayStart)} – {minutesToTime(displayEnd)}
        </p>
      )}

      <div
        onPointerDown={handleResizeStart}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize opacity-0 group-hover:opacity-100"
      />
    </div>
  );
}
