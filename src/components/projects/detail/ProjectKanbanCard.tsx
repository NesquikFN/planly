"use client";

import type { DragEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { PROJECT_TASK_PRIORITY_DOT } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { ProjectMember, ProjectTask } from "@/types/project";

const PRIORITY_TITLE: Record<ProjectTask["priority"], string> = {
  low: "Низкий приоритет",
  medium: "Средний приоритет",
  high: "Высокий приоритет",
};

interface ProjectKanbanCardProps {
  task: ProjectTask;
  assignee?: ProjectMember;
  onDragStart: (event: DragEvent<HTMLDivElement>, taskId: string) => void;
}

export function ProjectKanbanCard({ task, assignee, onDragStart }: ProjectKanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={(event) => onDragStart(event, task.id)}
      className="cursor-grab select-none rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-50">{task.title}</p>
        <span
          className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", PROJECT_TASK_PRIORITY_DOT[task.priority])}
          title={PRIORITY_TITLE[task.priority]}
        />
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        {task.dueLabel ? (
          <span className="text-xs text-gray-400 dark:text-gray-500">{task.dueLabel}</span>
        ) : (
          <span className="text-xs text-gray-300 dark:text-gray-700">—</span>
        )}
        {assignee && <Avatar name={assignee.name} size={20} />}
      </div>
    </div>
  );
}
