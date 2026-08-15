"use client";

import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { NOTE_FOLDERS, nextTagColor } from "@/lib/notes";
import type { CalendarColor } from "@/types/calendar";
import type { NoteFolderKey, NoteTagDef } from "@/types/note";

interface NotesFoldersPanelProps {
  activeFolder: NoteFolderKey;
  onFolderChange: (folder: NoteFolderKey) => void;
  folderCounts: Record<NoteFolderKey, number>;
  activeTag: string | null;
  onTagChange: (tag: string | null) => void;
  tagDefs: NoteTagDef[];
  tagCounts: Record<string, number>;
  onCreateTag: (label: string) => void;
  onRenameTag: (oldLabel: string, newLabel: string) => void;
  onDeleteTag: (label: string) => void;
  onRecolorTag: (label: string, color: CalendarColor) => void;
}

export function NotesFoldersPanel({
  activeFolder,
  onFolderChange,
  folderCounts,
  activeTag,
  onTagChange,
  tagDefs,
  tagCounts,
  onCreateTag,
  onRenameTag,
  onDeleteTag,
  onRecolorTag,
}: NotesFoldersPanelProps) {
  const [creating, setCreating] = useState(false);
  const [draftLabel, setDraftLabel] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");

  function commitCreate() {
    const trimmed = draftLabel.trim();
    if (trimmed) onCreateTag(trimmed);
    setDraftLabel("");
    setCreating(false);
  }

  function commitRename(oldLabel: string) {
    const trimmed = editingLabel.trim();
    if (trimmed && trimmed !== oldLabel) onRenameTag(oldLabel, trimmed);
    setEditingTag(null);
  }

  return (
    <div className="mt-6 space-y-6 border-t border-gray-100 pt-4 dark:border-white/8">
      <div>
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-ink-faint">Заметки</p>
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
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2",
                )}
              >
                <Icon size={16} />
                <span className="flex-1 truncate">{folder.label}</span>
                <span className="text-xs text-gray-400 dark:text-ink-faint">{folderCounts[folder.key] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between px-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-ink-faint">Теги</p>
          <button
            type="button"
            onClick={() => setCreating((value) => !value)}
            aria-label="Добавить тег"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:hover:bg-surface-2"
          >
            <Plus size={14} />
          </button>
        </div>

        <div className="mt-2 space-y-1">
          {tagDefs.map((tag) => {
            const isActive = activeTag === tag.label;
            const isEditing = editingTag === tag.label;

            if (isEditing) {
              return (
                <div key={tag.label} className="flex items-center gap-1.5 px-3 py-1">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", calendarColorStyles[tag.color].dot)} />
                  <input
                    autoFocus
                    value={editingLabel}
                    onChange={(event) => setEditingLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitRename(tag.label);
                      if (event.key === "Escape") setEditingTag(null);
                    }}
                    onBlur={() => commitRename(tag.label)}
                    className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
                  />
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => commitRename(tag.label)} className="text-emerald-500 hover:text-emerald-600">
                    <Check size={14} />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={tag.label}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-accent/10 text-accent" : "text-gray-500 hover:bg-gray-50 dark:text-ink-faint dark:hover:bg-surface-2",
                )}
              >
                <button
                  type="button"
                  title="Сменить цвет"
                  onClick={() => onRecolorTag(tag.label, nextTagColor(tagDefs.findIndex((t) => t.label === tag.label) + 1))}
                  className={cn("h-2 w-2 shrink-0 rounded-full", calendarColorStyles[tag.color].dot)}
                />
                <button type="button" onClick={() => onTagChange(isActive ? null : tag.label)} className="min-w-0 flex-1 truncate text-left">
                  {tag.label}
                </button>
                <span className="text-xs text-gray-400 dark:text-ink-faint group-hover:hidden">{tagCounts[tag.label] ?? 0}</span>
                <span className="hidden items-center gap-0.5 group-hover:flex">
                  <button
                    type="button"
                    aria-label="Переименовать тег"
                    onClick={() => {
                      setEditingTag(tag.label);
                      setEditingLabel(tag.label);
                    }}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-surface-2"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    type="button"
                    aria-label="Удалить тег"
                    onClick={() => {
                      if (window.confirm(`Удалить тег «${tag.label}»? Он будет снят со всех заметок.`)) onDeleteTag(tag.label);
                    }}
                    className="rounded p-0.5 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              </div>
            );
          })}
        </div>

        {creating ? (
          <div className="mt-1 flex items-center gap-1.5 px-3 py-1">
            <input
              autoFocus
              value={draftLabel}
              onChange={(event) => setDraftLabel(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") commitCreate();
                if (event.key === "Escape") setCreating(false);
              }}
              onBlur={commitCreate}
              placeholder="Название тега"
              className="min-w-0 flex-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
            />
            <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => setCreating(false)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-gray-400 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 dark:text-ink-faint dark:hover:bg-surface-2"
          >
            <Plus size={14} />
            <span className="flex-1">Новый тег</span>
          </button>
        )}
      </div>
    </div>
  );
}
