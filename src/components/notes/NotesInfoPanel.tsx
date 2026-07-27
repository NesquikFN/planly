"use client";

import { useRef } from "react";
import { Calendar, Copy, Download, File, Folder, ListChecks, Paperclip, Plus, Bell, Trash2, Eye } from "lucide-react";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { formatFileSize, attachmentToFileMeta } from "@/lib/notes";
import { cn } from "@/lib/utils";
import type { CalendarColor } from "@/types/calendar";
import type { CalendarEvent } from "@/types/calendar";
import type { Note, NoteAttachment, NoteLinks, NoteTagDef } from "@/types/note";
import type { Project } from "@/types/project";
import type { Task } from "@/types/task";
import type { Reminder } from "@/types/reminder";
import type { ArchiveItem } from "@/types/archive";

interface NotesInfoPanelProps {
  note: Note | null;
  tagDefs: NoteTagDef[];
  tagColorFor: (label: string) => CalendarColor;
  projects: Project[];
  tasks: Task[];
  events: CalendarEvent[];
  reminders: Reminder[];
  archiveItems: ArchiveItem[];
  onAddTag: (id: string, label: string) => void;
  onRemoveTag: (id: string, label: string) => void;
  onRecolorTag: (label: string, color: CalendarColor) => void;
  onAddAttachment: (id: string, attachment: NoteAttachment) => void;
  onRemoveAttachment: (id: string, attachmentId: string) => void;
  onSetLink: (id: string, key: keyof NoteLinks, value: string | undefined) => void;
  onCreateTaskFromNote: (note: Note) => void;
  onCopyLink: (note: Note) => void;
  onOpenReminders: () => void;
}

const selectClassName =
  "w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200";

