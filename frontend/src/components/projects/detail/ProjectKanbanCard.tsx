"use client";

import { useState, type DragEvent } from "react";
import { Archive, Check, Pencil, Trash2, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { PlanlyDatePicker } from "@/components/ui/PlanlyDatePicker";
import { PROJECT_TASK_PRIORITY_DOT } from "@/lib/projects";
import { formatShortDate, fromISODate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { Project, ProjectMember, ProjectTask, ProjectTaskPriority } from "@/types/project";

const PRIORITY_TITLE: Record<ProjectTask["priority"], string> = {
  low: "Низкий приоритет",
  medium: "Средний приоритет",
  high: "Высокий приоритет",
};

interface ProjectKanbanCardProps {
  task: ProjectTask;
  project: Project;
  assignee?: ProjectMember;
  draggable: boolean;
  onDragStart: (event: DragEvent<HTMLDivElement>, taskId: string) => void;
  onUpdate: (patch: Partial<ProjectTask>) => void;
  onDelete: () => void;
  onArchive: () => void;
  editable: boolean;
  /** Shown only in the flat List view, where cards aren't grouped by column. */
  statusLabel?: string;
}

export function ProjectKanbanCard({
  task,
  project,
  assignee,
  draggable,
  onDragStart,
  onUpdate,
  onDelete,
  onArchive,
  editable,
  statusLabel,
}: ProjectKanbanCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<ProjectTaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string | null>(task.assigneeId);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");

  function startEdit() {
    setTitle(task.title);
    setPriority(task.priority);
    setAssigneeId(task.assigneeId);
    setDueDate(task.dueDate ?? "");
    setIsEditing(true);
  }

  function save() {
    onUpdate({
      title: title.trim() || task.title,
      priority,
      assigneeId,
      dueDate: dueDate || null,
      dueLabel: dueDate ? formatShortDate(fromISODate(dueDate)) : null,
    });
    setIsEditing(false);
  }

  if (isEditing) {
    return (
      <div className="space-y-2 rounded-xl border border-accent/30 bg-white p-3 shadow-sm dark:shadow-none dark:border-accent/40 dark:bg-surface">
        <input
          autoFocus
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
        />
        <div className="grid grid-cols-2 gap-1.5">
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as ProjectTaskPriority)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
          >
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
          <select
            value={assigneeId ?? ""}
            onChange={(event) => setAssigneeId(event.target.value || null)}
            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim"
          >
            <option value="">Без исполнителя</option>
            {project.members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
        <PlanlyDatePicker value={dueDate} onChange={setDueDate} placeholder="Дедлайн" className="text-xs" />
        <div className="flex justify-end gap-1.5 pt-1">
          <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-2">
            <X size={14} />
          </button>
          <button type="button" onClick={save} className="rounded-lg bg-accent p-1.5 text-white hover:bg-accent/90">
            <Check size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? (event) => onDragStart(event, task.id) : undefined}
      className={cn(
        "select-none rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:shadow-none transition-colors hover:border-gray-200 dark:border-white/[0.06] dark:bg-surface dark:hover:border-white/10",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-ink">{task.title}</p>
        <span
          className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", PROJECT_TASK_PRIORITY_DOT[task.priority])}
          title={PRIORITY_TITLE[task.priority]}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-ink-faint">
          {statusLabel && <span className="rounded bg-gray-100 px-1.5 py-0.5 dark:bg-surface-2">{statusLabel}</span>}
          {task.dueLabel ?? "—"}
        </span>
        {assignee && <Avatar name={assignee.name} size={20} />}
      </div>

      {editable && (
        <div className="mt-2 flex justify-end gap-1 border-t border-gray-100 pt-2 dark:border-white/8">
          <button type="button" onClick={startEdit} title="Редактировать" className="p-1 text-gray-400 hover:text-accent">
            <Pencil size={13} />
          </button>
          {task.status === "done" && (
            <button type="button" onClick={onArchive} title="Архивировать" className="p-1 text-gray-400 hover:text-accent">
              <Archive size={13} />
            </button>
          )}
          <button type="button" onClick={onDelete} title="Удалить" className="p-1 text-gray-400 hover:text-red-500">
            <Trash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
