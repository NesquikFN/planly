"use client";

import { FileSearch } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { NoteListCard } from "@/components/notes/NoteListCard";
import { NOTE_FOLDERS } from "@/lib/notes-mock-data";
import type { Note, NoteFolderKey } from "@/types/note";
import type { NotesViewMode } from "@/components/notes/NotesToolbar";

interface NotesListPanelProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onToggleStar: (id: string) => void;
  activeFolder: NoteFolderKey;
  onFolderChange: (folder: NoteFolderKey) => void;
  viewMode: NotesViewMode;
}

export function NotesListPanel({
  notes,
  activeNoteId,
  onSelectNote,
  onToggleStar,
  activeFolder,
  onFolderChange,
  viewMode,
}: NotesListPanelProps) {
  const activeFolderDef = NOTE_FOLDERS.find((folder) => folder.key === activeFolder) ?? NOTE_FOLDERS[0];

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 p-4 dark:border-gray-800">
        <DropdownMenu
          trigger={
            <>
              {activeFolderDef.label}
              <span className="text-gray-400 dark:text-gray-500">▾</span>
            </>
          }
          triggerClassName="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-gray-50"
          align="left"
          items={NOTE_FOLDERS.map((folder) => ({
            key: folder.key,
            label: folder.label,
            active: activeFolder === folder.key,
            onSelect: () => onFolderChange(folder.key),
          }))}
        />
        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
          {activeFolderDef.count ?? notes.length} заметок
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <FileSearch size={24} className="text-gray-300 dark:text-gray-600" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ничего не найдено</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Попробуйте изменить запрос или фильтр</p>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-2"}>
            {notes.map((note) => (
              <NoteListCard
                key={note.id}
                note={note}
                active={note.id === activeNoteId}
                variant={viewMode}
                onSelect={() => onSelectNote(note.id)}
                onToggleStar={() => onToggleStar(note.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
