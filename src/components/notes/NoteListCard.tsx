"use client";

import { Star } from "lucide-react";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { tagColor } from "@/lib/notes-mock-data";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";

interface NoteListCardProps {
  note: Note;
  active: boolean;
  variant: "list" | "grid";
  onSelect: () => void;
  onToggleStar: () => void;
}

export function NoteListCard({ note, active, variant, onSelect, onToggleStar }: NoteListCardProps) {
  const Icon = note.icon;
  const styles = calendarColorStyles[note.color];
  const primaryTag = note.tags[0];

  const thumbnail = note.thumbnail && (
    <div
      className={cn(
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-lg",
        calendarColorStyles[note.thumbnail.tone].block,
      )}
    >
      <note.thumbnail.icon size={20} className={calendarColorStyles[note.thumbnail.tone].text} />
    </div>
  );

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "w-full rounded-2xl border p-4 text-left shadow-sm transition-colors",
        active
          ? "border-blue-300 bg-blue-50/60 dark:border-blue-500/60 dark:bg-blue-500/10"
          : "border-gray-100 bg-white hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60",
        variant === "grid" ? "flex flex-col gap-3" : "flex items-start gap-3",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.block)}>
        <Icon size={16} className={styles.text} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{note.title}</h3>
          <span
            role="button"
            tabIndex={0}
            onClick={(event) => {
              event.stopPropagation();
              onToggleStar();
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                event.stopPropagation();
                onToggleStar();
              }
            }}
            aria-pressed={note.starred}
            aria-label={note.starred ? "Убрать из избранного" : "Добавить в избранное"}
            className="shrink-0 rounded-lg p-0.5 text-gray-300 hover:bg-gray-100 dark:text-gray-600 dark:hover:bg-gray-800"
          >
            <Star size={15} className={note.starred ? "fill-amber-400 text-amber-400" : undefined} />
          </span>
        </div>

        <p className="mt-0.5 line-clamp-2 text-xs text-gray-400 dark:text-gray-500">{note.description}</p>

        <div className="mt-2 flex items-center gap-2">
          {primaryTag && (
            <span className={cn("text-xs font-medium", calendarColorStyles[tagColor(primaryTag)].text)}>
              #{primaryTag}
            </span>
          )}
          <span className="truncate text-xs text-gray-400 dark:text-gray-500">{note.dateLabel}</span>
        </div>
      </div>

      {variant === "list" && thumbnail}
    </button>
  );
}
