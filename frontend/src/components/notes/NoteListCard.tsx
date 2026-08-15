"use client";

import { memo } from "react";
import { Pin, Star } from "lucide-react";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { NOTE_ICON_MAP } from "@/lib/notes";
import { cn } from "@/lib/utils";
import type { CalendarColor } from "@/types/calendar";
import type { Note } from "@/types/note";

interface NoteListCardProps {
  note: Note;
  active: boolean;
  variant: "list" | "grid";
  dateLabel: string;
  excerpt: string;
  primaryTagColor: CalendarColor | null;
  onSelect: () => void;
  onToggleStar: () => void;
  onTogglePin: () => void;
  highlightQuery: string;
}

function HighlightText({ text, query }: { text: string; query: string }) {
  const value = query.trim();
  if (!value) return text;
  const parts = text.split(new RegExp(`(${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === value.toLowerCase() ? (
          <mark key={index} className="rounded bg-amber-100 px-0.5 text-inherit dark:bg-amber-400/20">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

function NoteListCardImpl({
  note,
  active,
  variant,
  dateLabel,
  excerpt,
  primaryTagColor,
  onSelect,
  onToggleStar,
  onTogglePin,
  highlightQuery,
}: NoteListCardProps) {
  const Icon = NOTE_ICON_MAP[note.iconKey];
  const styles = calendarColorStyles[note.color];
  const primaryTag = note.tags[0];
  const firstImage = note.attachments.find((file) => file.mimeType.startsWith("image/"));

  const thumbnail = firstImage && (
    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg">
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable asset */}
      <img src={firstImage.dataUrl} alt="" className="h-full w-full object-cover" />
    </div>
  );

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "notes-item-enter group relative w-full p-3 text-left transition-colors duration-150",
        variant === "grid"
          ? cn(
              "rounded-xl border",
              active
                ? "border-accent/40 bg-accent/5"
                : "border-gray-100 bg-white hover:border-gray-200 dark:border-white/8 dark:bg-surface dark:hover:border-white/10",
            )
          : cn(
              "rounded-lg border-l-2",
              active ? "border-l-accent bg-accent/5" : "border-l-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]",
            ),
        variant === "grid" ? "flex flex-col gap-3" : "flex items-start gap-3",
      )}
    >
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.block)}>
        <Icon size={16} className={styles.text} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="relative flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-gray-900 dark:text-ink">
            {note.pinned && <Pin size={12} className="shrink-0 fill-gray-400 text-gray-400 dark:fill-ink-faint dark:text-ink-faint" />}
            <span className="truncate">
              <HighlightText text={note.title} query={highlightQuery} />
            </span>
          </h3>
          <div className="relative flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onKeyDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onTogglePin();
              }}
              aria-pressed={note.pinned}
              aria-label={note.pinned ? "Открепить" : "Закрепить"}
              className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:text-ink-faint dark:hover:bg-surface-2"
            >
              <Pin size={14} className={note.pinned ? "fill-gray-500 text-gray-500 dark:fill-ink-dim dark:text-ink-faint" : undefined} />
            </button>
            <button
              type="button"
              onKeyDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                onToggleStar();
              }}
              aria-pressed={note.starred}
              aria-label={note.starred ? "Убрать из избранного" : "Добавить в избранное"}
              className="rounded-lg p-1 text-gray-300 transition-colors hover:bg-gray-100 hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:text-ink-faint dark:hover:bg-surface-2"
            >
              <Star size={15} className={note.starred ? "fill-amber-400 text-amber-400" : undefined} />
            </button>
          </div>
        </div>

        <p className="relative mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-ink-faint">
          <HighlightText text={excerpt} query={highlightQuery} />
        </p>

        <div className="mt-2 flex items-center gap-2">
          {primaryTag && primaryTagColor && (
            <span className={cn("text-xs font-medium", calendarColorStyles[primaryTagColor].text)}>#{primaryTag}</span>
          )}
          <span className="truncate text-xs text-gray-400 dark:text-ink-faint">{dateLabel}</span>
        </div>
      </div>

      {variant === "list" && thumbnail}
    </article>
  );
}

export const NoteListCard = memo(NoteListCardImpl);
