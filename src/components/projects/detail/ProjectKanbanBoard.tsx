"use client";

import { useState, type DragEvent, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { ProjectKanbanCard } from "@/components/projects/detail/ProjectKanbanCard";
import { PROJECT_TASK_STATUSES, PROJECT_TASK_STATUS_LABELS, getMemberById, groupTasksByStatus } from "@/lib/projects";
import { cn } from "@/lib/utils";
import type { Project, ProjectTaskStatus } from "@/types/project";

const COLUMN_ACCENT: Record<ProjectTaskStatus, string> = {
  todo: "bg-gray-300 dark:bg-gray-600",
  inProgress: "bg-blue-400",
  review: "bg-amber-400",
  done: "bg-emerald-400",
};

interface ProjectKanbanBoardProps {
  project: Project;
  onMoveTask: (taskId: string, status: ProjectTaskStatus) => void;
  onAddTask: (title: string) => void;
}

export function ProjectKanbanBoard({ project, onMoveTask, onAddTask }: ProjectKanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<ProjectTaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const groups = groupTasksByStatus(project.tasks);

  function handleDragStart(event: DragEvent<HTMLDivElement>, taskId: string) {
    event.dataTransfer.setData("text/plain", taskId);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, status: ProjectTaskStatus) {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    if (taskId) onMoveTask(taskId, status);
    setDragOverColumn(null);
  }

  function handleAddTask(event: FormEvent) {
    event.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle);
    setNewTaskTitle("");
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {PROJECT_TASK_STATUSES.map((status) => (
        <div
          key={status}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOverColumn(status);
          }}
          onDragLeave={() => setDragOverColumn((current) => (current === status ? null : current))}
          onDrop={(event) => handleDrop(event, status)}
          className={cn(
            "flex min-h-[16rem] flex-col rounded-2xl border border-gray-100 bg-gray-50/60 p-3 transition-colors dark:border-gray-800 dark:bg-gray-900/40",
            dragOverColumn === status && "border-blue-300 bg-blue-50/50 dark:border-blue-500/40 dark:bg-blue-500/5",
          )}
        >
          <div className="flex items-center gap-2 px-1 pb-2">
            <span className={cn("h-2 w-2 rounded-full", COLUMN_ACCENT[status])} />
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{PROJECT_TASK_STATUS_LABELS[status]}</h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">{groups[status].length}</span>
          </div>

          <div className="flex flex-1 flex-col gap-2">
            {groups[status].map((task) => (
              <ProjectKanbanCard
                key={task.id}
                task={task}
                assignee={getMemberById(project, task.assigneeId)}
                onDragStart={handleDragStart}
              />
            ))}
            {groups[status].length === 0 && (
              <p className="rounded-xl border border-dashed border-gray-200 px-2 py-4 text-center text-xs text-gray-400 dark:border-gray-800 dark:text-gray-500">
                Перетащите карточку сюда
              </p>
            )}
          </div>

          {status === "todo" && (
            <form onSubmit={handleAddTask} className="mt-2 flex items-center gap-1.5">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                placeholder="Новая задача..."
                className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
              <button
                type="submit"
                aria-label="Добавить задачу"
                className="shrink-0 rounded-lg bg-gray-100 p-1.5 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <Plus size={14} />
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
