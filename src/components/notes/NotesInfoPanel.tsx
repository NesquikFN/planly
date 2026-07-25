"use client";

import {
  Calendar,
  Copy,
  Download,
  File,
  Folder,
  ListChecks,
  Paperclip,
  Plus,
  Bell,
} from "lucide-react";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { tagColor } from "@/lib/notes-mock-data";
import { cn } from "@/lib/utils";
import type { Note } from "@/types/note";

interface NotesInfoPanelProps {
  note: Note | null;
  onAddTag: (note: Note) => void;
  onQuickAction: (action: string, note: Note) => void;
}

export function NotesInfoPanel({ note, onAddTag, onQuickAction }: NotesInfoPanelProps) {
  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-center dark:border-gray-800 dark:bg-gray-900">
        <Paperclip size={22} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Нет данных</p>
      </div>
    );
  }

  const remainingAttachments = Math.max(0, (note.attachmentCount ?? 0) - (note.attachments?.length ?? 0));

  const quickActions = [
    { key: "task", label: "Создать задачу", icon: ListChecks },
    { key: "reminder", label: "Добавить напоминание", icon: Bell },
    { key: "link", label: "Скопировать ссылку", icon: Copy },
    { key: "pdf", label: "Экспорт в PDF", icon: Download },
  ];

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Вложения</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">{note.attachmentCount ?? 0}</span>
        </div>

        {note.attachments && note.attachments.length > 0 ? (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {note.attachments.map((attachment) => {
              const styles = calendarColorStyles[attachment.tone];
              return (
                <div
                  key={attachment.id}
                  className={cn(
                    "flex h-16 flex-col items-center justify-center gap-1 rounded-lg border",
                    styles.block,
                    styles.border,
                  )}
                >
                  <Paperclip size={14} className={styles.text} />
                  <span className={cn("text-[11px] font-medium", styles.text)}>{attachment.label}</span>
                </div>
              );
            })}
            {remainingAttachments > 0 && (
              <div className="flex h-16 items-center justify-center rounded-lg border border-gray-100 bg-gray-50 text-sm font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-400">
                +{remainingAttachments}
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Нет вложений</p>
        )}
      </section>

      <section className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Файлы</h3>
        {note.files && note.files.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {note.files.map((file) => (
              <li key={file.id} className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                  <File size={15} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{file.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{file.size}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Нет файлов</p>
        )}
      </section>

      <section className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Теги</h3>
          <button
            type="button"
            onClick={() => onAddTag(note)}
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Изменить
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium",
                calendarColorStyles[tagColor(tag)].block,
                calendarColorStyles[tagColor(tag)].text,
              )}
            >
              #{tag}
            </span>
          ))}
          <button
            type="button"
            onClick={() => onAddTag(note)}
            aria-label="Добавить тег"
            className="rounded-full border border-dashed border-gray-200 p-1 text-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <Plus size={12} />
          </button>
        </div>
      </section>

      <section className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Связано с</h3>
        {note.links ? (
          <div className="mt-2 space-y-3">
            {note.links.project && (
              <div className="flex items-center gap-2.5">
                <Folder size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Проект</p>
                  <p className="truncate text-sm font-medium text-blue-600 dark:text-blue-400">{note.links.project}</p>
                </div>
              </div>
            )}
            {note.links.task && (
              <div className="flex items-center gap-2.5">
                <ListChecks size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Задача</p>
                  <p className="truncate text-sm font-medium text-blue-600 dark:text-blue-400">{note.links.task}</p>
                </div>
              </div>
            )}
            {note.links.event && (
              <div className="flex items-center gap-2.5">
                <Calendar size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Событие</p>
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{note.links.event.title}</p>
                  <p className="truncate text-xs text-gray-400 dark:text-gray-500">{note.links.event.dateLabel}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Ничего не связано</p>
        )}
      </section>

      <section className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Быстрые действия</h3>
        <div className="mt-2 space-y-1">
          {quickActions.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => onQuickAction(label, note)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
