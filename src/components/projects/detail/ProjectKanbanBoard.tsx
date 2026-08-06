"use client";

import { useMemo, useState, type DragEvent, type FormEvent } from "react";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { ProjectKanbanCard } from "@/components/projects/detail/ProjectKanbanCard";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { PROJECT_TASK_STATUSES, PROJECT_TASK_STATUS_LABELS, getMemberById, groupTasksByStatus } from "@/lib/projects";
import { BUTTON_PRIMARY } from "@/lib/ui-tokens";
import { cn } from "@/lib/utils";
import type { Project, ProjectTask, ProjectTaskPriority, ProjectTaskStatus } from "@/types/project";

const COLUMN_ACCENT: Record<ProjectTaskStatus, string> = {
  todo: "bg-gray-300 dark:bg-white/20",
  inProgress: "bg-accent",
  review: "bg-amber-400",
  done: "bg-emerald-400",
};

const PRIORITY_LABELS: Record<ProjectTaskPriority, string> = { low: "Низкий", medium: "Средний", high: "Высокий" };

type BoardView = "kanban" | "list";

interface ProjectKanbanBoardProps {
  project: Project;
  onMoveTask: (taskId: string, status: ProjectTaskStatus) => void;
  onAddTask: (title: string) => void;
  onUpdateTask: (taskId: string, patch: Partial<ProjectTask>) => void;
  onDeleteTask: (taskId: string, archive: boolean) => void;
  editable: boolean;
}

