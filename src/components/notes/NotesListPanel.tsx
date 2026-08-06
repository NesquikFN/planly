"use client";

import { FileSearch } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { NoteListCard } from "@/components/notes/NoteListCard";
import { NOTE_FOLDERS, formatNoteDateLabel, noteExcerpt } from "@/lib/notes";
import type { CalendarColor } from "@/types/calendar";
import type { Note, NoteFolderKey } from "@/types/note";
import type { NotesViewMode } from "@/components/notes/NotesToolbar";

const LIST_FOLDERS = NOTE_FOLDERS.filter((folder) => folder.key !== "archived");

interface NotesListPanelProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onToggleStar: (id: string) => void;
  onTogglePin: (id: string) => void;
  activeFolder: NoteFolderKey;
  onFolderChange: (folder: NoteFolderKey) => void;
  viewMode: NotesViewMode;
  searchQuery: string;
  isLoading?: boolean;
  now: Date;
  tagColorFor: (label: string) => CalendarColor;
  onCreate?: () => void;
  isFiltered?: boolean;
}

export function NotesListPanel({
  notes,
  activeNoteId,
  onSelectNote,
  onToggleStar,
  onTogglePin,
  activeFolder,
  onFolderChange,
  viewMode,
  searchQuery,
  isLoading = false,
  now,
  tagColorFor,
  onCreate,
  isFiltered,
}: NotesListPanelProps) {
  const activeFolderDef = LIST_FOLDERS.find((folder) => folder.key === activeFolder) ?? LIST_FOLDERS[0];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:shadow-none dark:border-white/8 dark:bg-surface">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 p-4 dark:border-white/8">
        <DropdownMenu
          trigger={
            <>
              {activeFolderDef.label}
              <span className="text-gray-400 dark:text-ink-faint">▾</span>
            </>
          }
          triggerClassName="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-ink"
          align="left"
          items={LIST_FOLDERS.map((folder) => ({
            key: folder.key,
            label: folder.label,
            active: activeFolder === folder.key,
            onSelect: () => onFolderChange(folder.key),
          }))}
        />
        <span className="shrink-0 text-xs text-gray-400 dark:text-ink-faint">{notes.length} заметок</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3" aria-busy={isLoading}>
        {isLoading ? (
          <div className="space-y-2" aria-label="Загрузка заметок">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/8 dark:bg-surface">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-surface-2" />
                  <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                    <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-surface-2" />
                    <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-surface-2" />
                    <div className="h-2.5 w-2/3 rounded bg-gray-100 dark:bg-surface-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="mx-auto flex max-w-[220px] flex-col items-center justify-center gap-2 py-16 text-center">
            <div className="rounded-2xl bg-gray-100 p-3 text-gray-400 dark:bg-surface-2 dark:text-ink-faint">
              <FileSearch size={22} />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-ink-dim">
              {isFiltered ? "Ничего не найдено" : "Заметок пока нет"}
            </p>
            {isFiltered ? (
              <p className="text-xs leading-relaxed text-gray-500 dark:text-ink-faint">Измените запрос или выберите другую папку.</p>
            ) : (
              <button type="button" onClick={onCreate} disabled={!onCreate} className="mt-2 rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white hover:bg-accent/90 disabled:hidden">
                Создать первую заметку
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"}>
            {notes.map((note) => (
              <NoteListCard
                key={note.id}
                note={note}
                active={note.id === activeNoteId}
                variant={viewMode}
                highlightQuery={searchQuery}
                dateLabel={formatNoteDateLabel(note.updatedAt, now)}
                excerpt={noteExcerpt(note)}
                primaryTagColor={note.tags[0] ? tagColorFor(note.tags[0]) : null}
                onSelect={() => onSelectNote(note.id)}
                onToggleStar={() => onToggleStar(note.id)}
                onTogglePin={() => onTogglePin(note.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