export function NotesInfoPanel({
  note,
  tagDefs,
  tagColorFor,
  projects,
  tasks,
  events,
  reminders,
  archiveItems,
  onAddTag,
  onRemoveTag,
  onRecolorTag,
  onAddAttachment,
  onRemoveAttachment,
  onSetLink,
  onCreateTaskFromNote,
  onCopyLink,
  onOpenReminders,
}: NotesInfoPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!note) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-white text-center dark:border-gray-800 dark:bg-gray-900">
        <Paperclip size={22} className="text-gray-300 dark:text-gray-600" />
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Нет данных</p>
      </div>
    );
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !note) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onAddAttachment(note.id, attachmentToFileMeta(file, reader.result));
    };
    reader.readAsDataURL(file);
  }

  function downloadAttachment(attachment: NoteAttachment) {
    const link = document.createElement("a");
    link.href = attachment.dataUrl;
    link.download = attachment.name;
    link.click();
  }

  function viewAttachment(attachment: NoteAttachment) {
    window.open(attachment.dataUrl, "_blank", "noopener,noreferrer");
  }

  const quickActions = [
    { key: "task", label: "Создать задачу", icon: ListChecks, onClick: () => onCreateTaskFromNote(note) },
    { key: "reminder", label: "Добавить напоминание", icon: Bell, onClick: onOpenReminders },
    { key: "link", label: "Скопировать ссылку", icon: Copy, onClick: () => onCopyLink(note) },
    { key: "pdf", label: "Экспорт в PDF", icon: Download, onClick: () => window.print() },
  ];
  const archivedLabel = (entityType: ArchiveItem["entityType"], id?: string) =>
    id ? archiveItems.find((item) => item.entityType === entityType && item.entityId === id)?.title : undefined;
  const archivedProject = note.links.projectId && !projects.some((item) => item.id === note.links.projectId)
    ? archivedLabel("project", note.links.projectId) : undefined;
  const archivedTask = note.links.taskId && !tasks.some((item) => item.id === note.links.taskId)
    ? archivedLabel("task", note.links.taskId) : undefined;
  const archivedEvent = note.links.eventId && !events.some((item) => item.id === note.links.eventId)
    ? archivedLabel("event", note.links.eventId) : undefined;
  const archivedReminder = note.links.reminderId && !reminders.some((item) => item.id === note.links.reminderId)
    ? archivedLabel("reminder", note.links.reminderId) : undefined;

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <section>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Вложения</h3>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            Добавить
          </button>
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
        </div>

        {note.attachments.length > 0 ? (
          <ul className="mt-2 space-y-2">
            {note.attachments.map((attachment) => (
              <li key={attachment.id} className="flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/70">
                {attachment.mimeType.startsWith("image/") ? (
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element -- data URL, not an optimizable asset */}
                    <img src={attachment.dataUrl} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    <File size={15} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{attachment.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatFileSize(attachment.size)}</p>
                </div>
                <button type="button" onClick={() => viewAttachment(attachment)} aria-label="Просмотреть" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700">
                  <Eye size={14} />
                </button>
                <button type="button" onClick={() => downloadAttachment(attachment)} aria-label="Скачать" className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700">
                  <Download size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(note.id, attachment.id)}
                  aria-label="Удалить вложение"
                  className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Нет вложений</p>
        )}
      </section>

      <section className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Теги</h3>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className={cn(
                "group flex h-7 items-center gap-1 rounded-full border border-transparent pl-2.5 pr-1 text-xs font-medium",
                calendarColorStyles[tagColorFor(tag)].block,
                calendarColorStyles[tagColorFor(tag)].text,
              )}
            >
              #{tag}
              <select value={tagColorFor(tag)} onChange={(event) => onRecolorTag(tag, event.target.value as CalendarColor)} aria-label={`Цвет тега ${tag}`} className="h-5 w-5 shrink-0 appearance-none rounded-full border border-current bg-transparent opacity-60">
                {(["blue", "green", "purple", "orange", "pink", "red", "teal", "indigo"] as CalendarColor[]).map((color) => <option key={color} value={color}>{color}</option>)}
              </select>
              <button type="button" onClick={() => onRemoveTag(note.id, tag)} aria-label={`Убрать тег ${tag}`} className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full opacity-40 hover:opacity-100">
                ×
              </button>
            </span>
          ))}
        </div>
        {tagDefs.filter((tag) => !note.tags.includes(tag.label)).length > 0 && (
          <select
            value=""
            onChange={(event) => {
              if (event.target.value) onAddTag(note.id, event.target.value);
            }}
            className={cn(selectClassName, "mt-2")}
          >
            <option value="">Добавить существующий тег…</option>
            {tagDefs
              .filter((tag) => !note.tags.includes(tag.label))
              .map((tag) => (
                <option key={tag.label} value={tag.label}>
                  {tag.label}
                </option>
              ))}
          </select>
        )}
      </section>

      <section className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Связано с</h3>
        <div className="mt-2 space-y-3">
          <div className="flex items-center gap-2.5">
            <Folder size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />
            <select
              value={note.links.projectId ?? ""}
              onChange={(event) => onSetLink(note.id, "projectId", event.target.value || undefined)}
              className={selectClassName}
            >
              <option value="">Проект не выбран</option>
              {archivedProject && <option value={note.links.projectId} disabled>{archivedProject} — недоступен (в архиве)</option>}
              {projects.filter((project) => !project.archived).map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2.5">
            <ListChecks size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />
            <select
              value={note.links.taskId ?? ""}
              onChange={(event) => onSetLink(note.id, "taskId", event.target.value || undefined)}
              className={selectClassName}
            >
              <option value="">Задача не выбрана</option>
              {archivedTask && <option value={note.links.taskId} disabled>{archivedTask} — недоступна (в архиве)</option>}
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.completed ? "✓ " : ""}
                  {task.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />
            <select
              value={note.links.eventId ?? ""}
              onChange={(event) => onSetLink(note.id, "eventId", event.target.value || undefined)}
              className={selectClassName}
            >
              <option value="">Событие не выбрано</option>
              {archivedEvent && <option value={note.links.eventId} disabled>{archivedEvent} — недоступно (в архиве)</option>}
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} — {event.date} {event.startTime}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2.5">
            <Bell size={15} className="shrink-0 text-gray-400 dark:text-gray-500" />
            <select
              value={note.links.reminderId ?? ""}
              onChange={(event) => onSetLink(note.id, "reminderId", event.target.value || undefined)}
              className={selectClassName}
            >
              <option value="">Напоминание не выбрано</option>
              {archivedReminder && <option value={note.links.reminderId} disabled>{archivedReminder} — недоступно (в архиве)</option>}
              {reminders.map((reminder) => <option key={reminder.id} value={reminder.id}>{reminder.title}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 pt-4 dark:border-gray-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Быстрые действия</h3>
        <div className="mt-2 space-y-1">
          {quickActions.map(({ key, label, icon: Icon, onClick }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
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