export function ProjectKanbanBoard({ project, onMoveTask, onAddTask, onUpdateTask, onDeleteTask, editable }: ProjectKanbanBoardProps) {
  const [dragOverColumn, setDragOverColumn] = useState<ProjectTaskStatus | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [view, setView] = useState<BoardView>("kanban");
  const [search, setSearch] = useState("");
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<ProjectTaskPriority | null>(null);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return project.tasks.filter((task) => {
      if (query && !task.title.toLowerCase().includes(query)) return false;
      if (assigneeFilter && task.assigneeId !== assigneeFilter) return false;
      if (priorityFilter && task.priority !== priorityFilter) return false;
      return true;
    });
  }, [project.tasks, search, assigneeFilter, priorityFilter]);

  const groups = groupTasksByStatus(filteredTasks);
  const hasFilters = Boolean(search.trim() || assigneeFilter || priorityFilter);

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
    setComposerOpen(false);
  }

  const assigneeLabel = assigneeFilter ? getMemberById(project, assigneeFilter)?.name ?? "Исполнитель" : "Исполнитель";
  const priorityLabel = priorityFilter ? PRIORITY_LABELS[priorityFilter] : "Приоритет";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-gray-900 dark:text-ink">Задачи проекта</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:bg-surface-2 dark:text-ink-faint">
            {filteredTasks.length}
          </span>
        </div>

        {editable && (
          <button
            type="button"
            onClick={() => setComposerOpen((v) => !v)}
            className={cn(BUTTON_PRIMARY, "px-3.5 py-2")}
          >
            <Plus size={15} />
            Новая задача
          </button>
        )}
      </div>

      {composerOpen && editable && (
        <form onSubmit={handleAddTask} className="flex items-center gap-2">
          <input
            autoFocus
            type="text"
            value={newTaskTitle}
            onChange={(event) => setNewTaskTitle(event.target.value)}
            placeholder="Название задачи..."
            className="w-full max-w-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim dark:focus:border-white/20"
          />
          <button type="submit" className={cn(BUTTON_PRIMARY, "px-3 py-2")}>
            Добавить
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-ink-faint" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск задач..."
            className="w-full rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-2 text-xs text-gray-700 focus:outline-none dark:border-white/8 dark:bg-surface-2 dark:text-ink-dim dark:focus:border-white/20"
          />
        </div>

        <DropdownMenu
          trigger={<span className={assigneeFilter ? "text-accent" : undefined}>{assigneeLabel} ▾</span>}
          triggerClassName="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2"
          items={[
            { key: "all", label: "Все исполнители", active: !assigneeFilter, onSelect: () => setAssigneeFilter(null) },
            ...project.members.map((member) => ({
              key: member.id,
              label: member.name,
              active: assigneeFilter === member.id,
              onSelect: () => setAssigneeFilter(member.id),
            })),
          ]}
        />

        <DropdownMenu
          trigger={<span className={priorityFilter ? "text-accent" : undefined}>{priorityLabel} ▾</span>}
          triggerClassName="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-white/8 dark:text-ink-dim dark:hover:bg-surface-2"
          items={[
            { key: "all", label: "Любой приоритет", active: !priorityFilter, onSelect: () => setPriorityFilter(null) },
            ...(Object.keys(PRIORITY_LABELS) as ProjectTaskPriority[]).map((priority) => ({
              key: priority,
              label: PRIORITY_LABELS[priority],
              active: priorityFilter === priority,
              onSelect: () => setPriorityFilter(priority),
            })),
          ]}
        />

        <div className="ml-auto flex items-center rounded-lg border border-gray-200 p-0.5 dark:border-white/8">
          <button
            type="button"
            onClick={() => setView("kanban")}
            aria-pressed={view === "kanban"}
            aria-label="Kanban"
            className={cn("rounded-md p-1.5", view === "kanban" ? "bg-gray-100 text-gray-900 dark:bg-surface-2 dark:text-ink" : "text-gray-400")}
          >
            <LayoutGrid size={14} />
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-pressed={view === "list"}
            aria-label="Список"
            className={cn("rounded-md p-1.5", view === "list" ? "bg-gray-100 text-gray-900 dark:bg-surface-2 dark:text-ink" : "text-gray-400")}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {view === "kanban" ? (
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
                "flex min-h-[16rem] flex-col gap-3 rounded-xl p-1.5 transition-colors",
                dragOverColumn === status && "bg-accent/[0.04] ring-1 ring-accent/25",
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-1 pb-2 dark:border-white/8">
                <div className="flex items-center gap-2">
                  <span className={cn("h-1.5 w-1.5 rounded-full", COLUMN_ACCENT[status])} />
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-ink-faint">
                    {PROJECT_TASK_STATUS_LABELS[status]}
                  </h3>
                </div>
                <span className="text-xs tabular-nums text-gray-400 dark:text-ink-faint">{groups[status].length}</span>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {groups[status].map((task) => (
                  <ProjectKanbanCard
                    key={task.id}
                    task={task}
                    project={project}
                    assignee={getMemberById(project, task.assigneeId)}
                    draggable
                    onDragStart={handleDragStart}
                    onUpdate={(patch) => onUpdateTask(task.id, patch)}
                    onDelete={() => onDeleteTask(task.id, false)}
                    onArchive={() => onDeleteTask(task.id, true)}
                    editable={editable}
                  />
                ))}
                {groups[status].length === 0 && (
                  <p className="rounded-xl border border-dashed border-gray-200 px-2 py-4 text-center text-xs text-gray-400 dark:border-white/8 dark:text-ink-faint">
                    {hasFilters ? "Нет задач по фильтру" : "Перетащите карточку сюда"}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredTasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-gray-200 px-2 py-6 text-center text-xs text-gray-400 dark:border-white/8 dark:text-ink-faint">
              Нет задач по фильтру
            </p>
          ) : (
            PROJECT_TASK_STATUSES.flatMap((status) =>
              groups[status].map((task) => (
                <ProjectKanbanCard
                  key={task.id}
                  task={task}
                  project={project}
                  assignee={getMemberById(project, task.assigneeId)}
                  draggable={false}
                  onDragStart={handleDragStart}
                  onUpdate={(patch) => onUpdateTask(task.id, patch)}
                  onDelete={() => onDeleteTask(task.id, false)}
                  onArchive={() => onDeleteTask(task.id, true)}
                  editable={editable}
                  statusLabel={PROJECT_TASK_STATUS_LABELS[status]}
                />
              )),
            )
          )}
        </div>
      )}
    </div>
  );
}
