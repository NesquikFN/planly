"use client";

import { CalendarDays, ListChecks, MoreVertical, Star } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { calendarColorStyles } from "@/lib/calendar-colors";
import { cn } from "@/lib/utils";
import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  variant: "grid" | "list";
  onToggleStar: (id: string) => void;
  onStubAction: (action: string, project: Project) => void;
}

export function ProjectCard({ project, variant, onToggleStar, onStubAction }: ProjectCardProps) {
  const Icon = project.icon;
  const styles = calendarColorStyles[project.color];

  const menuItems = [
    { key: "open", label: "Открыть" },
    { key: "rename", label: "Переименовать" },
    { key: "duplicate", label: "Дублировать" },
    { key: "archive", label: "Архивировать" },
    { key: "delete", label: "Удалить", destructive: true },
  ].map((item) => ({
    key: item.key,
    label: item.label,
    destructive: item.destructive,
    onSelect: () => onStubAction(item.label, project),
  }));

  const progressBar = (
    <div className="flex-1">
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={cn("h-1.5 rounded-full", styles.swatch)}
          style={{ width: `${project.progress}%` }}
        />
      </div>
    </div>
  );

  const starButton = (
    <button
      type="button"
      onClick={() => onToggleStar(project.id)}
      aria-pressed={project.starred}
      aria-label={project.starred ? "Убрать из избранного" : "Добавить в избранное"}
      className="shrink-0 rounded-lg p-1 text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-800"
    >
      <Star size={16} className={project.starred ? "fill-amber-400 text-amber-400" : undefined} />
    </button>
  );

  const menuButton = (
    <DropdownMenu
      trigger={<MoreVertical size={16} />}
      triggerClassName="shrink-0 rounded-lg p-1 text-gray-300 hover:bg-gray-50 hover:text-gray-500 dark:text-gray-600 dark:hover:bg-gray-800"
      triggerAriaLabel="Действия с проектом"
      items={menuItems}
    />
  );

  if (variant === "list") {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", styles.block)}>
          <Icon size={20} className={styles.text} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{project.name}</p>
          <p className="truncate text-xs text-gray-400 dark:text-gray-500">{project.description}</p>
        </div>

        <div className="hidden w-40 shrink-0 items-center gap-2 sm:flex">
          {progressBar}
          <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
            {project.progress}%
          </span>
        </div>

        <div className="hidden shrink-0 items-center gap-1 text-xs text-gray-400 md:flex dark:text-gray-500">
          <ListChecks size={14} />
          {project.tasksDone}/{project.tasksTotal}
        </div>

        <div className="hidden shrink-0 items-center gap-1 text-xs text-gray-400 lg:flex dark:text-gray-500">
          <CalendarDays size={14} />
          {project.deadlineLabel}
        </div>

        {starButton}
        {menuButton}
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", styles.block)}>
          <Icon size={20} className={styles.text} />
        </div>
        <div className="flex items-center gap-1">
          {starButton}
          {menuButton}
        </div>
      </div>

      <h3 className="mt-3 truncate text-sm font-semibold text-gray-900 dark:text-gray-50">{project.name}</h3>
      <p className="mt-1 line-clamp-2 text-xs text-gray-400 dark:text-gray-500">{project.description}</p>

      <div className="mt-4 flex items-center gap-2">
        {progressBar}
        <span className="w-9 shrink-0 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
          {project.progress}%
        </span>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span className="inline-flex items-center gap-1">
          <ListChecks size={14} />
          {project.tasksDone}/{project.tasksTotal} задач
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={14} />
          {project.deadlineLabel}
        </span>
      </div>
    </div>
  );
}
