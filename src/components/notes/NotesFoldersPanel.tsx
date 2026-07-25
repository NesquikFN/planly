"use client";

import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { NOTE_FOLDERS, NOTE_TAGS } from "@/lib/notes-mock-data";
import type { NoteFolderKey } from "@/types/note";

interface NotesFoldersPanelProps {
  activeFolder: NoteFolderKey;
  onFolderChange: (folder: NoteFolderKey) => void;
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  onMoreTags: () => void;
}

export function NotesFoldersPanel({
  activeFolder,
  onFolderChange,
  activeTag,
  onTagChange,
  onMoreTags,
}: NotesFoldersPanelProps) {
  return (
    <div className="mt-6 space-y-6 border-t border-gray-100 pt-4 dark:border-gray-800">
      <div>
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Заметки
        </p>
        <div className="mt-2 space-y-1">
          {NOTE_FOLDERS.map((folder) => {
            const Icon = folder.icon;
            const isActive = activeFolder === folder.key;
            return (
              <button
                key={folder.key}
                type="button"
                onClick={() => onFolderChange(folder.key)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                <Icon size={16} />
                <span className="flex-1 truncate">{folder.label}</span>
                {typeof folder.count === "number" && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{folder.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between px-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">Теги</p>
          <button
            type="button"
            onClick={onMoreTags}
            aria-label="Добавить тег"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="mt-2 space-y-1">
          {NOTE_TAGS.map((tag) => {
            const isActive = activeTag === tag.label;
            return (
              <button
                key={tag.label}
                type="button"
                onClick={() => onTagChange(isActive ? null : tag.label)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800",
                )}
              >
                <span className={cn("h-2 w-2 shrink-0 rounded-full", calendarColorStyles[tag.color].dot)} />
                <span className="flex-1 truncate">{tag.label}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{tag.count}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onMoreTags}
          className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-gray-400 hover:bg-gray-50 dark:text-gray-500 dark:hover:bg-gray-800"
        >
          <span className="flex-1">Ещё тегов</span>
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  );
}
